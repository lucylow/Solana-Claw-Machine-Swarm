import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { mountSolanaIdentity } from "../solana";
import { mountMemoryReceipts } from "../memory";
import { mountPlanReceipts } from "../plans";
import { createSolanaBridge, mountSolanaBridge } from "../solana/bridgeMount";
import { OpenClawBridgeService, registerOpenClawBridgeRoutes } from "../openclaw/bridge";
import { createZeroGModule, registerZeroGRoutes } from "../zerog/routes";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  const { bridge } = await createSolanaBridge();
  const solana = await mountSolanaIdentity(app, { solanaBridge: bridge });
  const memory = await mountMemoryReceipts(app, {
    onchain: {
      createMemoryReceipt: async input => {
        const tx = await bridge.sendInstruction({
          walletAddress: input.wallet,
          action: "create_memory_receipt",
          subjectId: input.receiptId,
          payloadHash: input.reflectionHash,
          receiptId: input.receiptId,
          metadata: {
            summaryHash: input.summaryHash,
            nextActionHash: input.nextActionHash,
            storageRefHash: input.storageRefHash,
            sourceTurnIdHash: input.sourceTurnIdHash,
            parentReceiptIdHash: input.parentReceiptIdHash,
          },
        });
        if (tx.status === "failed" || !tx.txSignature) {
          throw new Error(tx.error || "memory_anchor_bridge_failed");
        }
        return { txSig: tx.txSignature, receiptAccount: tx.accountAddress };
      },
    },
  });
  const plans = await mountPlanReceipts(app, { solanaIdentityService: solana.service, solanaBridge: bridge });
  const zeroG = createZeroGModule();
  registerZeroGRoutes(app, zeroG);
  const openClawBridge = new OpenClawBridgeService();
  registerOpenClawBridgeRoutes(app, openClawBridge);
  await mountSolanaBridge(app, {
    bridge,
    identityService: solana.service,
    memoryService: memory.service,
    planReceiptService: plans.receiptService,
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

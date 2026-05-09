import path from "path";
import type express from "express";
import type { MemoryReceiptService } from "../memory";
import type { PlanReceiptService } from "../plans/PlanReceiptService";
import { SolanaBridgeService } from "./bridgeService";
import { SolanaIndexerStore } from "./indexerStore";
import { registerSolanaBridgeRoutes } from "./bridgeRoutes";
import type { SolanaIdentityService } from "./identityService";

export async function createSolanaBridge() {
  const store = new SolanaIndexerStore(
    path.join(process.cwd(), "data", "solana-indexer.json"),
  );
  await store.init();
  const bridge = new SolanaBridgeService(store);
  return { store, bridge };
}

export async function mountSolanaBridge(
  app: express.Express,
  deps: {
    identityService?: SolanaIdentityService;
    memoryService?: MemoryReceiptService;
    planReceiptService?: PlanReceiptService;
    bridge?: SolanaBridgeService;
  },
) {
  const created = deps.bridge ? undefined : await createSolanaBridge();
  const bridge = deps.bridge || created!.bridge;
  const store = created?.store;
  registerSolanaBridgeRoutes(app, {
    bridge,
    identityService: deps.identityService,
    memoryService: deps.memoryService,
    planReceiptService: deps.planReceiptService,
  });
  return { store, bridge };
}

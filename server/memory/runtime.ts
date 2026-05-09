import path from "path";
import { MemoryReceiptService } from "./service";
import { MemoryReceiptStore } from "./store";

let servicePromise: Promise<MemoryReceiptService> | null = null;

export async function getMemoryReceiptService(input?: {
  onchain?: {
    createMemoryReceipt(args: {
      receiptId: string;
      wallet: string;
      reflectionHash: string;
      summaryHash: string;
      nextActionHash: string;
      storageRefHash: string;
      sourceTurnIdHash: string;
      parentReceiptIdHash?: string;
      chainId: number;
    }): Promise<{ txSig: string; receiptAccount: string }>;
  };
}): Promise<MemoryReceiptService> {
  if (servicePromise) return servicePromise;

  servicePromise = (async () => {
    const store = new MemoryReceiptStore(
      path.join(process.cwd(), "data", "memory-receipts.json"),
    );
    await store.init();
    return new MemoryReceiptService(store, {
      chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
      defaultWallet: process.env.CLAW_DEFAULT_WALLET || "unknown_wallet",
      defaultVisibility: "workspace",
      onchain: input?.onchain,
    });
  })();

  return servicePromise;
}

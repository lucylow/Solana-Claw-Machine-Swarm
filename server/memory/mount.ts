import type express from "express";
import { registerMemoryRoutes } from "./routes";
import { getMemoryReceiptService } from "./runtime";

export async function mountMemoryReceipts(
  app: express.Express,
  options?: {
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
  }
) {
  const service = await getMemoryReceiptService({ onchain: options?.onchain });

  registerMemoryRoutes(app, service);
  return { service };
}

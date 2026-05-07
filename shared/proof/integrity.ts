import type { DaStatus, ProofIntegrityStatus, StorageStatus } from "../zerog";

/** Relayer/simulated txs from the MVP mirror store use this prefix — never advertise as explorer-verified. */
export function isDemoSimulatedTxSignature(txSignature?: string) {
  return Boolean(txSignature?.startsWith("SIM_"));
}

/**
 * Determines honest proof badges for mirrored receipts without claiming live confirmation.
 * Prefer this over vague “confirmed” wording in primary UI surfaces.
 */
export function inferProofIntegrity(input: {
  txSignature?: string;
  zerogMode: "live" | "mock" | "degraded";
  storageStatus?: StorageStatus;
  daStatus?: DaStatus;
  degradedFlags?: boolean;
}): ProofIntegrityStatus {
  if (input.degradedFlags) return "degraded";
  const storeBad = input.storageStatus === "failed" || input.storageStatus === "degraded";
  const daBad = input.daStatus === "failed" || input.daStatus === "degraded";
  if (storeBad || daBad) return "degraded";

  if (!input.txSignature) return input.zerogMode === "mock" ? "demo_only" : "pending";

  if (isDemoSimulatedTxSignature(input.txSignature)) return "demo_only";

  if (input.zerogMode !== "live") return "demo_only";

  /** Live mode still uses a deterministic mirror signature until RPC confirmation is wired. */
  return "pending";
}

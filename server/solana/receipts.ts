import type { SolanaProofReceipt } from "@shared/zerog";
import type { SolanaCluster, SolanaReceiptRecord } from "@shared/solana/types";

export function solanaProofToReceiptRecord(
  proof: SolanaProofReceipt,
  cluster: SolanaCluster,
  type: SolanaReceiptRecord["type"],
  explorerBase?: string
): SolanaReceiptRecord {
  const explorerUrl =
    explorerBase && proof.txSignature ? `${explorerBase.replace(/\/$/, "")}/tx/${proof.txSignature}` : undefined;
  return {
    id: proof.id,
    type,
    subjectId: proof.subjectId,
    wallet: proof.wallet,
    cluster,
    txSignature: proof.txSignature,
    account: proof.account,
    summaryHash: proof.summaryHash,
    status: proof.status,
    createdAt: proof.createdAt,
    explorerUrl,
    storageRef: proof.zeroGStorageRef,
    proofRef: proof.txSignature,
    daRoot: proof.zeroGAvailabilityRef,
  };
}

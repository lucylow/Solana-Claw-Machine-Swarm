import { SOLANA_CLUSTER, SOLANA_EXPLORER_BASE } from "./config";
import type { SolanaCluster } from "./types";

export function createSolanaExplorerUrl(
  kind: "tx" | "address",
  value: string,
  cluster: SolanaCluster = SOLANA_CLUSTER,
) {
  const safe = value.trim();
  if (!safe) return "";
  const path = kind === "tx" ? "tx" : "address";
  return `${SOLANA_EXPLORER_BASE}/${path}/${safe}?cluster=${cluster}`;
}

export function buildExplorerTxUrl(
  signature: string,
  cluster: SolanaCluster,
): string {
  return createSolanaExplorerUrl("tx", signature, cluster);
}

export function buildExplorerAddressUrl(
  address: string,
  cluster: SolanaCluster,
): string {
  return createSolanaExplorerUrl("address", address, cluster);
}

export function txExplorerUrl(
  signature?: string | null,
  cluster: SolanaCluster = SOLANA_CLUSTER,
) {
  if (!signature) return "";
  return createSolanaExplorerUrl("tx", signature, cluster);
}

export function addressExplorerUrl(
  address?: string | null,
  cluster: SolanaCluster = SOLANA_CLUSTER,
) {
  if (!address) return "";
  return createSolanaExplorerUrl("address", address, cluster);
}

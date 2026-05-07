import type { SolanaCluster } from "@shared/solana/types";

const DEFAULT_BASE = "https://explorer.solana.com";

export function explorerBaseUrl(): string {
  return process.env.SOLANA_EXPLORER_BASE || DEFAULT_BASE;
}

export function buildExplorerTxUrl(signature: string, cluster: SolanaCluster): string {
  const base = explorerBaseUrl().replace(/\/$/, "");
  return `${base}/tx/${signature}?cluster=${cluster}`;
}

export function buildExplorerAddressUrl(address: string, cluster: SolanaCluster): string {
  const base = explorerBaseUrl().replace(/\/$/, "");
  return `${base}/address/${address}?cluster=${cluster}`;
}

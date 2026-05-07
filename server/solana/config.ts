import type { SolanaCluster } from "@shared/solana/types";

function clusterFromEnv(): SolanaCluster {
  const c = (process.env.SOLANA_CLUSTER || process.env.CLAW_SOLANA_CLUSTER || "devnet").toLowerCase();
  if (c === "mainnet" || c === "mainnet-beta") return "mainnet-beta";
  if (c === "testnet") return "testnet";
  if (c === "localnet" || c === "localhost") return "localnet";
  return "devnet";
}

export function getServerSolanaCluster(): SolanaCluster {
  return clusterFromEnv();
}

export function getServerSolanaRpcUrl(cluster: SolanaCluster = getServerSolanaCluster()): string {
  const override = process.env.SOLANA_RPC_URL || process.env.CLAW_SOLANA_RPC_URL;
  if (override) return override;
  const map: Record<SolanaCluster, string> = {
    "mainnet-beta": "https://api.mainnet-beta.solana.com",
    devnet: "https://api.devnet.solana.com",
    testnet: "https://api.testnet.solana.com",
    localnet: "http://127.0.0.1:8899",
  };
  return map[cluster];
}

export function clusterLabel(cluster: SolanaCluster): string {
  switch (cluster) {
    case "mainnet-beta":
      return "Solana Mainnet";
    case "devnet":
      return "Solana Devnet";
    case "testnet":
      return "Solana Testnet";
    case "localnet":
      return "Solana Localnet";
    default:
      return cluster;
  }
}

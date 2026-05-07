import { useMemo } from "react";
import { addressExplorerUrl, txExplorerUrl } from "@/lib/solana/explorer";
import { useSolanaWallet } from "./useSolanaWallet";

export function useSolanaExplorer() {
  const wallet = useSolanaWallet();
  return useMemo(
    () => ({
      walletExplorerUrl: addressExplorerUrl(wallet.walletAddress || undefined),
      latestTxExplorerUrl: txExplorerUrl(wallet.latestSignature || undefined),
      cluster: wallet.cluster,
    }),
    [wallet.cluster, wallet.latestSignature, wallet.walletAddress]
  );
}

import { useMemo } from "react";
import { addressExplorerUrl, txExplorerUrl } from "@/lib/solana/explorer";
import { useSolanaWallet } from "./useSolanaWallet";

export function useSolanaExplorer() {
  const wallet = useSolanaWallet();
  return useMemo(() => {
    const anchored = wallet.txHistory.find(r => r.explorerUrl && r.txSignature);
    return {
      walletExplorerUrl: addressExplorerUrl(wallet.walletAddress || undefined),
      latestTxExplorerUrl: anchored?.explorerUrl || txExplorerUrl(anchored?.txSignature || undefined),
      cluster: wallet.cluster,
    };
  }, [wallet.cluster, wallet.txHistory, wallet.walletAddress]);
}

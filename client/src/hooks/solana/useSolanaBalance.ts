import { useMemo } from "react";
import { formatSolBalance } from "@/lib/solana/format";
import { useSolanaWallet } from "./useSolanaWallet";

export function useSolanaBalance() {
  const wallet = useSolanaWallet();
  return useMemo(
    () => ({
      balanceSol: wallet.balanceSol,
      balanceLabel: formatSolBalance(wallet.balanceSol),
      loading: wallet.state === "balance_loading",
    }),
    [wallet.balanceSol, wallet.state]
  );
}

import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";

export function useSolanaWallet() {
  return useSolanaWalletContext();
}

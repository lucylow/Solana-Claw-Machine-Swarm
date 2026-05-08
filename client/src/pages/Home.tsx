import DappLanding from "@/components/dapp/DappLanding";

/**
 * Solana dApp landing.
 *
 * Wallet is identity, transactions are visible, proof + receipts are
 * first-class objects. The legacy `SwarmLanding` is kept around for
 * deeper feature pages but is no longer the entry point.
 */
export default function Home() {
  return <DappLanding />;
}

import { useAuth } from "@/_core/hooks/useAuth";
import SwarmCommandCenter from "@/components/swarm/SwarmCommandCenter";
import { Card } from "@/components/ui/card";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { Cpu } from "lucide-react";

export default function Dashboard() {
  const { loading } = useAuth();
  const wallet = useSolanaWallet();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020508] p-6 text-cyan-300">
        <div className="container py-8">
          <Card
            className="border-white/10 bg-black/40 p-6 text-slate-300"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                <Cpu className="h-5 w-5 animate-spin text-cyan-300" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-slate-100">Syncing Solana command center</p>
                <p className="mt-1 text-sm text-slate-400">
                  Loading session, skills, run index, and Solana receipt summaries for your wallet.
                </p>
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-cyan-400/40" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <SwarmCommandCenter walletAddress={wallet.walletAddress || undefined} />;
}

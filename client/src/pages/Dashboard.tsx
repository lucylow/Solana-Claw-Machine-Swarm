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
        <div className="container">
          <Card className="border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 animate-spin" />
              Syncing command center — runs, skills, and receipt index...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <SwarmCommandCenter walletAddress={wallet.walletAddress || undefined} />;
}

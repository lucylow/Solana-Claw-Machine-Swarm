import { useAuth } from "@/_core/hooks/useAuth";
import SwarmLanding from "@/components/swarm/SwarmLanding";
import { Card } from "@/components/ui/card";
import { Cpu } from "lucide-react";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020508] p-6">
        <div className="container py-12">
          <Card className="border-white/10 bg-black/40 p-4 text-slate-300">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 animate-spin text-[#3bff96]" />
              Initializing Solana autonomous agent command center...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <SwarmLanding isAuthenticated={isAuthenticated} />;
}

import { useAuth } from "@/_core/hooks/useAuth";
import { SolanaIdentityDashboard } from "@/components/SolanaIdentityDashboard";
import { SolanaIdentityGate } from "@/components/SolanaIdentityGate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { SOLANA_CLUSTER, SOLANA_RPC_URL } from "@/solana/constants";
import { useSolanaIdentity } from "@/solana/useSolanaIdentity";
import { Cpu, Link2, Rocket, Shield, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const identity = useSolanaIdentity();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Cpu className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="mt-4 text-cyan-400">Initializing SWARM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <header className="relative z-10 border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-cyan-500" />
            <h1 className="text-2xl font-black text-cyan-200 tracking-wide">CLAW MACHINE</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#features" className="hover:text-cyan-400 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition">
              How It Works
            </a>
          </nav>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <SolanaIdentityGate identity={identity} />

        <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 to-black p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-4">
              <div className="text-xs uppercase text-slate-400">Network</div>
              <div className="mt-2 text-lg font-semibold text-cyan-100">{SOLANA_CLUSTER}</div>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-4">
              <div className="text-xs uppercase text-slate-400">Identity status</div>
              <div className="mt-2 text-lg font-semibold text-cyan-100">{identity.status}</div>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-4">
              <div className="text-xs uppercase text-slate-400">Wallet receipts</div>
              <div className="mt-2 text-lg font-semibold text-cyan-100">{identity.receipts.length}</div>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-4">
              <div className="text-xs uppercase text-slate-400">RPC endpoint</div>
              <div className="mt-2 text-sm font-medium text-cyan-100 break-all">{SOLANA_RPC_URL}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <SolanaIdentityDashboard
            skills={identity.skills}
            memories={identity.memories}
            receipts={identity.receipts}
          />

          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5">
              <h3 className="text-xl font-semibold text-cyan-200">Why this is the gateway</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li className="flex gap-2">
                  <ShieldCheck className="h-4 w-4 mt-0.5 text-cyan-300" />
                  Wallet signature is the first trust proof in the product.
                </li>
                <li className="flex gap-2">
                  <Workflow className="h-4 w-4 mt-0.5 text-cyan-300" />
                  Verified identity unlocks skills, memory, and receipts in one step.
                </li>
                <li className="flex gap-2">
                  <Link2 className="h-4 w-4 mt-0.5 text-cyan-300" />
                  Receipts map wallet activity to on-chain traceability.
                </li>
                <li className="flex gap-2">
                  <Cpu className="h-4 w-4 mt-0.5 text-cyan-300" />
                  Agent context persists per wallet so the next run improves.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5">
              <h3 className="text-xl font-semibold text-cyan-200">Next actions</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-200"
                  onClick={() => setLocation("/skills")}
                >
                  Open skills registry
                </Button>
                <Button
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-200"
                  onClick={() => setLocation("/receipts")}
                >
                  Explore receipts
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative z-10 py-8">
          <h3 className="text-3xl font-bold text-center mb-8 text-cyan-400">Core Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Cpu className="w-8 h-8" />,
                title: "Multi-Agent Orchestration",
                desc: "Coordinate multiple AI agents with real-time task distribution",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "On-Chain Receipts",
                desc: "Anchor plans, executions, reflections, and memory on Solana",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "OpenClaw Bridge",
                desc: "Import tools as CLAW skills and export compatible manifests",
              },
              {
                icon: <Rocket className="w-8 h-8" />,
                title: "Solana Native",
                desc: "Built for Solana devnet with instant finality and low fees",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="bg-black/50 border-cyan-500/30 hover:border-cyan-500/60 transition p-6"
              >
                <div className="text-cyan-400 mb-4">{feature.icon}</div>
                <h4 className="text-lg font-bold mb-2 text-cyan-300">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

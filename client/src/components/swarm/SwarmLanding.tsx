import { Button } from "@/components/ui/button";
import { useSolanaSession } from "@/hooks/solana/useSolanaSession";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { addressExplorerUrl } from "@/lib/solana/explorer";
import { formatSessionExpiry, shortenAddress } from "@/lib/solana/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  Link2,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

const LOOP_STEPS = [
  "Connect Wallet",
  "Choose Skill",
  "Agent Chooses Skills",
  "Policy Check",
  "Execute",
  "Reflect",
  "Memory Written",
  "Proof Anchored",
  "Future Runs Improve",
];

const EXECUTION_LOG = [
  "wallet.authorize -> authority confirmed",
  "planner.select_skills -> Signal Researcher, Execution Operator, Failure Critic",
  "policy.evaluate -> review_required (confidence < threshold)",
  "operator.execute -> step[2] failed: stale context window",
  "critic.reflect -> corrective strategy emitted",
  "memory.write -> promoted memory to high-priority tier",
  "solana.anchor -> decision, reflection, memory receipt chain confirmed",
  "next_run.bootstrap -> confidence +16 from memory reuse",
];

const AUTONOMY_BANDS = [
  "Automation Only",
  "Assisted",
  "Guided",
  "Policy-Gated",
  "Meaningful Agency",
  "Near Autonomous",
  "Fully Autonomous",
];

const AGENT_LANES = [
  { role: "Planner", level: "Policy-Gated", memory: 41, proofs: 227, reputation: 79 },
  { role: "Researcher", level: "Guided", memory: 37, proofs: 201, reputation: 76 },
  { role: "Operator", level: "Meaningful Agency", memory: 54, proofs: 298, reputation: 88 },
  { role: "Critic", level: "Policy-Gated", memory: 62, proofs: 265, reputation: 82 },
  { role: "Coordinator", level: "Near Autonomous", memory: 47, proofs: 304, reputation: 85 },
];

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-[#070b11]/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)]", className)}>
      {children}
    </div>
  );
}

export default function SwarmLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [, setLocation] = useLocation();
  const loop = useMemo(() => LOOP_STEPS, []);
  const wallet = useSolanaWallet();
  const session = useSolanaSession();

  return (
    <div className="min-h-screen bg-[#030507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(36,208,170,0.17),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(20,120,160,0.15),transparent_35%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3bff96]" />
            <span className="font-semibold tracking-wide text-[#ddffe8]">CLAW MACHINE SWARM</span>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-[#3bff96] text-black hover:bg-[#6bffbc]" onClick={() => setLocation("/dashboard")}>
              Launch Command Center
            </Button>
            <Button
              variant="outline"
              className="border-[#3bff96]/60 text-[#b8ffe0]"
              onClick={() => wallet.connectAndVerify().catch(() => undefined)}
            >
              {session.isVerified ? "Session Verified" : "Connect Solana Wallet"}
            </Button>
            <Button variant="outline" className="border-[#38d7d0]/40 text-[#9dfbf5]" onClick={() => setLocation("/dashboard")}>
              Watch Live Agent Replay
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-10 py-10 md:space-y-14 md:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="relative overflow-hidden">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#30f7a2]/10 blur-3xl" />
            <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">Solana-native autonomous infrastructure</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
              Autonomous AI Agents With Verifiable Memory on Solana
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
              Agents that plan, execute, reflect, learn, and anchor proof onchain.
            </p>
            <div className="mt-4 rounded-xl border border-[#3bff96]/30 bg-[#08130f] p-3 text-xs text-[#d1ffe8]">
              Wallet: {wallet.walletAddress ? shortenAddress(wallet.walletAddress, 8, 8) : "Not connected"} | Session:{" "}
              {wallet.state} | {formatSessionExpiry(wallet.sessionProfile?.expiresAt)}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="bg-[#3bff96] text-black hover:bg-[#6bffbc]" onClick={() => setLocation("/dashboard")}>
                Launch Command Center
              </Button>
              <Button
                variant="outline"
                className="border-[#3bff96]/60 text-[#c8ffe2]"
                onClick={() => wallet.connectAndVerify().catch(() => undefined)}
              >
                {session.isVerified ? "Refresh Solana Session" : "Connect Wallet + Sign Session"}
              </Button>
              <Button variant="outline" className="border-white/20 text-white" onClick={() => setLocation("/dashboard")}>
                <PlayCircle className="mr-1.5 h-4 w-4 text-[#40e9d8]" />
                Watch Live Agent Replay
              </Button>
            </div>
            {!isAuthenticated ? (
              <p className="mt-4 text-xs text-amber-200">
                Sign in unlocks wallet-scoped execution, memory writes, and Solana receipt anchoring.
              </p>
            ) : null}
            {wallet.walletAddress ? (
              <div className="mt-3">
                <Button
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-200"
                  onClick={() => window.open(addressExplorerUrl(wallet.walletAddress), "_blank")}
                >
                  Open wallet on Solana Explorer
                </Button>
              </div>
            ) : null}
          </Panel>

          <Panel className="space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8ceada]">Execution flow</p>
            {[
              "wallet",
              "skill",
              "plan",
              "execution",
              "reflection",
              "memory",
              "receipt",
            ].map((node, idx) => (
              <div key={node} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#3bff96]/60 text-[10px] text-[#adffd6]">
                  {idx + 1}
                </span>
                <span className="capitalize text-slate-200">{node}</span>
                <span className="ml-auto text-[11px] text-[#6bf0da]">
                  {node === "memory" ? "growth +1" : node === "receipt" ? "proof pulse" : "active"}
                </span>
              </div>
            ))}
            <div className="rounded-xl border border-[#3bff96]/30 bg-[#3bff96]/5 px-3 py-2 text-xs text-[#b8ffe0]">
              Autonomy score progression: 62 → 66 → 74
            </div>
          </Panel>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold md:text-3xl">The Core Loop</h2>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {loop.map((step, idx) => (
              <Panel key={step} className="p-4">
                <p className="text-xs text-slate-500">Step {idx + 1}</p>
                <p className="mt-1 text-sm text-slate-100">{step}</p>
              </Panel>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <h3 className="text-xl font-semibold">Traditional AI</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {["Stateless", "Hidden reasoning", "No proof", "No memory chain", "No audit trail", "No visible evolution"].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="border-[#3bff96]/30">
            <h3 className="text-xl font-semibold text-[#d6ffe9]">CLAW MACHINE SWARM</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#ccf8e4]">
              {[
                "Persistent memory",
                "Reflection-driven learning",
                "Solana proof receipts",
                "Skill reputation",
                "Execution replay",
                "Autonomy tracking",
                "Verifiable evolution",
              ].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#3bff96]" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel>
            <h3 className="text-xl font-semibold">Live Execution Demo</h3>
            <p className="mt-2 text-sm text-slate-300">Scripted replay showing failure, reflection, memory promotion, and Solana anchoring.</p>
            <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-200">
              {EXECUTION_LOG.map(line => (
                <div key={line} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3bff96] shadow-[0_0_8px_rgba(59,255,150,0.9)]" />
                  {line}
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h3 className="text-xl font-semibold">Solana-Native Infrastructure</h3>
            <div className="mt-4 grid gap-2 text-sm">
              {[
                { icon: Wallet, label: "Deterministic identity PDA" },
                { icon: Database, label: "Memory anchor PDA" },
                { icon: Link2, label: "Decision/Reflection/Memory receipt links" },
                { icon: Cpu, label: "Anchor instruction receipts" },
                { icon: GitBranch, label: "Replayable execution graph" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                  <item.icon className="h-4 w-4 text-[#4ce3cf]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Agentic Sophistication</h3>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {AUTONOMY_BANDS.map((item, idx) => (
              <div
                key={item}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm",
                  idx >= 4
                    ? "border-[#3bff96]/40 bg-[#3bff96]/10 text-[#d2ffe8]"
                    : "border-white/10 bg-black/40 text-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{item}</span>
                  <Gauge className="h-4 w-4 text-[#61e8d8]" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Multi-Agent Orchestration</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {AGENT_LANES.map(agent => (
              <Panel key={agent.role} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-100">{agent.role}</p>
                  <Bot className="h-4 w-4 text-[#43e7d4]" />
                </div>
                <p className="mt-2 text-xs text-slate-400">{agent.level}</p>
                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <p>Memory: {agent.memory}</p>
                  <p>Reputation: {agent.reputation}</p>
                  <p>Proof count: {agent.proofs}</p>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/80">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-slate-400">
          <p>CLAW MACHINE SWARM · Solana Autonomous Agent Operating System</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#4fe5d1]" />
              Policy-gated
            </span>
            <span className="inline-flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-[#4fe5d1]" />
              Memory-linked
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5 text-[#4fe5d1]" />
              Proof-anchored
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { SolanaReceiptPanel } from "@/components/solana/SolanaReceiptPanel";
import { SolanaTxLifecycleCard } from "@/components/solana/SolanaTxLifecycleCard";
import { SolanaWalletPanel } from "@/components/solana/SolanaWalletPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSolanaSession } from "@/hooks/solana/useSolanaSession";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { addressExplorerUrl } from "@/lib/solana/explorer";
import { formatSessionExpiry, shortenAddress } from "@/lib/solana/format";
import { cn } from "@/lib/utils";
import {
  DEMO_AGENT_PLAN,
  DEMO_CHAIN_RECEIPT,
  DEMO_REFLECTION,
  DEMO_SKILLS,
  DEMO_WALLET_SNAPSHOT,
} from "@shared/solana/demoCanonical";
import {
  CLAW_AGENT_FLEET_ROLES,
  CLAW_DEMO_SCENARIOS,
  CLAW_DEPLOYED_PROGRAMS,
  CLAW_EXECUTIVE_WEEKLY,
  CLAW_MARKETPLACE_ACTIVITY,
  CLAW_NARRATIVE,
  CLAW_TRACTION_PILLS,
  CLAW_TRACTION_TABLE,
  CLAW_WALLET_COHORTS,
  formatClawInteger,
} from "@shared/clawMachineMock";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  Image,
  Landmark,
  LayoutGrid,
  Link2,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const LOOP_STEPS = [
  "Connect Solana wallet",
  "Discover skill in registry",
  "Choose skill & verify autonomy band",
  "Planner generates receipt-linked plan",
  "Execute with policy gates",
  "Reflect on failure",
  "Write durable memory",
  "Anchor compact receipt on Solana",
  "Verify on explorer & compound reputation",
];

const SWARM_RFB_ROWS = [
  { rfb: "Agent discovery & reputation", claw: "Versioned skill PDAs with usage, success rate, and author provenance." },
  { rfb: "Multi-agent orchestration", claw: "Planner → researcher → operator → critic with a single auditable timeline." },
  { rfb: "Emergent agent economies", claw: "Reputation counters and receipt-linked incentives on Solana." },
  { rfb: "Real-time coordination", claw: "Sub-second feedback in UI; receipts settle with Solana finality." },
];

const EXECUTION_LOG = [
  "wallet.authorize → session + signer scope confirmed",
  "planner.discover_skills → ranked by reputation (SWARM RFB #1)",
  "policy.evaluate → review_required (confidence below threshold)",
  "operator.execute → step failed: stale context window",
  "critic.reflect → root cause + next action emitted",
  "memory.write → durable off-chain blob + PDA pointer",
  "solana.anchor_receipt → tx confirmed, receipt PDA updated",
  "next_run.bootstrap → +16 confidence from memory reuse",
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
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#070b11]/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] motion-safe:transition-shadow motion-safe:hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
        className
      )}
    >
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

      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-[#3bff96] px-4 py-2 text-sm font-medium text-black opacity-0 shadow-lg transition focus:translate-y-0 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-md supports-[backdrop-filter]:bg-black/55">
        <div className="container flex min-h-14 flex-wrap items-center justify-between gap-3 py-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 rounded-lg text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3bff96]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030507]"
            aria-label="Claw Machine Swarm, scroll to top"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-[#3bff96]" aria-hidden />
            <span className="font-semibold tracking-wide text-[#ddffe8]">CLAW_MACHINE · SWARM</span>
          </button>

          <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Primary">
            <Button className="bg-[#3bff96] text-black hover:bg-[#6bffbc]" onClick={() => setLocation("/dashboard")}>
              Command center
            </Button>
            <Button
              variant="outline"
              className="border-[#3bff96]/60 text-[#b8ffe0]"
              onClick={() => wallet.connectAndVerify().catch(() => undefined)}
            >
              {session.isVerified ? "Solana session verified" : "Connect Solana wallet"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 border-white/25 text-slate-200">
                  Explore
                  <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-50 min-w-[14rem] rounded-xl border border-white/12 bg-[#0a1018] p-1 text-slate-100 shadow-xl"
              >
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-normal uppercase tracking-wider text-slate-500">
                  Product
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/how-it-works")}
                  >
                    <BookOpen className="h-4 w-4 text-[#5ee4c7]" />
                    How it works
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/skills")}
                  >
                    <LayoutGrid className="h-4 w-4 text-[#5ee4c7]" />
                    Skills registry
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/receipts")}
                  >
                    <ReceiptText className="h-4 w-4 text-[#5ee4c7]" />
                    Receipts
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/proofs")}
                  >
                    <ShieldCheck className="h-4 w-4 text-[#5ee4c7]" />
                    Proof explorer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/zerog")}
                  >
                    <Database className="h-4 w-4 text-[#5ee4c7]" />
                    0G sidecar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-normal uppercase tracking-wider text-slate-500">
                  Demos &amp; apps
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/demo/hub")}
                  >
                    <PlayCircle className="h-4 w-4 text-[#5ee4c7]" />
                    Mock demo hub
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/dao")}
                  >
                    <Landmark className="h-4 w-4 text-[#5ee4c7]" />
                    DAO
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onSelect={() => setLocation("/nft")}
                  >
                    <Image className="h-4 w-4 text-[#5ee4c7]" />
                    Solana NFTs
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <main id="main-content" className="container space-y-10 py-10 md:space-y-14 md:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="relative overflow-hidden">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#30f7a2]/10 blur-3xl" />
            <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">Solana-first · OpenClaw-interoperable agent platform</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
              Connect Solana wallet → choose skill → run task → reflect → write memory → anchor receipt → verify on explorer
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
              CLAW_MACHINE is a command center where the wallet is identity, skills are published assets with hashes and reputation, execution emits
              receipts, reflections become durable memory (0G-ready), and compact proofs settle on Solana. Import and export OpenClaw manifests without
              losing provenance.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CLAW_TRACTION_PILLS.map(pill => (
                <span
                  key={pill.label}
                  className="rounded-full border border-[#3bff96]/35 bg-[#0a1512] px-3 py-1 text-[11px] text-[#c4ffe2]"
                >
                  <span className="text-slate-500">{pill.label}:</span> {pill.value}
                </span>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[#3bff96]/25 bg-[#08130f] p-4 text-[#d1ffe8]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#87f7d0]/90">Session status</p>
              <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Wallet</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-slate-100 tabular-nums sm:text-xs">
                    {wallet.walletAddress ? shortenAddress(wallet.walletAddress, 6, 6) : "Not connected"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Session</dt>
                  <dd className="mt-0.5 capitalize text-slate-100">{wallet.walletState.connectionStatus}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Expires</dt>
                  <dd className="mt-0.5 text-slate-100">{formatSessionExpiry(wallet.sessionProfile?.expiresAt)}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button className="bg-[#3bff96] text-black hover:bg-[#6bffbc]" onClick={() => setLocation("/dashboard")}>
                <PlayCircle className="mr-2 h-4 w-4" aria-hidden />
                Run the live demo
              </Button>
              <Button
                variant="outline"
                className="border-[#3bff96]/60 text-[#c8ffe2]"
                onClick={() => wallet.connectAndVerify().catch(() => undefined)}
              >
                {session.isVerified ? "Refresh signed session" : "Connect wallet + sign session"}
              </Button>
              <Link
                href="/demo/hub"
                className="text-center text-sm text-[#7dccb8] underline-offset-4 hover:text-[#b8ffe0] hover:underline sm:text-left"
              >
                Prefer fixtures? Open mock demo hub →
              </Link>
            </div>
            {!isAuthenticated ? (
              <p className="mt-4 text-xs text-amber-200/95">
                Sign in to bind runs to your wallet, stream memory writes, and surface Solana-anchored receipts in the inspector.
              </p>
            ) : null}
            {wallet.walletAddress ? (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/40 text-cyan-200"
                  onClick={() => window.open(addressExplorerUrl(wallet.walletAddress), "_blank", "noopener,noreferrer")}
                >
                  View wallet on Solana Explorer
                </Button>
              </div>
            ) : null}
          </Panel>

          <Panel className="space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8ceada]">One loop, one story for judges</p>
            {[
              { id: "wallet", label: "Solana wallet", hint: "identity + session" },
              { id: "skill", label: "Skill registry", hint: "published asset" },
              { id: "plan", label: "Plan receipt", hint: "hashes + linkage" },
              { id: "execution", label: "Execute", hint: "agent timeline" },
              { id: "reflection", label: "Reflect", hint: "structured critique" },
              { id: "memory", label: "Memory", hint: "off-chain / 0G" },
              { id: "receipt", label: "Solana receipt", hint: "explorer proof" },
              { id: "openclaw", label: "OpenClaw bridge", hint: "import / export" },
            ].map((node, idx) => (
              <div key={node.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#3bff96]/60 text-[10px] text-[#adffd6]">
                  {idx + 1}
                </span>
                <span className="text-slate-200">{node.label}</span>
                <span className="ml-auto text-[11px] text-[#6bf0da]">{node.hint}</span>
              </div>
            ))}
            <div className="rounded-xl border border-[#3bff96]/30 bg-[#3bff96]/5 px-3 py-2 text-xs text-[#b8ffe0]">
              Autonomy score after memory reuse: 62 → 66 → 74 (mock progression)
            </div>
          </Panel>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold md:text-3xl">Solana wallet command surface</h2>
          <p className="max-w-3xl text-sm text-slate-400">
            Connect with Phantom or Solflare, sign the human-readable session message, refresh balances against your RPC, and watch receipts accumulate.
            Fixtures below show the fully-articulated demo arc before live anchoring.
          </p>
          <SolanaWalletPanel />
          <div className="grid gap-4 lg:grid-cols-3">
            <SolanaTxLifecycleCard status={wallet.walletState.connectionStatus} />
            <SolanaReceiptPanel receipts={[DEMO_CHAIN_RECEIPT, ...wallet.txHistory]} />
            <Panel className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">OpenClaw interoperability</p>
              <p className="text-sm text-slate-200">
                Import OpenClaw manifests as CLAW skills with author wallets and hashes preserved; export CLAW skills back to OpenClaw-compatible JSON.
                Bridge receipts land beside Solana proof rows.
              </p>
              <Button className="bg-[#3bff96] text-black hover:bg-[#6bffbc]" onClick={() => setLocation("/dashboard")}>
                Open command center bridge
              </Button>
            </Panel>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Fixture · registry skill asset</p>
              <p className="text-lg font-semibold text-white">{DEMO_SKILLS[0]?.name}</p>
              <p className="text-sm text-slate-400">{DEMO_SKILLS[0]?.description}</p>
              <div className="flex flex-wrap gap-2 text-[11px] text-[#9cf6d8]">
                <span>author {shortenAddress(DEMO_SKILLS[0]!.authorWallet, 4, 4)}</span>
                <span>{DEMO_SKILLS[0]?.contentHash}</span>
                <span>OpenClaw compatible</span>
              </div>
            </Panel>
            <Panel className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Fixture · orchestration plan receipt</p>
              <p className="text-sm text-slate-200">{DEMO_AGENT_PLAN.summary}</p>
              <p className="text-[11px] text-slate-500">
                Plan hash {DEMO_AGENT_PLAN.planHash} ·{" "}
                <a
                  className="text-[#7fe9cf] underline-offset-4 hover:underline"
                  href={`https://explorer.solana.com/tx/${DEMO_AGENT_PLAN.solana?.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                >
                  verify anchor tx
                </a>
              </p>
            </Panel>
            <Panel className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Fixture · reflection</p>
              <p className="text-sm text-slate-200">{DEMO_REFLECTION.summary}</p>
              <p className="text-[11px] text-slate-500">Next action · {DEMO_REFLECTION.nextAction}</p>
            </Panel>
            <Panel className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Fixture · demo signer</p>
              <p className="font-mono text-sm text-[#c9ffe8]">{shortenAddress(DEMO_WALLET_SNAPSHOT.publicKey, 6, 6)}</p>
              <p className="text-[11px] text-slate-500">
                {DEMO_WALLET_SNAPSHOT.balanceSol} SOL · {DEMO_WALLET_SNAPSHOT.cluster}
              </p>
            </Panel>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold md:text-3xl">The core agent loop</h2>
          <p className="max-w-3xl text-sm text-slate-400">
            Built to demo in under a minute: connect, discover a high-reputation skill, run the swarm, watch a failure turn into memory, then
            glow the Solana receipt.
          </p>
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
            <h3 className="text-xl font-semibold">Typical LLM stack</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {["Stateless turns", "Opaque reasoning", "No on-chain proof", "Memory not portable", "No audit trail", "Reputation not on-ledger"].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="border-[#3bff96]/30">
            <h3 className="text-xl font-semibold text-[#d6ffe9]">CLAW_MACHINE on Solana</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#ccf8e4]">
              {[
                "Durable memory with PDA pointers",
                "Reflection that rewrites the next turn",
                "Compact receipts anchored on Solana",
                "Skill PDAs + reputation signals",
                "Replayable multi-agent timeline",
                "Autonomy bands you can ship to prod",
                "Agent economy primitives (usage, proofs)",
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
            <h3 className="text-xl font-semibold">Live execution transcript</h3>
            <p className="mt-2 text-sm text-slate-300">
              Scripted replay of one failed step: policy hold → critic reflection → memory tier bump → Solana receipt. Swap in your RPC and this
              becomes production telemetry.
            </p>
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
            <h3 className="text-xl font-semibold">Solana-native surface area</h3>
            <div className="mt-4 grid gap-2 text-sm">
              {[
                { icon: Wallet, label: "Wallet-derived identity PDAs" },
                { icon: Database, label: "Memory root + version PDAs" },
                { icon: Link2, label: "Receipt graph: decision → reflection → memory" },
                { icon: Cpu, label: "Anchor instructions: register, anchor, bump usage" },
                { icon: GitBranch, label: "Execution DAG replay from receipts" },
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
          <h3 className="text-xl font-semibold">Agentic sophistication (judging lens)</h3>
          <p className="max-w-3xl text-sm text-slate-400">
            Seven autonomy bands map how much agency the fleet earns—every promotion is policy-gated and backed by receipts, not vibes.
          </p>
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
          <h3 className="text-xl font-semibold">Multi-agent orchestration lanes</h3>
          <p className="max-w-3xl text-sm text-slate-400">
            Planner delegates; specialists execute; critic closes the loop. Each lane accrues its own memory, proof count, and reputation score.
          </p>
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
          <Panel className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fleet role</th>
                  <th className="px-4 py-3">Active agents</th>
                  <th className="px-4 py-3">Typical duties</th>
                </tr>
              </thead>
              <tbody>
                {CLAW_AGENT_FLEET_ROLES.map(row => (
                  <tr key={row.role} className="border-b border-white/5 text-slate-200">
                    <td className="px-4 py-3 font-medium text-[#9df5d4]">{row.role}</td>
                    <td className="px-4 py-3">{formatClawInteger(row.count)}</td>
                    <td className="px-4 py-3 text-slate-400">{row.duties}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <h3 className="text-xl font-semibold">Product narrative (mock)</h3>
            <dl className="mt-4 space-y-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Mission</dt>
                <dd className="mt-0.5">{CLAW_NARRATIVE.mission}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Target user</dt>
                <dd className="mt-0.5">{CLAW_NARRATIVE.targetUser}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Differentiator</dt>
                <dd className="mt-0.5">{CLAW_NARRATIVE.differentiator}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Monetization</dt>
                <dd className="mt-0.5">{CLAW_NARRATIVE.monetization}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Expansion</dt>
                <dd className="mt-0.5">{CLAW_NARRATIVE.expansionPath}</dd>
              </div>
            </dl>
          </Panel>
          <Panel className="overflow-x-auto p-0">
            <h3 className="px-4 pt-4 text-xl font-semibold">Wallet cohorts</h3>
            <table className="mt-2 w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Cohort</th>
                  <th className="px-4 py-3">Wallets</th>
                  <th className="px-4 py-3">Share</th>
                  <th className="px-4 py-3">Behavior</th>
                </tr>
              </thead>
              <tbody>
                {CLAW_WALLET_COHORTS.map(row => (
                  <tr key={row.cohort} className="border-b border-white/5 text-slate-200">
                    <td className="px-4 py-3 font-medium text-white">{row.cohort}</td>
                    <td className="px-4 py-3">{formatClawInteger(row.wallets)}</td>
                    <td className="px-4 py-3 text-[#8cf8d4]">{row.sharePct}%</td>
                    <td className="px-4 py-3 text-slate-400">{row.behavior}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Executive usage (7-day mock)</h3>
          <Panel className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Wallets</th>
                  <th className="px-4 py-3">Runs</th>
                  <th className="px-4 py-3">Receipts</th>
                  <th className="px-4 py-3">Failures</th>
                </tr>
              </thead>
              <tbody>
                {CLAW_EXECUTIVE_WEEKLY.map(row => (
                  <tr key={row.day} className="border-b border-white/5 text-slate-200">
                    <td className="px-4 py-3 font-medium text-[#9df5d4]">{row.day}</td>
                    <td className="px-4 py-3">{formatClawInteger(row.wallets)}</td>
                    <td className="px-4 py-3">{formatClawInteger(row.runs)}</td>
                    <td className="px-4 py-3">{formatClawInteger(row.receipts)}</td>
                    <td className="px-4 py-3 text-amber-200/80">{formatClawInteger(row.failures)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Solana program registry (mock IDs)</h3>
          <p className="max-w-3xl text-sm text-slate-400">
            Anchor-style fleet: registry, orchestrator, memory, receipts, governance — each with a fictional program id for deck and UI fixtures.
          </p>
          <Panel className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Program ID</th>
                  <th className="px-4 py-3">Responsibilities</th>
                </tr>
              </thead>
              <tbody>
                {CLAW_DEPLOYED_PROGRAMS.map(p => (
                  <tr key={p.name} className="border-b border-white/5 text-slate-200">
                    <td className="px-4 py-3 font-mono text-xs text-[#9df5d4]">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">{p.programId}</td>
                    <td className="px-4 py-3 text-slate-400">{p.responsibilities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <h3 className="text-xl font-semibold">Skill marketplace activity</h3>
            <p className="mt-2 text-sm text-slate-400">Fictional SOL-denominated listings by vertical.</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {CLAW_MARKETPLACE_ACTIVITY.map(m => (
                <li key={m.category} className="flex justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                  <span>{m.category}</span>
                  <span>
                    {m.listings} listings · avg {m.avgPriceSol} SOL
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <h3 className="text-xl font-semibold">Demo scenarios</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {CLAW_DEMO_SCENARIOS.map(s => (
                <li key={s.title} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                  <p className="font-medium text-white">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.goal}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {s.skillsUsed} skills · {s.timeSec}s · {s.result} · receipt {s.receipt}
                    {s.memoryWritten ? " · memory written" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold">SWARM request-for-build alignment</h3>
          <p className="max-w-3xl text-sm text-slate-400">
            Map each demo beat to what judges score: innovation in the loop design, agentic depth in orchestration, traction in verifiable
            counters.
          </p>
          <Panel className="overflow-x-auto p-0">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">RFB theme</th>
                  <th className="px-4 py-3">How CLAW_MACHINE shows it</th>
                </tr>
              </thead>
              <tbody>
                {SWARM_RFB_ROWS.map(row => (
                  <tr key={row.rfb} className="border-b border-white/5 text-slate-200">
                    <td className="px-4 py-3 text-[#9df5d4]">{row.rfb}</td>
                    <td className="px-4 py-3 text-slate-300">{row.claw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Traction-ready metrics (mock → live)</h3>
          <p className="max-w-3xl text-sm text-slate-400">
            Wire Helius + your indexer to replace the placeholders. The UI already expects explorer links and receipt counts for Frontier
            questionnaires.
          </p>
          <Panel className="overflow-x-auto p-0">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">On-chain proof</th>
                </tr>
              </thead>
              <tbody>
                {CLAW_TRACTION_TABLE.map(row => (
                  <tr key={row.metric} className="border-b border-white/5 text-slate-200">
                    <td className="px-4 py-3 font-medium text-white">{row.metric}</td>
                    <td className="px-4 py-3 text-[#8cf8d4]">{row.value}</td>
                    <td className="px-4 py-3 text-slate-400">{row.proof}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <Panel className="border-[#3bff96]/25">
            <h3 className="text-xl font-semibold text-[#d6ffe9]">Frontier &amp; SWARM next steps</h3>
            <p className="mt-2 text-sm text-slate-300">
              Ship the demo video from the command center, publish the repo, and submit with traction proofs. External links open in a new tab.
            </p>
          </Panel>
          <div className="flex flex-col gap-2 md:items-end">
            <Button
              className="w-full bg-[#3bff96] text-black hover:bg-[#6bffbc] md:w-auto"
              onClick={() => window.open("https://arena.colosseum.org", "_blank", "noopener,noreferrer")}
            >
              Frontier arena (Colosseum)
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#38d7d0]/50 text-[#9dfbf5] md:w-auto"
              onClick={() => window.open("https://swarm.thecanteenapp", "_blank", "noopener,noreferrer")}
            >
              SWARM · thecanteenapp
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 text-slate-200 md:w-auto"
              onClick={() => window.open("https://github.com/lucylow/CLAW_MACHINE", "_blank", "noopener,noreferrer")}
            >
              Fork reference repo
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/80">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-slate-400">
          <p>CLAW_MACHINE SWARM · Solana agent command layer · Frontier submission ready</p>
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

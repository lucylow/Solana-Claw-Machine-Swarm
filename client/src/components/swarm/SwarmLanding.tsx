import { CcMetric, CcMiniLoopOrbit, CcPanel, CcSectionHeader, CcStatusDot } from "@/components/command-center/CcPrimitives";
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
import { AGENT_LOOP_STEPS_DETAILED, SOLANA_COPY, STORY_LOOP_LABELS } from "@shared/copy";
import {
  CLAW_TRACTION_PILLS,
  formatClawInteger,
} from "@shared/clawMachineMock";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  ExternalLink,
  GitBranch,
  Image,
  Landmark,
  LayoutGrid,
  Layers,
  Link2,
  MemoryStick,
  PlayCircle,
  Radio,
  ReceiptText,
  Scale,
  SearchCode,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link, useLocation } from "wouter";

/* =============================================================================
 * Solana Autonomous Agent Command Center — landing
 *
 * This page replaces a long, table-heavy marketing dashboard with a single
 * cinematic command-center surface. It tells the canonical agent story
 * visually before any user reads a word:
 *
 *   wallet → skill → plan → execute → reflect → memory → 0G → Solana
 *
 * Sections:
 *   1. Hero — mission stage with live mini-loop orbit + connect/launch CTAs.
 *   2. Story spine — the canonical 9-step loop highlighted as a horizontal rail.
 *   3. Operating modules — six cards mirroring the dashboard sections.
 *   4. Live transcript + Solana surface — proves the loop with concrete artifacts.
 *   5. Autonomy spectrum — promotes how trust is earned, not declared.
 *   6. Footer — submission ready.
 * ============================================================================= */

interface SwarmLandingProps {
  isAuthenticated: boolean;
}

/** Auto-advancing story step used by the hero orbit. */
function useAutoAdvance(total: number, intervalMs = 1800): number {
  const [idx, setIdx] = useState(0);
  const ref = useRef(idx);
  ref.current = idx;
  useEffect(() => {
    const id = setInterval(() => {
      setIdx((prev) => (prev + 1) % total);
    }, intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs]);
  return idx;
}

const EXECUTION_LOG: Array<{ step: string; tone: "live" | "warn" | "proof" }> = [
  { step: "solana.wallet → signed session verified against backend nonce", tone: "proof" },
  { step: "planner.discover_skills → ranked by reputation (SWARM discovery)", tone: "live" },
  { step: "policy.evaluate → review_required (confidence below threshold)", tone: "warn" },
  { step: "operator.execute → step failed: stale context window", tone: "warn" },
  { step: "critic.reflect → root cause + next action emitted", tone: "live" },
  { step: "zerog.storage.put → reflection JSON / narrative blob", tone: "live" },
  { step: "zerog.da.append → payload hash + batch root for replay", tone: "live" },
  { step: "solana.record_receipt → compact summary hash + storage commitment", tone: "proof" },
  { step: "explorer.verify → wallet sees signature + PDAs + 0G URIs", tone: "proof" },
];

const OPERATING_MODULES: Array<{
  icon: ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  detail: string;
  tags: string[];
}> = [
  {
    icon: Wallet,
    kicker: "01 · Identity",
    title: "Wallet & verified session",
    detail:
      "Phantom or Solflare connect, sign the human-readable session message, refresh balances, and bind every receipt to your address.",
    tags: ["session-signed", "PDA-scoped"],
  },
  {
    icon: SearchCode,
    kicker: "02 · Capability",
    title: "Versioned skill registry",
    detail:
      "Skills are published assets — not configs. Version, content hash, author wallet, reputation, success rate, and OpenClaw provenance.",
    tags: ["versioned", "OpenClaw-ready"],
  },
  {
    icon: Cpu,
    kicker: "03 · Execution",
    title: "Multi-agent live run",
    detail:
      "Planner → researcher → operator → critic on a single auditable timeline. Policy gates, retries, sub-second feedback.",
    tags: ["policy-gated", "auditable"],
  },
  {
    icon: Brain,
    kicker: "04 · Reflection",
    title: "Structured critique",
    detail:
      "Failures emit root cause + corrective advice + next action. Reflections aren’t opinion — they are control records for the next turn.",
    tags: ["RCA", "next-action"],
  },
  {
    icon: MemoryStick,
    kicker: "05 · Memory",
    title: "Reflection-linked durable memory",
    detail:
      "Lessons land in 0G Storage with a DA-committed lineage root, indexed by reflection ID and proof receipt.",
    tags: ["0G storage", "0G DA"],
  },
  {
    icon: ReceiptText,
    kicker: "06 · Proof",
    title: "Compact Solana receipt",
    detail:
      "Anchor a compact summary hash + storage refs on Solana. The wallet now sees a receipt graph judges can verify in seconds.",
    tags: ["explorer-verifiable", "anchor-tx"],
  },
];

const SIDE_NAV_PREVIEW: Array<{ icon: ComponentType<{ className?: string }>; label: string }> = [
  { icon: PlayCircle, label: "Mission deck" },
  { icon: Cpu, label: "Live run" },
  { icon: SearchCode, label: "Skill registry" },
  { icon: MemoryStick, label: "Memory lineage" },
  { icon: Brain, label: "Reflections" },
  { icon: ReceiptText, label: "Solana receipts" },
  { icon: GitBranch, label: "Proof explorer" },
  { icon: Bot, label: "Agent fleet" },
  { icon: Scale, label: "Reputation" },
  { icon: Link2, label: "OpenClaw bridge" },
  { icon: Database, label: "0G sidecar" },
];

const AUTONOMY_BANDS: Array<{ label: string; tier: "manual" | "guided" | "agency" | "autonomous" }> = [
  { label: "Automation only", tier: "manual" },
  { label: "Assisted", tier: "manual" },
  { label: "Guided", tier: "guided" },
  { label: "Policy-gated", tier: "guided" },
  { label: "Meaningful agency", tier: "agency" },
  { label: "Near autonomous", tier: "autonomous" },
  { label: "Fully autonomous", tier: "autonomous" },
];

export default function SwarmLanding({ isAuthenticated }: SwarmLandingProps) {
  const [, setLocation] = useLocation();
  const wallet = useSolanaWallet();
  const session = useSolanaSession();
  const orbitIdx = useAutoAdvance(8, 1700);

  const walletConnected = Boolean(wallet.walletAddress);
  const verified = session.isVerified;
  const status: "verified" | "connected" | "offline" = verified
    ? "verified"
    : walletConnected
      ? "connected"
      : "offline";

  const heroPills = useMemo(
    () => [
      {
        tone: status === "verified" ? "proof" : status === "connected" ? "live" : "warn",
        label:
          status === "verified"
            ? `Session verified · ${shortenAddress(wallet.walletAddress!, 4, 4)}`
            : status === "connected"
              ? `Connected · sign session next`
              : "Solana wallet offline",
      } as const,
      { tone: "live" as const, label: `Cluster · ${wallet.walletState.cluster}` },
      { tone: "neutral" as const, label: `Loop · 9 phases · 0G + Solana` },
    ],
    [status, wallet.walletAddress, wallet.walletState.cluster],
  );

  return (
    <div className="cc-stage relative min-h-screen text-slate-100">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-[#14f195] px-4 py-2 text-sm font-medium text-black opacity-0 shadow-lg transition focus:translate-y-0 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Skip to main content
      </a>

      {/* ============================================================
       * TOP RAIL — emulates the dashboard's command rail so judges feel
       * the operating system before they enter it.
       * ============================================================ */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#040507]/85 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#14f195]/40 to-transparent" />
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 rounded-lg text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14f195]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030507]"
            aria-label="Claw Machine Swarm, scroll to top"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#14f195]/30 bg-[#0a120e] shadow-[0_0_18px_rgba(20,241,149,0.18)]">
              <Sparkles className="h-4 w-4 text-[#14f195]" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#14f195]/90">
                Solana · agent operating system
              </span>
              <span className="block text-sm font-semibold tracking-tight text-slate-50">
                CLAW_MACHINE · Command Center
              </span>
            </span>
          </button>

          <nav className="flex items-center gap-2" aria-label="Primary">
            <Button
              className="bg-[#14f195] font-semibold text-black hover:bg-[#5cffb8]"
              onClick={() => setLocation("/dashboard?section=overview")}
            >
              <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden />
              Enter command center
            </Button>
            <Button
              variant="outline"
              className="border-[#38d7d0]/45 text-[#b5fff8]"
              onClick={() => wallet.connectAndVerify().catch(() => undefined)}
            >
              <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
              {verified ? "Session verified" : walletConnected ? "Sign session" : "Connect wallet"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden gap-1.5 border-white/15 text-slate-200 sm:inline-flex"
                >
                  Explore
                  <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-50 min-w-[14rem] rounded-xl border border-white/12 bg-[#0a1018] p-1 text-slate-100 shadow-xl"
              >
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-normal uppercase tracking-wider text-slate-500">
                  Modules
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/how-it-works")}>
                    <BookOpen className="h-4 w-4 text-[#5ee4c7]" /> How it works
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/skills")}>
                    <LayoutGrid className="h-4 w-4 text-[#5ee4c7]" /> Skill registry
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/receipts")}>
                    <ReceiptText className="h-4 w-4 text-[#5ee4c7]" /> Receipts on Solana
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/onchain")}>
                    <Link2 className="h-4 w-4 text-[#5ee4c7]" /> On-chain proof rail
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/proofs")}>
                    <ShieldCheck className="h-4 w-4 text-[#5ee4c7]" /> Solana proof explorer
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/zerog")}>
                    <Database className="h-4 w-4 text-[#5ee4c7]" /> 0G sidecar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-normal uppercase tracking-wider text-slate-500">
                  Demos &amp; apps
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/demo/hub")}>
                    <PlayCircle className="h-4 w-4 text-[#5ee4c7]" /> Mock demo hub
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/dao")}>
                    <Landmark className="h-4 w-4 text-[#5ee4c7]" /> DAO
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10" onSelect={() => setLocation("/nft")}>
                    <Image className="h-4 w-4 text-[#5ee4c7]" /> Solana NFTs
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
        {/* status chips strip — mirrors the dashboard's top rail */}
        <div className="cc-scroll mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto border-t border-white/[0.04] px-4 py-2 sm:px-6">
          {heroPills.map((pill) => (
            <span
              key={pill.label}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-wider",
                pill.tone === "proof" && "border-[#14f195]/45 bg-[#14f195]/10 text-[#c8ffe8]",
                pill.tone === "live" && "border-[#38d7d0]/40 bg-[#38d7d0]/10 text-[#bdf6f0]",
                pill.tone === "neutral" && "border-white/10 bg-black/40 text-slate-400",
                pill.tone === "warn" && "border-amber-400/35 bg-amber-500/10 text-amber-100",
              )}
            >
              <CcStatusDot tone={pill.tone === "neutral" ? "idle" : pill.tone} pulse={pill.tone === "live"} size="sm" />
              {pill.label}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[#14f195]/30 bg-[#14f195]/8 px-2 py-1 text-[10px] uppercase tracking-wider text-[#bcffd9]">
            <Radio className="h-3 w-3" aria-hidden />
            Live agent surface · proof-anchored
          </span>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-6 md:py-12">
        {/* ===========================================================
         * 1. HERO — mission stage with live mini-loop orbit
         * =========================================================== */}
        <section className="grid gap-5 lg:grid-cols-[1.5fr_minmax(280px,420px)]">
          <CcPanel tone="proof" className="relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 cc-grid opacity-50" aria-hidden />
            <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[#14f195]/12 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-28 -left-12 h-60 w-72 rounded-full bg-[#38d7d0]/10 blur-3xl" aria-hidden />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#14f195]/35 bg-[#14f195]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#bcffd9]">
                <span className="cc-pulse h-1.5 w-1.5 rounded-full bg-[#14f195]" />
                Solana-native · wallet-signed · proof-anchored
              </span>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
                The Solana autonomous agent{" "}
                <span className="text-[#bcffd9]">command center</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                Connect a Solana wallet, choose a published skill, and watch the system{" "}
                <span className="text-white">plan, execute, reflect, write memory,</span> and{" "}
                <span className="text-white">anchor a compact receipt</span> you can verify on Solana Explorer in seconds.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  className="bg-[#14f195] font-semibold text-black hover:bg-[#5cffb8]"
                  onClick={() => setLocation("/dashboard?section=overview")}
                >
                  <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden />
                  Run the live loop
                </Button>
                <Button
                  variant="outline"
                  className="border-[#38d7d0]/45 text-[#b5fff8]"
                  onClick={() => wallet.connectAndVerify().catch(() => undefined)}
                >
                  <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
                  {verified ? SOLANA_COPY.wallet.refreshSignedSession : SOLANA_COPY.wallet.connectVerify}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/15 text-slate-200"
                  onClick={() => setLocation("/demo/hub")}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
                  Open demo hub
                </Button>
              </div>

              {/* Wallet / session band — operational, not marketing */}
              <CcPanel className="relative mt-6 grid gap-3 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Solana wallet</p>
                  <p className="mt-1 truncate font-mono text-[12px] text-slate-100">
                    {walletConnected
                      ? shortenAddress(wallet.walletAddress!, 6, 6)
                      : SOLANA_COPY.wallet.notConnected}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{wallet.walletName ?? "Adapter"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Session</p>
                  <p className="mt-1 capitalize text-slate-200">
                    {wallet.walletState.connectionStatus.replaceAll("_", " ")}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Expires · {formatSessionExpiry(wallet.sessionProfile?.expiresAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Proof channel</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <CcStatusDot tone={verified ? "proof" : "warn"} pulse={!verified && walletConnected} />
                    <span className="text-slate-200">
                      {verified ? "verified" : walletConnected ? "session pending" : "offline · demo fixtures"}
                    </span>
                  </div>
                  {wallet.walletAddress ? (
                    <a
                      href={addressExplorerUrl(wallet.walletAddress)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-cyan-200 underline-offset-4 hover:underline"
                    >
                      Open on Solana Explorer <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : (
                    <p className="mt-1 text-[10px] text-slate-600">Connect to bind receipts.</p>
                  )}
                </div>
              </CcPanel>

              {!isAuthenticated ? (
                <p className="mt-3 text-[11px] text-amber-200/95">
                  Sign in to bind runs to your Solana wallet, stream memory writes, and surface explorer-verifiable receipts.
                </p>
              ) : null}
            </div>
          </CcPanel>

          {/* Right hero — live orbit + traction pills */}
          <CcPanel className="flex flex-col items-center gap-4 p-5">
            <CcSectionHeader
              kicker="Live system"
              title="Agent loop · 8 stages"
              icon={ShieldCheck}
              status={
                <span className="inline-flex items-center gap-1 rounded-md border border-[#14f195]/30 bg-[#14f195]/8 px-1.5 py-0.5 text-[10px] text-[#bcffd9]">
                  <span className="cc-pulse h-1.5 w-1.5 rounded-full bg-[#14f195]" />
                  active
                </span>
              }
              className="w-full"
            />
            <CcMiniLoopOrbit activeIndex={orbitIdx} size={240} caption="proof-anchored loop" />
            <p className="px-2 text-center text-[11px] leading-relaxed text-slate-500">
              Each ring node represents a phase. The active stage glows; completed stages mint receipts the wallet can verify on Solana.
            </p>
            <div className="grid w-full grid-cols-2 gap-2">
              {CLAW_TRACTION_PILLS.slice(0, 4).map((pill) => (
                <CcMetric
                  key={pill.label}
                  label={pill.label}
                  value={pill.value}
                  tone="live"
                />
              ))}
            </div>
          </CcPanel>
        </section>

        {/* ===========================================================
         * 2. STORY SPINE — the canonical 9-step loop as a horizontal rail
         * =========================================================== */}
        <section className="space-y-3">
          <SectionHeading
            kicker="Story spine"
            title="One loop · the same shape every judge follows"
            description="From wallet to verified receipt — the dashboard renders this exact spine across every panel, so the product reads as a single sentence."
          />
          <CcPanel className="relative overflow-hidden p-4">
            <div className="cc-scroll flex items-stretch gap-2 overflow-x-auto pb-2">
              {STORY_LOOP_LABELS.map((label, i) => {
                const tone = i < 6 ? "proof" : i < 8 ? "live" : "idle";
                return (
                  <div
                    key={label}
                    className={cn(
                      "relative flex w-[160px] shrink-0 flex-col gap-2 rounded-xl border bg-black/30 px-3 py-3",
                      tone === "proof" && "border-[#14f195]/30",
                      tone === "live" && "border-[#38d7d0]/30",
                      tone === "idle" && "border-white/8",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <CcStatusDot tone={tone === "idle" ? "idle" : tone} size="sm" pulse={tone === "live"} />
                    </div>
                    <p className="text-[12px] font-medium leading-snug text-slate-100">{label}</p>
                    <p className="text-[10px] text-slate-500">{AGENT_LOOP_STEPS_DETAILED[i]}</p>
                  </div>
                );
              })}
            </div>
          </CcPanel>
        </section>

        {/* ===========================================================
         * 3. OPERATING MODULES — the six story-shaped concerns
         * =========================================================== */}
        <section className="space-y-3">
          <SectionHeading
            kicker="Operating modules"
            title="Six concerns · one auditable surface"
            description="Identity, capability, execution, reflection, memory, and proof — every concern keeps its own panel inside the command center."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {OPERATING_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <CcPanel
                  key={m.title}
                  className="group relative flex h-full flex-col gap-2 p-5 transition hover:border-[#14f195]/35"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#14f195]/25 bg-[#14f195]/10 text-[#bcffd9] shadow-[0_0_18px_rgba(20,241,149,0.18)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#87f7d0]/80">
                        {m.kicker}
                      </p>
                      <h3 className="mt-0.5 text-base font-semibold tracking-tight text-white">{m.title}</h3>
                    </div>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-slate-400">{m.detail}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {m.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CcPanel>
              );
            })}
          </div>
        </section>

        {/* ===========================================================
         * 4. LIVE TRANSCRIPT + ARTIFACTS — proof artifacts inline
         * =========================================================== */}
        <section className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <CcPanel className="p-5">
            <CcSectionHeader
              icon={Cpu}
              kicker="Live transcript"
              title="One run · failure → reflection → anchor"
              status={
                <span className="inline-flex items-center gap-1 rounded-md border border-[#38d7d0]/35 bg-[#38d7d0]/10 px-1.5 py-0.5 text-[10px] text-[#bdf6f0]">
                  <Radio className="h-3 w-3 cc-pulse" aria-hidden /> replay
                </span>
              }
            />
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
              Scripted replay of one failed step: policy hold → critic reflection → memory tier bump → Solana receipt. Swap in your RPC and this becomes production telemetry.
            </p>
            <ol className="mt-4 space-y-1.5 rounded-xl border border-white/8 bg-black/40 p-3 font-mono text-[11px] text-slate-300">
              {EXECUTION_LOG.map((line, i) => (
                <li key={line.step} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex w-5 shrink-0 justify-end text-slate-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <CcStatusDot
                    tone={line.tone}
                    pulse={line.tone === "live" && i === EXECUTION_LOG.length - 3}
                    className="mt-1.5 shrink-0"
                  />
                  <span>{line.step}</span>
                </li>
              ))}
            </ol>
          </CcPanel>

          <div className="flex flex-col gap-3">
            <CcPanel tone="proof" glow className="p-4">
              <CcSectionHeader
                icon={ReceiptText}
                kicker="receipt · anchored"
                title="Compact Solana receipt (demo)"
                status={
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#14f195]/45 bg-[#14f195]/10 px-1.5 py-0.5 text-[10px] text-[#bcffd9]">
                    <CheckCircle2 className="h-3 w-3" aria-hidden /> verified
                  </span>
                }
              />
              <dl className="mt-3 space-y-1.5 text-[11px]">
                <KV label="tx signature" value={shortenAddress(DEMO_CHAIN_RECEIPT.txSignature, 8, 8)} mono />
                <KV label="account" value={shortenAddress(DEMO_CHAIN_RECEIPT.account ?? "—", 8, 8)} mono />
                <KV label="summary hash" value={DEMO_CHAIN_RECEIPT.summaryHash ?? "—"} mono />
                <KV label="cluster" value={DEMO_CHAIN_RECEIPT.cluster} />
              </dl>
              <a
                href={DEMO_CHAIN_RECEIPT.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#bcffd9] underline-offset-4 hover:underline"
              >
                Open on Solana Explorer
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </CcPanel>

            <CcPanel tone="live" className="p-4">
              <CcSectionHeader
                icon={Brain}
                kicker="reflection"
                title="Structured critique · injected next turn"
              />
              <dl className="mt-3 space-y-1.5 text-[11px]">
                <KV label="root cause" value={DEMO_REFLECTION.rootCause} multiline />
                <KV label="advice" value={DEMO_REFLECTION.correctiveAdvice} multiline />
                <KV label="next action" value={DEMO_REFLECTION.nextAction} multiline />
              </dl>
            </CcPanel>

            <CcPanel className="p-4">
              <CcSectionHeader
                icon={SearchCode}
                kicker="skill registry"
                title={`${DEMO_SKILLS[0]?.name} · v${DEMO_SKILLS[0]?.version}`}
                status={
                  <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-100">
                    OpenClaw-ready
                  </span>
                }
              />
              <p className="mt-2 text-[11.5px] text-slate-400">{DEMO_SKILLS[0]?.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <Tag>author {shortenAddress(DEMO_SKILLS[0]!.authorWallet, 4, 4)}</Tag>
                <Tag>rep {DEMO_SKILLS[0]?.reputationScore}</Tag>
                <Tag>{DEMO_SKILLS[0]?.successRate}% success</Tag>
                <Tag>{formatClawInteger(DEMO_SKILLS[0]?.usageCount ?? 0)} uses</Tag>
                <Tag mono>{DEMO_SKILLS[0]?.contentHash}</Tag>
              </div>
            </CcPanel>

            <CcPanel className="p-4">
              <CcSectionHeader
                icon={Layers}
                kicker="plan receipt"
                title={`${DEMO_AGENT_PLAN.summary?.slice(0, 80) ?? "Receipt-linked plan"}…`}
              />
              <div className="mt-2 grid gap-1.5 text-[11px]">
                <KV label="plan hash" value={DEMO_AGENT_PLAN.planHash} mono />
                <KV label="status" value={DEMO_AGENT_PLAN.status} />
                <KV
                  label="anchor tx"
                  value={shortenAddress(DEMO_AGENT_PLAN.solana?.txSignature ?? "—", 8, 8)}
                  mono
                />
              </div>
            </CcPanel>
          </div>
        </section>

        {/* ===========================================================
         * 5. NAVIGATION PREVIEW — sells the dashboard surface
         * =========================================================== */}
        <section className="space-y-3">
          <SectionHeading
            kicker="Inside the command center"
            title="Eleven modes · one operating system"
            description="The dashboard sidebar isn’t a settings menu. Each item is a command-center mode with its own surface."
          />
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {SIDE_NAV_PREVIEW.map((item) => (
              <Link
                key={item.label}
                href="/dashboard?section=overview"
                className="group flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-black/35 px-3 py-2.5 transition hover:border-[#14f195]/35 hover:bg-[#14f195]/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-slate-300 group-hover:border-[#14f195]/35 group-hover:text-[#bcffd9]">
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-[12.5px] text-slate-200 group-hover:text-white">{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#bcffd9]" />
              </Link>
            ))}
          </div>
        </section>

        {/* ===========================================================
         * 6. AUTONOMY SPECTRUM — trust is earned, not declared
         * =========================================================== */}
        <section className="space-y-3">
          <SectionHeading
            kicker="Autonomy spectrum"
            title="Seven bands · earned with receipts and policy"
            description="Promotions require policy checks and receipt-backed runs — not narrative alone. Bands are visible across the dashboard and the proof rail."
          />
          <CcPanel className="p-4">
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-7">
              {AUTONOMY_BANDS.map((b, i) => {
                const tone =
                  b.tier === "autonomous"
                    ? "proof"
                    : b.tier === "agency"
                      ? "live"
                      : b.tier === "guided"
                        ? "info"
                        : "idle";
                return (
                  <div
                    key={b.label}
                    className={cn(
                      "rounded-xl border px-3 py-3",
                      tone === "proof" && "border-[#14f195]/35 bg-[#14f195]/8",
                      tone === "live" && "border-[#38d7d0]/30 bg-[#38d7d0]/6",
                      tone === "info" && "border-sky-400/25 bg-sky-500/6",
                      tone === "idle" && "border-white/10 bg-black/30",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <CcStatusDot tone={tone === "info" ? "info" : tone} size="sm" />
                    </div>
                    <p className="mt-2 text-[12px] font-medium leading-tight text-slate-100">{b.label}</p>
                  </div>
                );
              })}
            </div>
          </CcPanel>
        </section>

        {/* ===========================================================
         * 7. CTA / COMPARE — invite into the command center
         * =========================================================== */}
        <section className="grid gap-3 lg:grid-cols-2">
          <CcPanel className="p-5">
            <CcSectionHeader kicker="Stateless agents" title="Generic LLM stack (contrast)" />
            <ul className="mt-3 space-y-1.5 text-[12px] text-slate-400">
              {[
                "Stateless turns",
                "Opaque reasoning",
                "No on-chain proof",
                "Memory not portable",
                "No audit trail",
                "Reputation not on-ledger",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="inline-block h-1 w-1 rounded-full bg-slate-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </CcPanel>
          <CcPanel tone="proof" glow className="p-5">
            <CcSectionHeader
              kicker="CLAW_MACHINE"
              title="Solana-native autonomous agents"
              icon={Sparkles}
            />
            <ul className="mt-3 space-y-1.5 text-[12px] text-[#cdf6e0]">
              {[
                "Durable memory with PDA pointers",
                "Reflection that rewrites the next turn",
                "Compact receipts anchored on Solana",
                "Skill PDAs + reputation signals",
                "Replayable multi-agent timeline",
                "Autonomy bands you can ship to prod",
                "OpenClaw bridge with provenance",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-[#14f195]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="bg-[#14f195] font-semibold text-black hover:bg-[#5cffb8]"
                onClick={() => setLocation("/dashboard?section=overview")}
              >
                <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden /> Enter command center
              </Button>
              <Button
                variant="outline"
                className="border-[#38d7d0]/45 text-[#b5fff8]"
                onClick={() => setLocation("/demo/full-story")}
              >
                Replay full story
              </Button>
            </div>
          </CcPanel>
        </section>

        {/* ===========================================================
         * 8. SUBMISSION FOOTER ROW
         * =========================================================== */}
        <section className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <CcPanel tone="proof" className="p-5">
            <CcSectionHeader
              kicker="Submission ready"
              title="Frontier &amp; SWARM next steps"
            />
            <p className="mt-2 text-[12px] text-slate-300">
              Ship the demo from inside the command center. External links open in a new tab; receipts cite{" "}
              <span className="font-mono text-[#bcffd9]">{shortenAddress(DEMO_WALLET_SNAPSHOT.publicKey, 4, 4)}</span> as the demo signer.
            </p>
          </CcPanel>
          <div className="flex flex-col gap-2 md:items-end">
            <Button
              className="w-full bg-[#14f195] text-black hover:bg-[#5cffb8] md:w-auto"
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
              className="w-full border-white/15 text-slate-200 md:w-auto"
              onClick={() => window.open("https://github.com/lucylow/CLAW_MACHINE", "_blank", "noopener,noreferrer")}
            >
              Fork reference repo
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] bg-black/80">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-400 sm:px-6">
          <p>CLAW_MACHINE SWARM · Solana agent command layer · Frontier submission ready</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#4fe5d1]" aria-hidden />
              Policy-gated
            </span>
            <span className="inline-flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-[#4fe5d1]" aria-hidden />
              Memory-linked
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5 text-[#4fe5d1]" aria-hidden />
              Proof-anchored
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Local helpers — kept private to the landing so the design doesn't leak.
 * ----------------------------------------------------------------------- */

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#87f7d0]/80">
        {kicker}
      </p>
      <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-[12.5px] text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}

function KV({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 border-b border-white/5 pb-1 last:border-0 last:pb-0",
        multiline ? "flex-col" : "items-center justify-between",
      )}
    >
      <dt className="shrink-0 text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-slate-200",
          multiline ? "text-[11.5px] leading-relaxed text-slate-300" : "text-right",
          mono && "font-mono text-[11px] text-slate-300",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Tag({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-400",
        mono && "font-mono",
      )}
    >
      {children}
    </span>
  );
}

import { StoryAtAGlance } from "@/components/command-center/StoryAtAGlance";
import { StoryLoopRail } from "@/components/command-center/StoryLoopRail";
import {
  MissionPanel,
  ProofBadge,
  StatusChip,
} from "@/components/command-center/CommandCenterShell";
import {
  CcMetric,
  CcMiniLoopOrbit,
  CcPanel,
  CcSectionHeader,
  CcStatusDot,
} from "@/components/command-center/CcPrimitives";
import { ProofStateBadge } from "@/components/solana/ProofStateBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SolanaWalletPanel from "@/components/solana/SolanaWalletPanel";
import { ZeroGHealthBanner } from "@/components/zerog/ZeroGHealthBanner";
import { ZeroGProofGraph } from "@/components/zerog/ZeroGProofGraph";
import type { ZeroGHealthResponse, ZeroGProofGraphResponse } from "@/lib/zerog/types";
import { getClientZeroGConfig } from "@/lib/zerog/config";
import { SOLANA_COPY, STORY_LOOP_LABELS } from "@shared/copy";
import type { CommandUXSnapshot, ProofChannel, UXTimelineItem } from "@shared/uxState";
import { cn } from "@/lib/utils";
import { buildDemoExecutionArtifacts } from "@shared/buildDemoExecutionRun";
import {
  buildAgentsForScenario,
  buildExecutionSteps,
  buildMemoryTimeline,
  buildPlan,
  buildReceipts,
  DEMO_SKILLS,
  DEMO_WALLET,
  getSkillById,
} from "@shared/demoFixtures";
import type { DemoExecutionStepFixture, DemoReflectionFixture } from "@shared/demoTypes";
import type { SwarmExecuteResult } from "@shared/domainModel";
import { AgentFrameworkInspector } from "@/components/agents/AgentFrameworkInspector";
import { getClaimText, getReceiptTruthLine } from "@shared/proofTruth";
import type { ProofStatus } from "@shared/structuredReceipt";
import { AUTONOMY_SPECTRUM, autonomyLabel } from "@shared/autonomy";
import type { OpenClawBridgeStatus } from "@shared/openclaw/types";
import type {
  SwarmAgentNode,
  SwarmMemoryRecord,
  SwarmMissionRun,
  SwarmReceipt,
  SwarmReflection,
  SwarmRuntimeState,
  SwarmSkill,
} from "@shared/swarm";
import {
  CLAW_AGENT_FLEET_ROLES,

  formatClawInteger,
} from "@shared/clawMachineMock";
import { Input } from "@/components/ui/input";
import { DappCopyButton } from "@/components/dapp/DappCopyButton";
import { txExplorerUrl } from "@/lib/solana/explorer";
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  PlayCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";

export function DemoModeToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <MissionPanel className="mb-4 flex flex-wrap items-center justify-between gap-3 border-[#14f195]/20 bg-[#0a120e]/90 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#14f195]">Demo mode</p>
        <p className="mt-1 text-xs text-slate-400">
          Seed a full Solana wallet → skill → execution → reflection → memory → receipt story when live chain data is thin.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{enabled ? "Live narrative on" : "Off"}</span>
        <Switch checked={enabled} onCheckedChange={onChange} aria-label="Toggle demo mode" />
      </div>
    </MissionPanel>
  );
}

export function DegradedStateBanner({
  messages,
  recoverHints,
}: {
  messages: string[];
  recoverHints: string[];
}) {
  if (!messages.length) return null;
  return (
    <MissionPanel className="mb-4 border-rose-500/25 bg-rose-950/20 p-4">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
        <div>
          <p className="text-xs font-semibold text-rose-100">Degraded · partial visibility</p>
          <ul className="mt-2 list-inside list-disc text-[11px] text-rose-200/80">
            {messages.map(m => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {recoverHints.length ? (
            <p className="mt-2 text-[11px] text-rose-200/60">
              Recover: {recoverHints.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </MissionPanel>
  );
}

function proofChannelBadgeLabel(ch: ProofChannel): string {
  switch (ch) {
    case "verified":
      return "Proof: verified (live)";
    case "pending":
      return "Proof: pending";
    case "cached_only":
      return "Proof: cached / degraded";
    case "demo_only":
      return "Proof: demo fixtures";
    case "unavailable":
      return "Proof: none yet";
    default:
      return "Proof: unknown";
  }
}

function executionStageLabel(status: string | undefined, busy: boolean): string {
  if (busy) return "executing";
  if (!status) return "idle";
  if (status === "planning") return "planning";
  if (status === "verified" || status === "anchored") return "anchoring Solana proof";
  if (status === "reflected" || status === "stored") return "memory path";
  if (status === "failed") return "reflecting";
  return status;
}

type SkillRow = {
  id: string;
  name: string;
  version: string;
  authorWallet: string;
  reputationScore: number;
  successRate: number;
  usageCount: number;
};

export function OverviewMissionBlock({
  goal,
  onGoalChange,
  loopStep,
  loopBusy,
  loopError,
  walletAddress,
  onConnect,
  onRunLoop,
  onDemoComplete,
  selectedSkillId,
  onSelectSkill,
  skillRows,
  lastResult,
  demoSteps,
  demoMode,
  demoExecutionRun,
  commandUx,
  explorerUrl,
}: {
  goal: string;
  onGoalChange: (g: string) => void;
  loopStep: number;
  loopBusy: boolean;
  loopError: string | null;
  walletAddress?: string;
  onConnect: () => void;
  onRunLoop: () => void;
  onDemoComplete: () => void;
  selectedSkillId: string | null;
  onSelectSkill: (id: string) => void;
  skillRows: SkillRow[];
  lastResult: SwarmExecuteResult | null;
  demoSteps: DemoExecutionStepFixture[] | null;
  demoMode: boolean;
  demoExecutionRun: import("@shared/executionStory").ExecutionRun | null;
  commandUx: CommandUXSnapshot;
  explorerUrl?: string | null;
}) {
  const activeLabel = executionStageLabel(lastResult?.execution.status, loopBusy);
  const [skillQuery, setSkillQuery] = useState("");
  const filteredSkillRows = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    if (!q) return skillRows;
    return skillRows.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.authorWallet.toLowerCase().includes(q),
    );
  }, [skillRows, skillQuery]);

  const primaryKind = commandUx.nextActionKind;
  const runIsPrimary = primaryKind === "run" || primaryKind === "view_explorer";
  const connectIsPrimary = primaryKind === "connect" || primaryKind === "verify" || primaryKind === "fix_cluster";

  const txSig = lastResult?.receipts?.[0]?.txSignature;
  const resolvedExplorer = explorerUrl ?? (txSig ? txExplorerUrl(txSig) : null);

  // Map the canonical 9-step story loop onto the 8-stage orbit visualization.
  // Both share the same narrative; the orbit just collapses 0G storage + DA
  // into a single "memory" node for a cleaner ring.
  const orbitActiveIndex = Math.min(7, Math.max(0, Math.round((loopStep / 8) * 7)));
  const proofChannelTone =
    commandUx.proofChannel === "verified"
      ? "proof"
      : commandUx.proofChannel === "demo_only" || commandUx.proofChannel === "unavailable"
        ? "warn"
        : "idle";
  const verified = lastResult?.execution.status === "verified" && !lastResult?.degraded;

  return (
    <div className="space-y-4">
      <CcPanel
        tone="proof"
        className="relative overflow-hidden p-5 sm:p-6"
      >
        {/* Cinematic atmospheric layers */}
        <div className="pointer-events-none absolute inset-0 cc-grid opacity-40" aria-hidden />
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#14f195]/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-72 rounded-full bg-[#38d7d0]/10 blur-3xl" aria-hidden />

        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_minmax(200px,260px)]">
          {/* Left — mission narrative */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14f195]/35 bg-[#14f195]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8ffe8]">
                <Target className="h-3 w-3" aria-hidden />
                Mission · {commandUx.uxState.replace(/_/g, " ")}
              </span>
              <StatusChip
                tone="live"
                pulse={loopBusy}
                label={loopBusy ? "Live execution" : `Stage · ${activeLabel}`}
              />
              <ProofBadge verified={verified} />
            </div>

            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
              {commandUx.headline}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              {commandUx.subline}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-md border border-[#38d7d0]/30 bg-[#38d7d0]/10 px-2 py-0.5 text-[#bdf6f0]">
                <ArrowRight className="h-3 w-3" aria-hidden /> Next · {commandUx.nextActionLabel}
              </span>
              <span
                className="text-slate-500"
                title={commandUx.proofChannelExplanation}
              >
                {proofChannelBadgeLabel(commandUx.proofChannel)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className={cn(
                  "bg-[#14f195] font-semibold text-black hover:bg-[#5cffb8]",
                  runIsPrimary && "ring-2 ring-[#14f195] ring-offset-2 ring-offset-[#060a0e]",
                )}
                disabled={loopBusy || !walletAddress || !selectedSkillId}
                onClick={onRunLoop}
              >
                <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden />
                {loopBusy ? "Orchestrating…" : "Run proof-linked loop"}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "border-[#38d7d0]/45 text-[#b5fff8]",
                  connectIsPrimary && "ring-2 ring-[#38d7d0] ring-offset-2 ring-offset-[#060a0e]",
                )}
                type="button"
                disabled={loopBusy}
                onClick={onConnect}
              >
                <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
                {SOLANA_COPY.wallet.connectVerify}
              </Button>
              {resolvedExplorer ? (
                <Button
                  variant="outline"
                  className={cn(
                    "border-white/20 text-slate-100",
                    primaryKind === "view_explorer" && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#060a0e]",
                  )}
                  asChild
                >
                  <a href={resolvedExplorer} target="_blank" rel="noreferrer">
                    <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden />
                    Verify on Solana
                  </a>
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="border-white/12 text-slate-300"
                type="button"
                disabled={loopBusy}
                onClick={onDemoComplete}
              >
                <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
                Advance demo
              </Button>
            </div>

            {!walletAddress && !demoMode ? (
              <p className="mt-3 text-xs text-amber-200/95">
                {SOLANA_COPY.story.connectForReceipts}
              </p>
            ) : null}
            {walletAddress && !selectedSkillId && skillRows.length > 0 ? (
              <p className="mt-3 text-xs text-cyan-200/90">
                Select a skill below — the same choice stays highlighted across the command center.
              </p>
            ) : null}
          </div>

          {/* Right — live mini-loop orbit + state ring */}
          <div className="relative flex flex-col items-center justify-center gap-3">
            <CcMiniLoopOrbit
              activeIndex={orbitActiveIndex}
              size={220}
              caption={loopBusy ? "executing…" : verified ? "anchored" : demoMode ? "demo loop" : "standby"}
            />
            <div className="flex items-center gap-2 text-[10px]">
              <CcStatusDot tone={proofChannelTone} pulse={loopBusy} />
              <span className="font-mono uppercase tracking-wider text-slate-500">
                {commandUx.proofChannel}
              </span>
            </div>
          </div>
        </div>

        {/* Live metrics rail */}
        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <CcMetric
            label="Stage"
            value={loopStep === 0 ? "ready" : `${loopStep}/8`}
            delta={loopBusy ? "in flight" : verified ? "verified" : "standby"}
            tone={loopBusy ? "live" : verified ? "proof" : "idle"}
            ratio={Math.min(1, loopStep / 8)}
          />
          <CcMetric
            label="Memory writes"
            value={lastResult?.memoryReflectionId ? "+1" : demoMode ? "+1" : "0"}
            delta={lastResult?.memoryReflectionId ? "reflection-linked" : "awaiting reflection"}
            tone={lastResult?.memoryReflectionId ? "proof" : "idle"}
          />
          <CcMetric
            label="Receipts"
            value={lastResult?.receipts?.length ?? (demoMode ? 4 : 0)}
            delta={verified ? "anchored on Solana" : "pending anchor"}
            tone={verified ? "proof" : "idle"}
          />
          <CcMetric
            label="Skill"
            value={
              skillRows.find(s => s.id === selectedSkillId)?.name?.split(" ")[0] ??
              (selectedSkillId ? "selected" : "—")
            }
            delta={
              selectedSkillId
                ? `rep ${skillRows.find(s => s.id === selectedSkillId)?.reputationScore?.toFixed(0) ?? "—"}`
                : "pick from registry"
            }
            tone={selectedSkillId ? "live" : "warn"}
          />
        </div>
      </CcPanel>

      {demoExecutionRun ? (
        <MissionPanel className="border-[#38d7d0]/35 bg-[#050c10]/95 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87f7d0]">
            Replayable demo execution record
          </p>
          <p className="mt-2 text-xl font-semibold text-white">{demoExecutionRun.currentStage}</p>
          <p className="mt-2 font-mono text-[11px] text-slate-500">{demoExecutionRun.id}</p>
          <p className="mt-2 text-[11px] text-slate-400">
            Goal ·{" "}
            <span className="text-[#dfefff]/90">
              {demoExecutionRun.goal.slice(0, 160)}
              {demoExecutionRun.goal.length > 160 ? "…" : ""}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-slate-300">
            <StatusChip tone="proof" label={`skill · ${demoExecutionRun.skillName}`} className="!normal-case !tracking-normal" />
            <StatusChip
              tone={demoExecutionRun.failureReason ? "warn" : "live"}
              label={demoExecutionRun.failureReason ? "recoverable fault captured" : "nominal sequencing"}
            />
            <StatusChip
              tone="neutral"
              label={`reflection · ${demoExecutionRun.reflectionId ?? "none"}`}
              className="!normal-case font-mono"
            />
            <StatusChip
              tone="neutral"
              label={`memory · ${demoExecutionRun.memoryId ?? "hidden"}`}
              className="!normal-case font-mono"
            />
          </div>
        </MissionPanel>
      ) : null}

      <StoryLoopRail activeIndex={loopStep} labels={STORY_LOOP_LABELS} className="border-[#14f195]/10 bg-[#060a0e]/95" />

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <MissionPanel className="space-y-4 p-5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Current goal</label>
          <textarea
            value={goal}
            onChange={e => onGoalChange(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-slate-100 outline-none ring-[#14f195]/0 transition focus:border-[#14f195]/35 focus:ring-2 focus:ring-[#14f195]/20"
          />
          {loopError ? <p className="text-xs text-rose-300">{loopError}</p> : null}
        </MissionPanel>

        <MissionPanel className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Skill registry</p>
          <p className="mt-1 text-[11px] text-slate-600">{SOLANA_COPY.skillRegistry.capabilityHint}</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
            <Input
              value={skillQuery}
              onChange={e => setSkillQuery(e.target.value)}
              placeholder="Search name, id, author…"
              className="border-white/10 bg-black/50 pl-9 text-sm text-slate-100 placeholder:text-slate-600"
              aria-label="Search skills"
            />
          </div>
          <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {skillRows.length ? (
              filteredSkillRows.map(s => {
                const active = selectedSkillId === s.id;
                return (
                  <motion.button
                    key={s.id}
                    type="button"
                    layout
                    onClick={() => onSelectSkill(s.id)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-xl border px-3 py-3 text-left transition",
                      active
                        ? "border-[#14f195]/45 bg-[#14f195]/10 shadow-[0_0_24px_rgba(20,241,149,0.12)]"
                        : "border-white/8 bg-black/35 hover:border-[#38d7d0]/25"
                    )}
                  >
                    <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#14f195] to-[#38d7d0] opacity-0 transition group-hover:opacity-100" />
                    <div className="flex items-start justify-between gap-2 pl-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{s.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                          v{s.version} · {s.authorWallet.slice(0, 4)}…{s.authorWallet.slice(-4)}
                        </p>
                      </div>
                      <StatusChip
                        tone={active ? "live" : "neutral"}
                        label={active ? "active skill" : "select"}
                        className="!max-w-none !normal-case"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-1 text-[10px] text-slate-400">
                      <span className="rounded border border-white/10 px-1.5 py-0.5">rep {s.reputationScore.toFixed(0)}</span>
                      <span className="rounded border border-white/10 px-1.5 py-0.5">{s.successRate}% success</span>
                      <span className="rounded border border-white/10 px-1.5 py-0.5">{formatClawInteger(s.usageCount)} uses</span>
                      <span className="rounded border border-cyan-500/20 px-1.5 py-0.5 text-cyan-200/80">OpenClaw-ready</span>
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/30 p-4 text-xs text-slate-400">
                <p className="font-medium text-slate-300">No skills loaded</p>
                <p className="mt-2">Connect a wallet on the expected cluster, retry the registry, or turn on demo mode for a full fixture loop.</p>
              </div>
            )}
            {skillRows.length > 0 && filteredSkillRows.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No skills match “{skillQuery}” — clear search or pick another filter.</p>
            ) : null}
          </div>
        </MissionPanel>
      </div>

      {demoExecutionRun ? null : (
        <LiveExecutionStrip lastResult={lastResult} demoSteps={demoSteps} loopBusy={loopBusy} demoMode={demoMode} />
      )}

      {lastResult ? (
        <MissionPanel className="border-[#14f195]/20 bg-[#08120f]/95 p-5">
          <OutcomeNarrative result={lastResult} />
        </MissionPanel>
      ) : null}
    </div>
  );
}

function LiveExecutionStrip({
  lastResult,
  demoSteps,
  loopBusy,
  demoMode,
}: {
  lastResult: SwarmExecuteResult | null;
  demoSteps: DemoExecutionStepFixture[] | null;
  loopBusy: boolean;
  demoMode: boolean;
}) {
  const orchestration = lastResult?.execution.orchestration;
  const steps =
    demoMode && demoSteps?.length
      ? demoSteps.map(s => ({
          role: s.title,
          status:
            s.status === "done"
              ? ("done" as const)
              : s.status === "failed"
                ? ("failed" as const)
                : s.status === "active"
                  ? ("active" as const)
                  : ("pending" as const),
          detail: s.detail,
        }))
      : orchestration?.map(o => ({
          role: o.label,
          status: o.status === "done" ? ("done" as const) : o.status === "failed" ? ("failed" as const) : o.status === "active" ? ("active" as const) : ("pending" as const),
          detail: o.detail,
        }));

  if (!steps?.length && !loopBusy) {
    return (
      <MissionPanel className="flex items-center gap-3 border-dashed border-white/15 p-5 text-sm text-slate-500">
        <Cpu className="h-8 w-8 shrink-0 text-slate-600" />
        <div>
          <p className="font-medium text-slate-300">Execution rail idle</p>
          <p className="text-xs text-slate-500">Run a loop to populate planner → fleet → critic stages with live status.</p>
        </div>
      </MissionPanel>
    );
  }

  if (loopBusy && !steps?.length) {
    const placeholders = ["Plan", "Delegate", "Execute", "Critic", "Anchor proof"];
    return (
      <MissionPanel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Live execution · stage rail
          </p>
          <StatusChip tone="live" pulse label="resolving steps" />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Planner and operators are spinning up — step detail will land as the API streams orchestration.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {placeholders.map((label, i) => (
            <div
              key={label}
              className="relative flex min-w-[140px] flex-1 animate-pulse flex-col rounded-xl border border-[#38d7d0]/20 bg-black/40 px-3 py-2"
            >
              <span className="text-[10px] uppercase tracking-wide text-slate-600">Step {i + 1}</span>
              <span className="text-sm font-medium text-slate-400">{label}</span>
              <span className="mt-1 text-[10px] font-medium uppercase text-[#38d7d0]">pending</span>
            </div>
          ))}
        </div>
      </MissionPanel>
    );
  }

  return (
    <MissionPanel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Live execution · stage rail</p>
        {loopBusy ? <StatusChip tone="live" pulse label="in flight" /> : null}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {(steps ?? []).map((step, i) => (
          <div key={i} className="relative flex min-w-[140px] flex-1 flex-col rounded-xl border border-white/8 bg-black/40 px-3 py-2">
            {i < (steps?.length ?? 0) - 1 ? (
              <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-600 sm:block" />
            ) : null}
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Step {i + 1}</span>
            <span className="text-sm font-medium text-slate-100">{step.role}</span>
            <span
              className={cn(
                "mt-1 text-[10px] font-medium uppercase",
                step.status === "done" && "text-[#14f195]",
                step.status === "failed" && "text-rose-300",
                step.status === "active" && "text-[#38d7d0]",
                step.status === "pending" && "text-slate-600"
              )}
            >
              {step.status}
            </span>
            {step.detail ? <p className="mt-1 text-[10px] leading-snug text-slate-500">{step.detail}</p> : null}
          </div>
        ))}
      </div>
    </MissionPanel>
  );
}

function swarmReceiptProofStatus(r: SwarmReceipt): ProofStatus {
  if (r.txSignature?.length && r.explorerUrl?.length) return "pending";
  return "unverified";
}

function OutcomeNarrative({ result }: { result: SwarmExecuteResult }) {
  const structured = result.structuredReceipts?.[result.structuredReceipts.length - 1];
  const truth = structured ? getReceiptTruthLine(structured) : null;
  const claim = structured ? getClaimText(structured) : null;
  const framework = result.agentFramework ?? result.execution.agentFramework;
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ReceiptText className="h-4 w-4 text-[#14f195]" />
        <span className="font-medium text-[#b8ffd9]">Execution record · {result.execution.id}</span>
        <StatusChip label={`status · ${result.execution.status}`} tone={result.degraded ? "warn" : "neutral"} />
      </div>
      {framework ? (
        <div className="rounded-xl border border-[#14f195]/20 bg-[#060a0e]/80 p-1">
          <p className="px-3 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#14f195]/90">
            Agent framework trace
          </p>
          <div className="p-3">
            <AgentFrameworkInspector run={framework} />
          </div>
        </div>
      ) : null}
      {result.reflection ? (
        <div className="rounded-xl border border-[#38d7d0]/25 bg-black/40 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#38d7d0]">Reflection record (off-chain narrative)</p>
          <p className="mt-2 text-slate-300">{result.reflection.summary}</p>
          <p className="mt-2 text-xs text-slate-500">Root cause: {result.reflection.rootCause}</p>
          <p className="mt-2 text-xs text-slate-500">Corrective note: {result.reflection.correctiveAdvice}</p>
          <p className="mt-2 text-xs text-[#14f195]">Next action · {result.reflection.nextAction}</p>
          <p className="mt-2 text-[11px] text-slate-600">
            Evidence: turn {result.reflection.sourceTurnId}
            {result.reflection.offchainStorageRef
              ? ` · storage ref ${result.reflection.offchainStorageRef.slice(0, 24)}…`
              : " · storage ref pending"}
            {result.reflection.proofHash ? ` · payload hash ${result.reflection.proofHash.slice(0, 18)}…` : ""}
          </p>
        </div>
      ) : null}
      {structured ? (
        <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-[11px] text-slate-400">
          <p className="font-medium text-slate-200">{structured.title}</p>
          <p className="mt-1 text-slate-500">{truth}</p>
          <p className="mt-1">{claim}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs">
        {result.execution.explorerUrl ? (
          <a href={result.execution.explorerUrl} target="_blank" rel="noreferrer" className="text-[#38d7d0] underline-offset-4 hover:underline">
            Solana explorer (execution)
          </a>
        ) : (
          <span className="text-slate-600">Explorer URL pending for this run.</span>
        )}
        {result.receipts?.[0]?.txSignature ? (
          <span className="font-mono text-[10px] text-slate-500">tx {result.receipts[0].txSignature.slice(0, 12)}…</span>
        ) : null}
      </div>
    </div>
  );
}

export function LiveRunsBoard({ runs }: { runs: SwarmMissionRun[] }) {
  if (!runs.length) {
    return (
      <MissionPanel className="p-8 text-center text-sm text-slate-500">
        No mission traces yet. Run a loop from the Solana mission deck or enable autoplay in Settings.
      </MissionPanel>
    );
  }
  return (
    <div className="space-y-3">
      {runs.map((run, idx) => (
        <MissionPanel key={run.id} className={cn("p-5", idx === 0 && "border-[#14f195]/25")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-xl text-sm font-medium text-white">{run.goal}</p>
            <StatusChip
              tone={run.status === "running" ? "live" : run.status === "success" ? "proof" : "warn"}
              pulse={run.status === "running"}
              label={run.status}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            autonomy {run.autonomyScoreBefore} → {run.autonomyScoreAfter} · skills {run.selectedSkillIds.join(", ")}
          </p>
          <div className="mt-4 border-l border-white/10 pl-4">
            {run.events.map((ev, i) => (
              <div key={ev.id} className="relative pb-4 last:pb-0">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#14f195]/80" />
                {i < run.events.length - 1 ? <span className="absolute -left-[17px] top-3 bottom-0 w-px bg-white/10" /> : null}
                <p className="text-xs font-medium text-slate-200">
                  {ev.phase} · {ev.title}
                </p>
                <p className="text-[11px] text-slate-500">{ev.detail}</p>
              </div>
            ))}
          </div>
        </MissionPanel>
      ))}
    </div>
  );
}

export function SkillsAssetGallery({ skills }: { skills: SwarmSkill[] }) {
  if (!skills.length) {
    return (
      <MissionPanel className="border-dashed border-white/15 p-8 text-center">
        <p className="text-sm font-medium text-slate-200">No fleet skills mirrored yet</p>
        <p className="mt-2 text-xs text-slate-500">
          Run a proof-linked loop from Overview or enable demo mode — this column shows the runtime skill manifest your agents last bound to.
        </p>
      </MissionPanel>
    );
  }
  return (
    <div className="relative space-y-2">
      <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-[#14f195]/50 via-[#38d7d0]/30 to-transparent md:block" />
      {skills.map(skill => (
        <MissionPanel key={skill.id} className="md:ml-6 border-white/[0.07] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#14f195]/80">Published skill asset</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">{skill.name}</h3>
              <p className="font-mono text-[10px] text-slate-500">{skill.authorWallet}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <StatusChip label={`v${skill.version}`} tone="neutral" className="!normal-case" />
              <StatusChip label={skill.autonomyLevel.replaceAll("_", " ")} tone="proof" className="!normal-case" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">{skill.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
              <span className="text-slate-600">Reputation</span>
              <p className="font-medium text-slate-200">{skill.reputation}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
              <span className="text-slate-600">Success</span>
              <p className="font-medium text-slate-200">{skill.successRate}%</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
              <span className="text-slate-600">Proofs</span>
              <p className="font-medium text-slate-200">{skill.proofCount}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
              <span className="text-slate-600">Uses</span>
              <p className="font-medium text-slate-200">{formatClawInteger(skill.usageCount)}</p>
            </div>
          </div>
        </MissionPanel>
      ))}
    </div>
  );
}

export function MemoryLineageColumn({
  memories,
  demoTimeline,
  demoTraceable,
}: {
  memories: SwarmMemoryRecord[];
  demoTimeline: ReturnType<typeof buildMemoryTimeline> | null;
  demoTraceable: import("@shared/executionStory").TraceableMemoryRecord | null;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        {demoTraceable ? (
          <MissionPanel className="border-emerald-500/30 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
              Traceable memory (demo lineage)
            </p>
            <p className="mt-2 font-mono text-xs text-emerald-50">{demoTraceable.id}</p>
            <p className="mt-2 text-sm text-slate-200">{demoTraceable.summary}</p>
            <dl className="mt-4 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
              <div>
                <dt className="text-slate-600">Source execution</dt>
                <dd className="font-mono">{demoTraceable.sourceExecutionId}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Source turn</dt>
                <dd className="font-mono">{demoTraceable.sourceTurnId}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Reflection linkage</dt>
                <dd className="font-mono">{demoTraceable.sourceReflectionId ?? "unknown"}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Next turn</dt>
                <dd className="font-mono">{demoTraceable.linkedNextTurnId ?? "unknown"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-600">Storage ref</dt>
                <dd className="break-all font-mono text-[11px]">{demoTraceable.storageRef ?? "unknown"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-600">Proof state</dt>
                <dd className="font-mono">{demoTraceable.proofStatus}</dd>
              </div>
            </dl>
          </MissionPanel>
        ) : null}

        {memories.length ? (
          memories.map(m => (
            <MissionPanel key={m.id} className="border-cyan-500/15 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-500/80">Reflection-linked memory</p>
              <p className="mt-1 text-xs font-medium text-slate-200">Lesson source · {m.sourceFailure}</p>
              <p className="mt-2 text-[11px] text-slate-400">Corrective note · {m.correctiveAdvice}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span>influence {m.memoryInfluence}%</span>
                <span>
                  policy confidence {m.confidenceBefore} → {m.confidenceAfter}
                </span>
                <span className="font-mono">proof receipt {m.proofReceiptId.slice(0, 12)}…</span>
              </div>
            </MissionPanel>
          ))
        ) : (
          <MissionPanel className="p-6 text-sm text-slate-500">
            No memory writes yet. After a failed or partial run, reflections mint a memory row with a linked proof receipt id.
          </MissionPanel>
        )}
      </div>
      {demoTimeline?.length ? (
        <MissionPanel className="h-fit p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Lineage</p>
          <ul className="mt-3 space-y-2">
            {demoTimeline.map(st => (
              <li key={st.id} className="text-[11px]">
                <span className="text-[#38d7d0]">{st.stage}</span>
                <p className="text-slate-400">{st.description}</p>
              </li>
            ))}
          </ul>
        </MissionPanel>
      ) : null}
    </div>
  );
}

/** @deprecated Use MemoryLineageColumn */
export const MemoryIntelligenceColumn = MemoryLineageColumn;

export function ReflectionStack({ reflections }: { reflections: SwarmReflection[] }) {
  return (
    <div className="space-y-3">
      {reflections.length ? (
        reflections.map(r => (
          <MissionPanel key={r.id} className="border-[#38d7d0]/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#38d7d0]">Reflection record</p>
            <p className="mt-2 text-sm text-slate-200">Root cause · {r.rootCause}</p>
            <p className="mt-2 text-xs text-slate-400">Corrective note · {r.correctiveAdvice}</p>
            <p className="mt-2 text-xs text-[#14f195]">Next action (injected) · {r.nextAction}</p>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-600">Why believe this?</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Tie-break using the on-chain receipt row for this run; full narrative should list storage ref + Solana tx when anchored.
            </p>
          </MissionPanel>
        ))
      ) : (
        <MissionPanel className="p-6 text-sm text-slate-500">Reflections appear after the first non-trivial turn closes.</MissionPanel>
      )}
    </div>
  );
}

export function ReceiptVault({ receipts }: { receipts: SwarmReceipt[] }) {
  return (
    <div className="space-y-3">
      {receipts.map(r => {
        const proofStatus = swarmReceiptProofStatus(r);
        return (
          <MissionPanel key={r.id} className="border-[#14f195]/15 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-white">{r.label}</span>
              <ProofStateBadge status={proofStatus} />
            </div>
            <dl className="mt-3 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
              <div>
                <dt className="text-slate-600">Receipt kind</dt>
                <dd className="font-mono text-slate-300">{r.kind}</dd>
              </div>
              <div>
                <dt className="text-slate-600">TX signature</dt>
                <dd className="truncate font-mono">{r.txSignature.slice(0, 20)}…</dd>
              </div>
              <div>
                <dt className="text-slate-600">Summary hash</dt>
                <dd className="truncate font-mono">{r.receiptHash.slice(0, 24)}…</dd>
              </div>
              <div>
                <dt className="text-slate-600">Account</dt>
                <dd className="font-mono text-xs">{r.account}</dd>
              </div>
              {r.zeroGStorageRef ? (
                <div className="sm:col-span-2">
                  <dt className="text-slate-600">0G storage ref</dt>
                  <dd className="truncate font-mono text-slate-300">{r.zeroGStorageRef}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Evidence</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {proofStatus === "pending"
                ? "Tx + explorer URL present; confirm finality in Solana Explorer before treating as verified."
                : "Incomplete proof bundle — connect wallet, rerun loop, or inspect degraded banner."}
            </p>
            <a href={r.explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#38d7d0] hover:underline">
              Open in Solana explorer
            </a>
          </MissionPanel>
        );
      })}
      {!receipts.length ? <MissionPanel className="p-6 text-sm text-slate-500">No receipts in-session yet.</MissionPanel> : null}
    </div>
  );
}

export function ProofExplorerList({ receipts }: { receipts: SwarmReceipt[] }) {
  return <ReceiptVault receipts={receipts} />;
}

export function AgentsOrchestrationGrid({ agents }: { agents: SwarmAgentNode[] }) {
  return (
    <div className="space-y-4">
      <MissionPanel className="p-4 text-xs text-slate-400">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fleet appendix</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLAW_AGENT_FLEET_ROLES.map(r => (
            <span key={r.role} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1">
              <span className="text-[#14f195]">{r.role}</span> · {formatClawInteger(r.count)}
            </span>
          ))}
        </div>
      </MissionPanel>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map(agent => (
          <MissionPanel key={agent.id} className="p-4">
            <p className="text-sm font-medium text-white">{agent.name}</p>
            <p className="text-[11px] text-[#38d7d0]">{agent.role}</p>
            <div className="mt-3 space-y-1 text-[11px] text-slate-400">
              <p>Reputation {agent.reputation}</p>
              <p>Memory depth {agent.memoryCount}</p>
              <p>Proofs {agent.proofCount}</p>
            </div>
          </MissionPanel>
        ))}
      </div>
    </div>
  );
}

export function ReputationAutonomyBoard({
  runtime,
}: {
  runtime: SwarmRuntimeState;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MissionPanel className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Autonomy spectrum</p>
        <p className="mt-1 text-xs text-slate-500">{autonomyLabel(runtime.autonomyLevel)}</p>
        <div className="mt-4 space-y-2">
          {AUTONOMY_SPECTRUM.map(level => (
            <div
              key={level}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs transition",
                runtime.autonomyLevel === level
                  ? "border-[#14f195]/45 bg-[#14f195]/10 text-[#d7ffe8]"
                  : "border-white/8 bg-black/35 text-slate-500"
              )}
            >
              {level.replaceAll("_", " ")}
            </div>
          ))}
        </div>
      </MissionPanel>
      <MissionPanel className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trust surface</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/5 py-2">
            <dt className="text-slate-500">Autonomy score</dt>
            <dd className="font-mono text-[#14f195]">{runtime.autonomyScore}</dd>
          </div>
          <div className="flex justify-between border-b border-white/5 py-2">
            <dt className="text-slate-500">Proof completeness</dt>
            <dd className="font-mono">{runtime.proofCompletionRate}%</dd>
          </div>
          <div className="flex justify-between border-b border-white/5 py-2">
            <dt className="text-slate-500">Reflections</dt>
            <dd className="font-mono">{runtime.reflectionsGenerated}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Policy approvals</dt>
            <dd className="font-mono">{runtime.policyApprovals}</dd>
          </div>
        </dl>
      </MissionPanel>
    </div>
  );
}

export function OpenClawBridgeBoard({
  status,
  receipts,
}: {
  status: OpenClawBridgeStatus;
  receipts: { id: string; label: string; direction: string }[];
}) {
  return (
    <div className="space-y-4">
      <MissionPanel className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#14f195]">OpenClaw interoperability</p>
        <p className="mt-2 text-sm text-slate-400">
          Imported manifests become versioned skills here; exports carry provenance hashes for downstream verification.
        </p>
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-slate-500">Mode</span>
            <p className="mt-1 font-medium text-slate-200">{status.mode}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-slate-500">Sync</span>
            <p className="mt-1 font-medium text-slate-200">{status.lastSyncAt ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-slate-500">Imported</span>
            <p className="mt-1 font-mono text-[#14f195]">{status.importedCount}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-slate-500">Exported</span>
            <p className="mt-1 font-mono text-[#38d7d0]">{status.exportedCount}</p>
          </div>
        </div>
      </MissionPanel>
      <div className="space-y-2">
        {receipts.map(r => (
          <MissionPanel key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
            <span className="font-mono text-slate-300">{r.id}</span>
            <StatusChip label={r.direction} tone="proof" className="!normal-case" />
            <span className="text-slate-500">{r.label}</span>
          </MissionPanel>
        ))}
      </div>
    </div>
  );
}

export function SettingsDeck({
  runtime,
  autoplay,
  onAutoplay,
  onRunOnce,
}: {
  runtime: SwarmRuntimeState;
  autoplay: boolean;
  onAutoplay: () => void;
  onRunOnce: () => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MissionPanel className="space-y-3 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Simulator</p>
        <Button className="w-full bg-[#14f195] text-black hover:bg-[#5cffb8]" onClick={onRunOnce}>
          Run one autonomous cycle
        </Button>
        <Button variant="outline" className={cn("w-full border-white/15", autoplay && "border-[#14f195]/40 text-[#14f195]")} onClick={onAutoplay}>
          {autoplay ? "Stop autoplay" : "Autoplay demo loop"}
        </Button>
      </MissionPanel>
      <MissionPanel className="space-y-2 p-5 text-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Runtime</p>
        <p className="text-slate-400">Cluster: {runtime.cluster}</p>
        <p className="text-slate-400">Autonomy: {runtime.autonomyLevel.replaceAll("_", " ")}</p>
      </MissionPanel>
    </div>
  );
}

export function ZerogSidecarPanel({
  health,
  runtimeSnippet,
}: {
  health: ZeroGHealthResponse;
  runtimeSnippet: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <ZeroGHealthBanner health={health} />
      <MissionPanel className="p-4 text-xs text-slate-400">{runtimeSnippet}</MissionPanel>
    </div>
  );
}

export function ProofGraphPanel({ graph }: { graph: ZeroGProofGraphResponse }) {
  return (
    <MissionPanel className="p-4">
      <ZeroGProofGraph graph={graph} />
    </MissionPanel>
  );
}

/** Demo hub: mirrors left-rail “Demo Mode” — story, toggles, deep links */
export function DemoModeCommandPanel({
  demoMode,
  onDemoMode,
}: {
  demoMode: boolean;
  onDemoMode: (v: boolean) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <MissionPanel className="border-[#14f195]/20 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#14f195]">Demo mode</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Tell the full Solana agent story without mainnet friction</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Wallet → skill → plan → execution → reflection → memory → receipt → explorer. Toggle on to seed fixtures when RPC or indexer is thin; judges
          still see the same spine as production.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500">{demoMode ? "Demo narrative on" : "Off — live chain only"}</span>
          <Switch checked={demoMode} onCheckedChange={onDemoMode} aria-label="Toggle demo mode from demo panel" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="bg-[#14f195] font-semibold text-black hover:bg-[#5cffb8]" asChild>
            <a href="/demo/hub">Open mock demo hub</a>
          </Button>
          <Button variant="outline" className="border-white/15 text-slate-200" asChild>
            <a href="/demo/full-story">Replayable story engine</a>
          </Button>
          <Button variant="outline" className="border-cyan-500/35 text-cyan-100" asChild>
            <a href="/">Landing · onboarding</a>
          </Button>
        </div>
      </MissionPanel>
      <MissionPanel className="p-5 text-sm text-slate-400">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">What is verified vs demo?</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-xs">
          <li>
            <span className="text-slate-200">Live path</span> — wallet session, registry rows, and execution responses from this deployment&apos;s API.
          </li>
          <li>
            <span className="text-slate-200">Demo path</span> — canonical fixtures fill gaps; labels use “demo fixtures” in the proof channel chip.
          </li>
        </ul>
      </MissionPanel>
    </div>
  );
}

/** Right column: wallet, proof, memory, autonomy — always visible story anchors */
export function CommandRightRail({
  demoMode,
  sessionVerified,
  autonomyScore,
  autonomyBandLabel,
  proofRate,
  activeSkillName,
  skillReputation,
  lastTx,
  memorySnippet,
  receiptPreview,
  openClawCompact,
  demoReflection,
  proofChannel,
  proofChannelExplanation,
  explorerUrl,
  storyUxItems = [],
}: {
  demoMode: boolean;
  sessionVerified: boolean;
  autonomyScore: number;
  autonomyBandLabel: string;
  proofRate: number;
  activeSkillName?: string;
  skillReputation?: number;
  lastTx?: string;
  memorySnippet?: string;
  receiptPreview?: string;
  openClawCompact: string;
  demoReflection?: DemoReflectionFixture | null;
  proofChannel: ProofChannel;
  proofChannelExplanation: string;
  explorerUrl?: string | null;
  storyUxItems?: UXTimelineItem[];
}) {
  const liveProofVerified = proofChannel === "verified";
  const proofPanelTone = !sessionVerified ? "warn" : liveProofVerified ? "proof" : "live";
  return (
    <div className="flex flex-col gap-3 p-3 lg:p-4">
      {/* Story anchor heading — reminds the user this rail is the proof spine */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[#14f195]/30 bg-[#14f195]/10">
            <ShieldCheck className="h-3 w-3 text-[#14f195]" aria-hidden />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Proof rail · Solana
          </p>
        </div>
        <span className="text-[9px] font-mono text-slate-600">wallet · skill · proof</span>
      </div>

      {demoMode ? (
        <CcPanel tone="warn" className="px-3 py-2 text-[11px] text-amber-100/90">
          Demo mode projects a full loop — judges see the narrative without mainnet RPC. Proof channel shows{" "}
          <span className="font-medium text-amber-50">demo fixtures</span> where applicable.
        </CcPanel>
      ) : null}

      <SolanaWalletPanel compact />

      {storyUxItems.length ? (
        <CcPanel className="space-y-1 p-3.5">
          <CcSectionHeader
            kicker="same story · two views"
            title="Proof path checklist"
            icon={ShieldCheck}
          />
          <p className="text-[10px] text-slate-600">
            Mirrors the bottom timeline — use this rail when the strip is off-screen on small viewports.
          </p>
          <StoryAtAGlance items={storyUxItems} />
        </CcPanel>
      ) : null}

      {/* Compact verified-state ribbon */}
      <CcPanel tone={proofPanelTone} glow={liveProofVerified} className="space-y-2.5 p-3.5">
        <CcSectionHeader
          icon={ShieldCheck}
          kicker="proof channel"
          title={
            proofChannel === "demo_only"
              ? "Demo fixtures · illustrative proof"
              : liveProofVerified
                ? "Proof anchored · explorer-verifiable"
                : sessionVerified
                  ? "Session verified · awaiting anchor"
                  : "Session not yet signed"
          }
          status={<ProofBadge verified={liveProofVerified} />}
        />
        <p className="text-[10.5px] leading-relaxed text-slate-500" title={proofChannelExplanation}>
          {proofChannelExplanation}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <StatusChip
            tone={sessionVerified ? "proof" : "warn"}
            label={sessionVerified ? "Verified session" : "Session pending"}
          />
          <StatusChip
            tone={
              proofChannel === "verified"
                ? "proof"
                : proofChannel === "demo_only" || proofChannel === "unavailable"
                  ? "warn"
                  : "neutral"
            }
            label={proofChannel.replaceAll("_", " ")}
            className="!normal-case"
          />
        </div>

        {/* Trust metrics — micro tiles */}
        <div className="grid grid-cols-2 gap-1.5">
          <CcMetric
            label="Autonomy"
            value={autonomyScore}
            delta={autonomyBandLabel}
            tone="proof"
            ratio={Math.max(0, Math.min(1, autonomyScore / 100))}
          />
          <CcMetric
            label="Proof rate"
            value={`${proofRate}%`}
            delta={liveProofVerified ? "anchored" : "in flight"}
            tone={liveProofVerified ? "proof" : "live"}
            ratio={Math.max(0, Math.min(1, proofRate / 100))}
          />
        </div>

        <dl className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
            <dt className="text-slate-500">Active skill</dt>
            <dd className="truncate text-right text-slate-200">
              {activeSkillName ?? "—"}
              {typeof skillReputation === "number" ? (
                <span className="ml-1.5 font-mono text-slate-500">
                  rep {skillReputation.toFixed(0)}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-500">Latest tx</dt>
            <dd className="flex min-w-0 flex-1 items-center justify-end gap-1">
              {lastTx ? (
                <>
                  <span className="truncate font-mono text-[10px] text-slate-400">{lastTx}</span>
                  <DappCopyButton
                    value={lastTx}
                    label="Copy"
                    variant="ghost"
                    toastMessage="Tx signature copied"
                    className="shrink-0 px-1.5 py-0.5 text-[10px]"
                  />
                </>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </dd>
          </div>
        </dl>

        {explorerUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-cyan-500/30 text-cyan-100"
            asChild
          >
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {SOLANA_COPY.wallet.explorerTx}
            </a>
          </Button>
        ) : null}
      </CcPanel>

      {/* Memory pulse */}
      <CcPanel className="space-y-1.5 p-3.5">
        <CcSectionHeader
          kicker="memory pulse"
          title="Latest reflection-linked write"
          icon={Sparkles}
        />
        <p className="text-[11.5px] leading-relaxed text-slate-400">
          {memorySnippet ?? "No snippet yet — run a turn with reflection enabled."}
        </p>
      </CcPanel>

      {/* Receipt preview */}
      <CcPanel
        tone={receiptPreview ? "proof" : "idle"}
        className="space-y-1.5 p-3.5"
      >
        <CcSectionHeader
          kicker="receipt preview"
          title={receiptPreview ? "Compact Solana receipt" : "Awaiting anchor"}
          icon={ReceiptText}
          status={
            <CcStatusDot tone={receiptPreview ? "proof" : "idle"} pulse={!receiptPreview} />
          }
        />
        <p className="break-all font-mono text-[10px] text-slate-500">
          {receiptPreview ?? "Execution idle — start a loop to mint a receipt."}
        </p>
        {receiptPreview ? (
          <DappCopyButton
            value={receiptPreview}
            label="Copy receipt / tx id"
            variant="pill"
            toastMessage="Copied"
            className="text-[10px]"
          />
        ) : null}
      </CcPanel>

      {demoReflection ? (
        <CcPanel tone="live" className="space-y-1.5 p-3.5">
          <CcSectionHeader
            kicker="reflection · demo"
            title="Corrective advice for next turn"
          />
          <p className="text-[11.5px] leading-relaxed text-slate-300">
            {demoReflection.correctiveAdvice}
          </p>
        </CcPanel>
      ) : null}

      <CcPanel className="space-y-1.5 p-3.5">
        <CcSectionHeader kicker="OpenClaw" title="Bridge interoperability" />
        <p className="text-[11px] leading-relaxed text-slate-500">{openClawCompact}</p>
      </CcPanel>
    </div>
  );
}

export function buildDemoBundle(skillId: string | null) {
  const sk = getSkillById(skillId ?? "skill-support-triage") ?? DEMO_SKILLS[0]!;
  const outcome = "recovery" as const;
  const plan = buildPlan(sk, outcome);
  const stepFixtures = buildExecutionSteps(outcome);
  const receipts = buildReceipts(sk, outcome);
  const artifact = buildDemoExecutionArtifacts({
    wallet: DEMO_WALLET,
    skill: sk,
    plan,
    stepFixtures,
    receipts,
    outcome,
  });
  return {
    skill: sk,
    plan,
    steps: stepFixtures,
    reflection: artifact.reflection
      ? {
          id: artifact.reflection.id,
          sourceTurnId: artifact.reflection.sourceTurnId,
          outcome: outcome === "recovery" ? ("lesson" as const) : ("failure" as const),
          rootCause: artifact.reflection.rootCause,
          correctiveAdvice: artifact.reflection.correctiveAdvice,
          nextAction: artifact.reflection.nextAction,
          confidence: outcome === "recovery" ? 91 : 74,
          linkedMemoryId: artifact.traceableMemory?.id ?? "",
          linkedReceiptId: artifact.reflection.proofRef ?? "",
          proofStatus: "verified" as const,
        }
      : null,
    memory: artifact.traceableMemory
      ? {
          id: artifact.traceableMemory.id,
          memoryType: artifact.traceableMemory.kind,
          source: artifact.reflection ? `Reflection ${artifact.reflection.id}` : "live",
          summary: artifact.traceableMemory.summary,
          storageReference: artifact.traceableMemory.storageRef ?? "",
          proofReference: artifact.traceableMemory.proofReceiptId ?? "",
          linkedNextTurnId: artifact.traceableMemory.linkedNextTurnId ?? "",
          verification: artifact.traceableMemory.proofStatus === "verified" ? ("verified" as const) : ("pending" as const),
          timestampIso: artifact.traceableMemory.createdAt,
        }
      : null,
    receipts,
    agents: buildAgentsForScenario("full-e2e", outcome),
    wallet: DEMO_WALLET,
    memoryTimeline: buildMemoryTimeline(true),
    executionRun: artifact.executionRun,
    traceableMemory: artifact.traceableMemory,
    storyReflection: artifact.reflection,
    commandReceipts: artifact.commandReceipts,
  };
}

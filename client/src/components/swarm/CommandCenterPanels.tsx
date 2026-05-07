import { StoryLoopRail } from "@/components/command-center/StoryLoopRail";
import {
  MissionPanel,
  ProofBadge,
  StatusChip,
} from "@/components/command-center/CommandCenterShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SolanaWalletPanel from "@/components/solana/SolanaWalletPanel";
import { ZeroGHealthBanner } from "@/components/zerog/ZeroGHealthBanner";
import { ZeroGProofGraph } from "@/components/zerog/ZeroGProofGraph";
import type { ZeroGHealthResponse, ZeroGProofGraphResponse } from "@/lib/zerog/types";
import { getClientZeroGConfig } from "@/lib/zerog/config";
import { SOLANA_COPY, STORY_LOOP_LABELS } from "@shared/copy";
import { cn } from "@/lib/utils";
import {
  buildAgentsForScenario,
  buildExecutionSteps,
  buildMemory,
  buildMemoryTimeline,
  buildPlan,
  buildReceipts,
  buildReflection,
  DEMO_SKILLS,
  DEMO_WALLET,
  getSkillById,
} from "@shared/demoFixtures";
import type { DemoExecutionStepFixture, DemoReflectionFixture } from "@shared/demoTypes";
import type { SwarmExecuteResult } from "@shared/domainModel";
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
import { AlertTriangle, ArrowRight, Cpu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

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
}) {
  const activeLabel = executionStageLabel(lastResult?.execution.status, loopBusy);

  return (
    <div className="space-y-4">
      <MissionPanel className="relative overflow-hidden border-[#14f195]/15 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#14f195]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-[#38d7d0]/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Solana mission control</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Solana Autonomous Agent Command Center
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{SOLANA_COPY.dashboard.heroSubtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusChip tone="live" pulse={loopBusy} label={loopBusy ? "Live execution" : `Run · ${activeLabel}`} />
            <ProofBadge verified={lastResult?.execution.status === "verified" && !lastResult?.degraded} />
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Button
            className="bg-[#14f195] font-semibold text-black hover:bg-[#5cffb8]"
            disabled={loopBusy || !walletAddress}
            onClick={onRunLoop}
          >
            {loopBusy ? "Orchestrating…" : "Run Solana proof-linked loop"}
          </Button>
          <Button variant="outline" className="border-[#38d7d0]/40 text-[#b5fff8]" type="button" disabled={loopBusy} onClick={onConnect}>
            {SOLANA_COPY.wallet.connectVerify}
          </Button>
          <Button variant="outline" className="border-white/15 text-slate-200" type="button" disabled={loopBusy} onClick={onDemoComplete}>
            Advance demo stage
          </Button>
        </div>
      </MissionPanel>

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
          {!walletAddress ? (
            <p className="text-xs text-amber-200/90">{SOLANA_COPY.story.connectForReceipts}</p>
          ) : null}
          {loopError ? <p className="text-xs text-rose-300">{loopError}</p> : null}
        </MissionPanel>

        <MissionPanel className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Skill registry</p>
          <p className="mt-1 text-[11px] text-slate-600">{SOLANA_COPY.skillRegistry.capabilityHint}</p>
          <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {skillRows.length ? (
              skillRows.map(s => {
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
              <p className="text-xs text-slate-500">No registry rows yet — enable demo mode or verify a wallet on devnet.</p>
            )}
          </div>
        </MissionPanel>
      </div>

      <LiveExecutionStrip
        lastResult={lastResult}
        demoSteps={demoSteps}
        loopBusy={loopBusy}
        demoMode={demoMode}
      />

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

function OutcomeNarrative({ result }: { result: SwarmExecuteResult }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#14f195]" />
        <span className="font-medium text-[#b8ffd9]">Last run · {result.execution.id}</span>
        <StatusChip label={`status · ${result.execution.status}`} tone={result.degraded ? "warn" : "neutral"} />
      </div>
      {result.reflection ? (
        <div className="rounded-xl border border-[#38d7d0]/25 bg-black/40 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#38d7d0]">Reflection created</p>
          <p className="mt-2 text-slate-300">{result.reflection.summary}</p>
          <p className="mt-2 text-xs text-slate-500">Next action: {result.reflection.nextAction}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs">
        {result.execution.explorerUrl ? (
          <a href={result.execution.explorerUrl} target="_blank" rel="noreferrer" className="text-[#38d7d0] underline-offset-4 hover:underline">
            Solana explorer
          </a>
        ) : null}
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
  return (
    <div className="relative space-y-2">
      <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-[#14f195]/50 via-[#38d7d0]/30 to-transparent md:block" />
      {skills.map(skill => (
        <MissionPanel key={skill.id} className="md:ml-6 border-white/[0.07] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
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

export function MemoryIntelligenceColumn({
  memories,
  demoTimeline,
}: {
  memories: SwarmMemoryRecord[];
  demoTimeline: ReturnType<typeof buildMemoryTimeline> | null;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        {memories.length ? (
          memories.map(m => (
            <MissionPanel key={m.id} className="border-cyan-500/15 p-4">
              <p className="text-xs font-medium text-slate-200">{m.sourceFailure}</p>
              <p className="mt-2 text-[11px] text-slate-400">Advice · {m.correctiveAdvice}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span>influence {m.memoryInfluence}%</span>
                <span>
                  confidence {m.confidenceBefore} → {m.confidenceAfter}
                </span>
                <span className="font-mono">receipt {m.proofReceiptId.slice(0, 12)}…</span>
              </div>
            </MissionPanel>
          ))
        ) : (
          <MissionPanel className="p-6 text-sm text-slate-500">No durable memory rows yet — fail gracefully once to populate the lesson path.</MissionPanel>
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

export function ReflectionStack({ reflections }: { reflections: SwarmReflection[] }) {
  return (
    <div className="space-y-3">
      {reflections.length ? (
        reflections.map(r => (
          <MissionPanel key={r.id} className="border-[#38d7d0]/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#38d7d0]">Reflection</p>
            <p className="mt-2 text-sm text-slate-200">{r.rootCause}</p>
            <p className="mt-2 text-xs text-slate-400">{r.correctiveAdvice}</p>
            <p className="mt-2 text-xs text-[#14f195]">Next · {r.nextAction}</p>
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
      {receipts.map(r => (
        <MissionPanel key={r.id} className="border-[#14f195]/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-white">{r.label}</span>
            <ProofBadge verified />
          </div>
          <dl className="mt-3 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
            <div>
              <dt className="text-slate-600">Kind</dt>
              <dd className="font-mono text-slate-300">{r.kind}</dd>
            </div>
            <div>
              <dt className="text-slate-600">TX</dt>
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
          </dl>
          <a href={r.explorerUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-[#38d7d0] hover:underline">
            Open in Solana explorer
          </a>
        </MissionPanel>
      ))}
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

/** Right column: wallet, proof, memory, autonomy — always visible story anchors */
export function CommandRightRail({
  demoMode,
  sessionVerified,
  autonomyScore,
  proofRate,
  activeSkillName,
  lastTx,
  memorySnippet,
  receiptPreview,
  openClawCompact,
  demoReflection,
}: {
  demoMode: boolean;
  sessionVerified: boolean;
  autonomyScore: number;
  proofRate: number;
  activeSkillName?: string;
  lastTx?: string;
  memorySnippet?: string;
  receiptPreview?: string;
  openClawCompact: string;
  demoReflection?: DemoReflectionFixture | null;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-5">
      {demoMode ? (
        <MissionPanel className="border-amber-400/25 bg-amber-500/5 p-3 text-[11px] text-amber-100/90">
          Demo mode projects a full loop — judges see the narrative without mainnet RPC.
        </MissionPanel>
      ) : null}
      <SolanaWalletPanel compact />
      <MissionPanel className="space-y-3 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Proof & trust</p>
        <div className="flex flex-wrap gap-2">
          <StatusChip tone={sessionVerified ? "proof" : "warn"} label={sessionVerified ? "verified session" : "session incomplete"} />
          <ProofBadge verified={Boolean(receiptPreview && sessionVerified)} />
        </div>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-2 border-b border-white/5 pb-2">
            <dt className="text-slate-500">Active skill</dt>
            <dd className="truncate text-right text-slate-200">{activeSkillName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-white/5 pb-2">
            <dt className="text-slate-500">Autonomy score</dt>
            <dd className="font-mono text-[#14f195]">{autonomyScore}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-white/5 pb-2">
            <dt className="text-slate-500">Proof completeness</dt>
            <dd className="font-mono">{proofRate}%</dd>
          </div>
          <div className="flex justify-between gap-2 pb-2">
            <dt className="text-slate-500">Latest signature</dt>
            <dd className="truncate font-mono text-[10px] text-slate-400">{lastTx ? `${lastTx.slice(0, 8)}…` : "—"}</dd>
          </div>
        </dl>
      </MissionPanel>
      <MissionPanel className="space-y-2 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Memory pulse</p>
        <p className="text-xs leading-relaxed text-slate-400">{memorySnippet ?? "No snippet yet — run a turn with reflection enabled."}</p>
      </MissionPanel>
      <MissionPanel className="space-y-2 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Receipt preview</p>
        <p className="break-all font-mono text-[10px] text-slate-500">{receiptPreview ?? "Awaiting anchor — execution idle."}</p>
      </MissionPanel>
      {demoReflection ? (
        <MissionPanel className="space-y-2 border-[#38d7d0]/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#38d7d0]">Reflection · demo</p>
          <p className="text-xs text-slate-300">{demoReflection.correctiveAdvice}</p>
        </MissionPanel>
      ) : null}
      <MissionPanel className="space-y-1 p-4 text-[11px] text-slate-500">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">OpenClaw</p>
        <p>{openClawCompact}</p>
      </MissionPanel>
    </div>
  );
}

export function buildDemoBundle(skillId: string | null) {
  const sk = getSkillById(skillId ?? "skill-support-triage") ?? DEMO_SKILLS[0]!;
  const outcome = "recovery" as const;
  const reflection = buildReflection(outcome);
  return {
    skill: sk,
    plan: buildPlan(sk, outcome),
    steps: buildExecutionSteps(outcome),
    reflection,
    memory: buildMemory(reflection),
    receipts: buildReceipts(sk, outcome),
    agents: buildAgentsForScenario("full-e2e", outcome),
    wallet: DEMO_WALLET,
    memoryTimeline: buildMemoryTimeline(true),
  };
}

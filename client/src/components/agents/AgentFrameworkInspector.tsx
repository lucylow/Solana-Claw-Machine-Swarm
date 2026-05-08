import { MissionPanel } from "@/components/command-center/CommandCenterShell";
import { CcSectionHeader } from "@/components/command-center/CcPrimitives";
import type { AgentFrameworkRun } from "@shared/agents/framework";
import type { AgentDecisionRecord, AgentDelegationHandoff, AgentToolCall } from "@shared/agents/types";
import { cn } from "@/lib/utils";
import {
  Anchor,
  ArrowRight,
  Brain,
  ClipboardList,
  Cpu,
  GitBranch,
  Shield,
  Wrench,
} from "lucide-react";

function confidenceTone(c: string): string {
  if (c === "high" || c === "critical") return "text-emerald-300";
  if (c === "medium") return "text-amber-200";
  return "text-rose-200";
}

function DecisionCard({ d }: { d: AgentDecisionRecord }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[11px]">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="font-mono text-[10px] text-slate-500">{d.decisionType}</span>
        <span className={cn("font-semibold uppercase", confidenceTone(d.confidence))}>{d.confidence}</span>
      </div>
      <p className="mt-1 text-slate-200">{d.rationale}</p>
      <p className="mt-1 text-slate-500">
        Chose <span className="text-cyan-200/90">{d.selectedOptionId}</span>
        {d.optionsConsidered.length ? (
          <span className="text-slate-600">
            {" "}
            · considered {d.optionsConsidered.map(o => o.id).join(", ")}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-[10px] text-slate-600">Policy · {d.policyStatus}</p>
    </div>
  );
}

function DelegationRow({ h }: { h: AgentDelegationHandoff }) {
  return (
    <div className="flex flex-wrap items-start gap-2 rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[11px]">
      <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#38d7d0]" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-200">
          {h.fromRole}
          <ArrowRight className="mx-1 inline h-3 w-3 text-slate-500" aria-hidden />
          {h.toRole}
        </p>
        <p className="text-slate-400">{h.task}</p>
        <p className="mt-1 text-[10px] text-slate-600">
          Out · {h.outputSummary} · confidence {h.confidence}
        </p>
      </div>
    </div>
  );
}

function ToolRow({ t }: { t: AgentToolCall }) {
  return (
    <div className="grid gap-0.5 rounded border border-white/6 bg-black/25 px-2 py-1.5 font-mono text-[10px] sm:grid-cols-[1fr_auto]">
      <span className="text-slate-300">
        {t.toolName}{" "}
        <span className="text-slate-600">({t.toolType})</span>
      </span>
      <span
        className={cn(
          "uppercase sm:text-right",
          t.status === "succeeded" && "text-emerald-300",
          t.status === "failed" && "text-rose-300",
          t.status === "skipped" && "text-slate-500",
        )}
      >
        {t.status}
      </span>
      <p className="sm:col-span-2 text-slate-500">in · {t.inputSummary}</p>
      {t.outputSummary ? (
        <p className="sm:col-span-2 text-slate-400">out · {t.outputSummary}</p>
      ) : null}
      {t.errorMessage ? (
        <p className="sm:col-span-2 text-rose-200/90">err · {t.errorMessage}</p>
      ) : null}
    </div>
  );
}

export function AgentFrameworkInspector({ run }: { run: AgentFrameworkRun }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span className="rounded border border-white/15 px-2 py-0.5 font-mono text-slate-300">
          run {run.runId.slice(0, 18)}…
        </span>
        <span className={cn("font-semibold uppercase", confidenceTone(run.plan.confidence))}>
          framework · {run.status}
        </span>
        <span>cluster {run.cluster}</span>
        <span>
          risk {run.plan.riskLevel} · planner confidence {run.plan.confidence}
        </span>
      </div>

      <MissionPanel className="border-[#38d7d0]/20 bg-black/40 p-4">
        <CcSectionHeader
          icon={Brain}
          title="Intent classification"
          status={<span className="text-[11px] font-normal normal-case text-slate-400">{run.intent.goalType}</span>}
        />
        <dl className="mt-3 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
          <div>
            <dt className="text-slate-600">Risk signals</dt>
            <dd>{run.intent.riskSignals.length ? run.intent.riskSignals.join(" · ") : "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Memory hints</dt>
            <dd>{run.intent.memoryHints.length ? run.intent.memoryHints.join(" · ") : "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-600">Proof hints</dt>
            <dd>{run.intent.proofHints.join(" · ")}</dd>
          </div>
        </dl>
      </MissionPanel>

      <MissionPanel className="border-white/10 bg-black/35 p-4">
        <CcSectionHeader
          icon={ClipboardList}
          title="Structured plan"
          status={
            <span className="max-w-[200px] text-[11px] font-normal normal-case text-slate-400 sm:max-w-md">
              {run.plan.summary.slice(0, 120)}
              {run.plan.summary.length > 120 ? "…" : ""}
            </span>
          }
        />
        <ul className="mt-3 space-y-2">
          {run.plan.steps.map(s => (
            <li key={s.id} className="rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[11px]">
              <p className="font-medium text-slate-200">
                {s.index + 1}. {s.title}{" "}
                <span className="text-slate-500">· {s.ownerAgentId}</span>
              </p>
              <p className="text-slate-400">{s.description}</p>
              <p className="mt-1 text-[10px] uppercase text-slate-600">
                {s.status} · retries {s.retryCount}/{s.maxRetries}
              </p>
            </li>
          ))}
        </ul>
      </MissionPanel>

      <MissionPanel className="border-white/10 bg-black/35 p-4">
        <CcSectionHeader
          icon={GitBranch}
          title="Delegation handoffs"
          status={<span className="text-[11px] font-normal normal-case text-slate-400">Coordinator-visible flow</span>}
        />
        <div className="mt-3 space-y-2">
          {run.delegations.map(h => (
            <DelegationRow key={h.id} h={h} />
          ))}
        </div>
      </MissionPanel>

      <MissionPanel className="border-white/10 bg-black/35 p-4">
        <CcSectionHeader
          icon={Shield}
          title="Decision records"
          status={<span className="text-[11px] font-normal normal-case text-slate-400">Options, rationale, policy</span>}
        />
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {run.decisions.map(d => (
            <DecisionCard key={d.id} d={d} />
          ))}
        </div>
      </MissionPanel>

      <MissionPanel className="border-white/10 bg-black/35 p-4">
        <CcSectionHeader
          icon={Wrench}
          title="Tool trace"
          status={<span className="text-[11px] font-normal normal-case text-slate-400">Registry-ordered, policy-aware</span>}
        />
        <div className="mt-3 space-y-1.5">
          {run.toolCalls.map(t => (
            <ToolRow key={t.id} t={t} />
          ))}
        </div>
      </MissionPanel>

      {run.critic ? (
        <MissionPanel className="border-amber-500/20 bg-black/35 p-4">
          <CcSectionHeader
            icon={Cpu}
            title="Critic evaluation"
            status={
              <span className="text-[11px] font-normal normal-case text-slate-400">
                Score {run.critic.score}/100 · policy {run.critic.policyCompliance}
              </span>
            }
          />
          <p className="mt-2 text-[11px] text-slate-300">{run.critic.critiqueSummary}</p>
          <p className="mt-2 text-[10px] text-slate-500">
            Missing · {run.critic.missingItems.length ? run.critic.missingItems.join(", ") : "none"}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Next · {run.critic.recommendedNextStep} · memory usefulness {run.critic.memoryUsefulness}
          </p>
        </MissionPanel>
      ) : null}

      {run.recoveryEvents.length ? (
        <MissionPanel className="border-rose-500/20 bg-black/35 p-4">
          <CcSectionHeader
            icon={Anchor}
            title="Recovery manager"
            status={<span className="text-[11px] font-normal normal-case text-slate-400">Retries and fallbacks</span>}
          />
          <ul className="mt-2 list-inside list-disc text-[11px] text-slate-300">
            {run.recoveryEvents.map(r => (
              <li key={r.id}>
                {r.kind}: {r.detail}
              </li>
            ))}
          </ul>
        </MissionPanel>
      ) : null}

      {run.reflections.length ? (
        <MissionPanel className="border-cyan-500/20 bg-black/35 p-4">
          <CcSectionHeader
            title="Reflection records"
            status={<span className="text-[11px] font-normal normal-case text-slate-400">Structured lessons</span>}
          />
          {run.reflections.map(r => (
            <div key={r.id} className="mt-2 rounded border border-white/10 bg-black/25 p-2 text-[11px]">
              <p className="text-slate-200">{r.summary}</p>
              <p className="mt-1 text-slate-500">Root cause · {r.rootCause}</p>
              <p className="text-[#14f195]">Next · {r.nextAction}</p>
            </div>
          ))}
        </MissionPanel>
      ) : null}

      {run.memoryRecords.length ? (
        <MissionPanel className="border-emerald-500/15 bg-black/35 p-4">
          <CcSectionHeader
            title="Memory writer"
            status={<span className="text-[11px] font-normal normal-case text-slate-400">Durable artifacts</span>}
          />
          {run.memoryRecords.map(m => (
            <div key={m.id} className="mt-2 text-[11px] text-slate-300">
              <span className="font-mono text-[10px] text-slate-500">{m.kind}</span> · {m.title}: {m.summary}
            </div>
          ))}
        </MissionPanel>
      ) : null}

      {run.proofRecords.length ? (
        <MissionPanel className="border-[#14f195]/25 bg-black/35 p-4">
          <CcSectionHeader
            title="Proof anchor"
            status={<span className="text-[11px] font-normal normal-case text-slate-400">Solana-linked receipts</span>}
          />
          <ul className="mt-2 space-y-2 text-[11px]">
            {run.proofRecords.map(p => (
              <li key={p.id} className="rounded border border-white/10 bg-black/25 px-2 py-1.5 font-mono text-[10px]">
                <span className="text-slate-400">{p.proofType}</span> · {p.proofStatus}
                {p.txSignature ? (
                  <span className="block truncate text-slate-500">tx {p.txSignature}</span>
                ) : null}
                {p.explorerUrl ? (
                  <a href={p.explorerUrl} className="text-cyan-300 underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                    Explorer
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </MissionPanel>
      ) : null}

      <MissionPanel className="border-white/10 bg-black/30 p-3 text-[11px] text-slate-400">
        <p>
          Reputation snapshot · Δ trust {run.reputationSnapshot.skillTrustDelta.toFixed(2)} · autonomy hint{" "}
          {run.reputationSnapshot.autonomyScoreHint > 0 ? "+" : ""}
          {run.reputationSnapshot.autonomyScoreHint}
        </p>
        <p className="mt-1 text-slate-500">{run.reputationSnapshot.notes}</p>
      </MissionPanel>
    </div>
  );
}

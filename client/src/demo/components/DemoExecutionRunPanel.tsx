import { DemoPanel } from "./DemoPanel";
import { ProofVerificationBadge } from "@/components/command-center/CommandCenterComponents";
import { StatusChip } from "@/components/command-center/CommandCenterShell";
import { cn } from "@/lib/utils";
import type { ExecutionRun } from "@shared/executionStory";
import { Cpu, GitMerge, Receipt } from "lucide-react";

function stageTone(stage: ExecutionRun["currentStage"]) {
  if (stage === "failed" || stage === "degraded") return "text-rose-200";
  if (stage === "completed" || stage === "verified") return "text-[#c8ffe8]";
  if (stage === "running" || stage === "retrying") return "text-[#9efefb]";
  return "text-slate-300";
}

export function DemoExecutionRunPanel({
  run,
  presentationMode,
}: {
  run: ExecutionRun;
  presentationMode?: boolean;
}) {
  return (
    <DemoPanel
      glow={run.currentStage !== "idle"}
      presentationMode={presentationMode}
      className="relative overflow-hidden border-[#38d7d0]/25 bg-[#050a0d]/95 p-5"
    >
      <div className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-[#14f195]/15 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Live execution panel</p>
          <h3 className={cn("font-semibold text-white", presentationMode && "text-2xl")}>
            Run · <span className="font-mono text-[#94f7cf]">{run.id}</span>
          </h3>
          <p className={cn("mt-1 text-xl font-semibold tracking-tight", stageTone(run.currentStage))}>{run.currentStage}</p>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">{run.goal}</p>
          <dl className="mt-4 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
            <div className="flex justify-between gap-2 border border-white/[0.06] bg-black/30 px-3 py-2 rounded-lg">
              <dt>Wallet</dt>
              <dd className="truncate font-mono text-slate-200">
                {run.walletAddress ? `${run.walletAddress.slice(0, 4)}…${run.walletAddress.slice(-4)}` : "unknown"}
              </dd>
            </div>
            <div className="flex justify-between gap-2 border border-white/[0.06] bg-black/30 px-3 py-2 rounded-lg">
              <dt>Skill</dt>
              <dd className="truncate text-[#cfefff]">{run.skillName ?? "unknown"} · v{run.skillVersion ?? "?"}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col items-end gap-2">
          {(run.metadata.demoOnly ?? run.metadata.demo_only) ? (
            <StatusChip tone="warn" label="Demo mode labeling · deterministic fixtures" />
          ) : null}
          <StatusChip tone="live" label={`Execution stage · ${run.currentStage}`} />
          <StatusChip
            tone={run.failureReason ? "warn" : "proof"}
            label={run.failureReason ?? "No plan step failure on this scrub frame"}
          />
        </div>
      </div>

      <div className="relative mt-5 rounded-xl border border-white/10 bg-black/45 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plan summary</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">{run.planSummary}</p>
      </div>

      <div className="relative mt-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Plan steps · tool lineage</p>
        {run.steps.map(step => (
          <div
            key={step.id}
            className={cn(
              "rounded-xl border px-4 py-3 transition",
              run.activeStepId === step.id ? "border-[#14f195]/55 bg-[#14f195]/08 shadow-[0_0_28px_rgba(20,241,149,0.12)]" : "border-white/8 bg-black/35"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-200" aria-hidden />
                <span className="text-[10px] font-mono uppercase text-slate-500">Step {step.index + 1}</span>
                <span className="font-medium text-white">{step.title}</span>
              </div>
              <StatusChip
                pulse={step.status === "running"}
                tone={
                  step.status === "failed" ? "warn" : step.status === "succeeded" ? "proof" : step.status === "running" ? "live" : "neutral"
                }
                label={`status · ${step.status}`}
                className="!normal-case !tracking-normal"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{step.description}</p>
            {step.agentName ? (
              <p className="mt-1 text-[10px] text-slate-500">
                Delegation · <span className="text-slate-200">{step.agentName}</span>
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-600">Delegation · unknown (no agent mapping)</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
              {step.dependsOnIds?.length ? (
                <span className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1">
                  <GitMerge className="h-3 w-3" />
                  depends on · {step.dependsOnIds.join(", ")}
                </span>
              ) : (
                <span>No upstream dependencies · entry step.</span>
              )}
              {(step.memoryRefs ?? []).length ? (
                <span className="inline-flex max-w-[220px] truncate rounded border border-cyan-500/25 px-2 py-1 text-cyan-100/85">
                  memory refs · {step.memoryRefs?.join(" · ")}
                </span>
              ) : null}
              {(step.receiptRefs ?? []).length ? (
                <span className="inline-flex items-center gap-1 rounded border border-[#14f195]/35 px-2 py-1 text-[#b8ffd9]">
                  <Receipt className="h-3 w-3" />
                  receipts · {step.receiptRefs?.join(", ")}
                </span>
              ) : null}
            </div>
            {step.toolCalls?.length ? (
              <div className="mt-3 space-y-2 border-l-2 border-white/15 pl-3">
                {(step.toolCalls ?? []).map(tc => (
                  <div key={tc.id} className="rounded-lg border border-white/8 bg-black/40 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">{tc.toolName}</p>
                    <p className="mt-1 text-[11px] text-slate-300">{tc.inputSummary}</p>
                    {tc.outputSummary ? <p className="mt-1 text-[11px] text-[#cfefff]/90">{tc.outputSummary}</p> : null}
                    <div className="mt-2">
                      <ProofVerificationBadge
                        verification={{
                          label: `${tc.toolName} · ${tc.status}`,
                          status:
                            tc.status === "succeeded"
                              ? "verified"
                              : tc.status === "failed"
                                ? "failed"
                                : "pending",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px]">
          reflection id · {run.reflectionId ?? "unknown at this playback beat"}
        </div>
        <div className="rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px]">
          memory id · {run.memoryId ?? "unknown / hidden"}
        </div>
        <div className="rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px]">
          receipt id · {run.receiptId ?? "unknown / pending anchor"}
        </div>
        <div className="rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px]">
          proof id · {run.proofId ?? "unknown / pending explorer"}
        </div>
      </div>
      {run.failureReason ? (
        <p className="relative mt-3 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-100">
          Failure reason · {run.failureReason}
        </p>
      ) : (
        <p className="relative mt-3 text-[11px] text-slate-600">
          Failure reason · unknown (no surfaced operator fault on this scrub frame).
        </p>
      )}
    </DemoPanel>
  );
}

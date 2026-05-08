import { getSkillById } from "@shared/demoFixtures";
import type { DemoExecutionStepFixture, DemoReceiptFixture } from "@shared/demoTypes";
import type { ExecutionStep } from "@shared/executionStory";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DemoExecutionRunPanel } from "../components/DemoExecutionRunPanel";
import { DemoExecutionTimeline } from "../components/DemoExecutionTimeline";
import { DemoMemoryCard } from "../components/DemoMemoryCard";
import { DemoMemoryTimeline } from "../components/DemoMemoryTimeline";
import { DemoMockModeBanner } from "../components/DemoMockModeBanner";
import { DemoOrchestrationFlow } from "../components/DemoOrchestrationFlow";
import { DemoPanel } from "../components/DemoPanel";
import { DemoPlanCard } from "../components/DemoPlanCard";
import { DemoPreviewPanel } from "../components/DemoPreviewPanel";
import { DemoProofPanel } from "../components/DemoProofPanel";
import { DemoReceiptCard } from "../components/DemoReceiptCard";
import { DemoReceiptChain } from "../components/DemoReceiptChain";
import { DemoReflectionCard } from "../components/DemoReflectionCard";
import { DemoReputationPanel } from "../components/DemoReputationPanel";
import { DemoPlaybackController } from "../components/DemoPlaybackController";
import { DemoTraceableMemoryPanel } from "../components/DemoTraceableMemoryPanel";
import { DemoWalletCard } from "../components/DemoWalletCard";
import { useDemo } from "../DemoProvider";

function executionStepsToTimelineFixtures(execSteps: ExecutionStep[]): DemoExecutionStepFixture[] {
  return execSteps.map((s, i) => ({
    id: s.id,
    order: i + 1,
    title: s.title,
    detail: s.description,
    status:
      s.status === "succeeded"
        ? "done"
        : s.status === "running"
          ? "active"
          : s.status === "failed"
            ? "failed"
            : s.status === "skipped"
              ? "pending"
              : "pending",
    durationMs: 820,
  }));
}

export function DemoFullStory() {
  const {
    presentationMode,
    setPresentationMode,
    plan,
    agents,
    reflection,
    memory,
    receipts,
    memoryTimeline,
    activeSkill,
    displayedExecutionRun,
    traceableMemory,
    commandReceipts,
    activeUnifiedBeat,
  } = useDemo();

  const currentBeat = activeUnifiedBeat;

  const visibleReceipts = useMemo(() => {
    if (!currentBeat.patch.hideProofReceiptIds) return receipts;
    return receipts.filter(r => r.kind !== "proof_anchor");
  }, [receipts, currentBeat.patch.hideProofReceiptIds]);

  const visibleCommandReceipts = useMemo(() => {
    if (!currentBeat.patch.hideProofReceiptIds) return commandReceipts;
    return commandReceipts.filter(c => c.type !== "proof");
  }, [commandReceipts, currentBeat.patch.hideProofReceiptIds]);

  const timelineSteps = useMemo(
    () => executionStepsToTimelineFixtures(displayedExecutionRun.steps),
    [displayedExecutionRun.steps]
  );

  const compareSkill = getSkillById("skill-proof-publisher");

  const glow = (region: typeof currentBeat["highlight"]) => currentBeat.highlight === region;

  return (
    <div className="space-y-6">
      <DemoMockModeBanner />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={cn("font-semibold text-white", presentationMode ? "text-3xl" : "text-2xl")}>
            Solana agent story · replayable mission
          </h1>
          <p className="text-sm text-slate-400">
            Wallet connect → skill choose → plan → execute → reflection → memory → receipt → verified next-turn reuse.
          </p>
          <p className="mt-2 text-[11px] font-mono text-[#8ceada]/80">
            {currentBeat.patch.currentStage} · beat {currentBeat.id}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1">
          <span className="text-xs text-slate-400">Presentation mode</span>
          <Switch checked={presentationMode} onCheckedChange={setPresentationMode} />
        </div>
      </div>

      <DemoPlaybackController presentationMode={presentationMode} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <DemoExecutionRunPanel run={displayedExecutionRun} presentationMode={presentationMode} />
          <DemoWalletCard presentationMode={presentationMode} glow={glow("wallet")} />
          <DemoPanel className="border-[#38d7d0]/20 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-wide text-[#87f7d0]">Story beat spotlight</p>
            <p className="mt-2 font-medium text-white">{currentBeat.title}</p>
            <p className="mt-1 text-slate-400">{currentBeat.detail}</p>
          </DemoPanel>
          <DemoPlanCard plan={plan} presentationMode={presentationMode} glow={glow("plan")} />
          <DemoExecutionTimeline steps={timelineSteps} presentationMode={presentationMode} glow={glow("execution")} />
          <DemoOrchestrationFlow agents={agents} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoReflectionCard
              reflection={displayedExecutionRun.reflectionId ? reflection : null}
              presentationMode={presentationMode}
              glow={glow("reflection")}
            />
            <DemoMemoryCard memory={displayedExecutionRun.memoryId ? memory : null} presentationMode={presentationMode} glow={glow("memory")} />
          </div>
          {traceableMemory && displayedExecutionRun.memoryId ? (
            <DemoTraceableMemoryPanel memory={traceableMemory} presentationMode={presentationMode} beatHighlight={currentBeat.highlight} />
          ) : null}
          <DemoMemoryTimeline stages={memoryTimeline} />
          <DemoReceiptChain receipts={visibleReceipts} />
          <DemoReputationPanel skill={activeSkill} compare={compareSkill ?? null} />
          <div className="space-y-2">
            {visibleCommandReceipts.length ? (
              <DemoPanel className="border-white/15 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Structured receipts</p>
                <ul className="mt-3 space-y-2 text-[11px] text-slate-300">
                  {visibleCommandReceipts.map(cr => (
                    <li key={cr.id} className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
                      <span className="font-mono text-[#bfffea]">{cr.type}</span> · <span>{cr.title}</span>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{cr.claim.proofState.replace(/_/g, " ")}</p>
                      {cr.demoLabeled ? (
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-200">Demo-labeled deterministic anchor</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </DemoPanel>
            ) : null}
            {visibleReceipts.map((r: DemoReceiptFixture, i: number) => (
              <DemoReceiptCard key={r.id} receipt={r} defaultOpen={i === visibleReceipts.length - 1} />
            ))}
          </div>
          <DemoProofPanel receipt={visibleReceipts.at(-1) ?? receipts.at(-1)} />
        </div>
        <div className="space-y-4">
          <DemoPreviewPanel presentationMode={presentationMode} />
        </div>
      </div>
    </div>
  );
}

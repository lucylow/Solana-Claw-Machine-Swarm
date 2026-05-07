import { DEMO_GUIDED_STEPS, getSkillById } from "@shared/demoFixtures";
import type { DemoGuidedStep, DemoReceiptFixture } from "@shared/demoTypes";
import { useMemo } from "react";
import { useDemo } from "../DemoProvider";
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
import { DemoStoryStepper } from "../components/DemoStoryStepper";
import { DemoWalletCard } from "../components/DemoWalletCard";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export function DemoFullStory() {
  const {
    guidedStepIndex,
    presentationMode,
    setPresentationMode,
    plan,
    agents,
    steps,
    reflection,
    memory,
    receipts,
    memoryTimeline,
    activeSkill,
  } = useDemo();

  const guidedStep = useMemo(() => DEMO_GUIDED_STEPS[guidedStepIndex] ?? null, [guidedStepIndex]);
  const compareSkill = getSkillById("skill-proof-publisher");

  const glow = (region: DemoGuidedStep["highlight"]) => guidedStep?.highlight === region;

  return (
    <div className="space-y-6">
      <DemoMockModeBanner />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={cn("font-semibold text-white", presentationMode ? "text-3xl" : "text-2xl")}>Guided full story</h1>
          <p className="text-sm text-slate-400">Wallet → discovery → plan → execute → reflect → memory → Solana receipt → reputation.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1">
          <span className="text-xs text-slate-400">Presentation mode</span>
          <Switch checked={presentationMode} onCheckedChange={setPresentationMode} />
        </div>
      </div>

      <DemoStoryStepper presentationMode={presentationMode} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <DemoWalletCard presentationMode={presentationMode} glow={glow("wallet")} />
          <DemoPanel className="border-[#38d7d0]/20 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-wide text-slate-500">Current state (guided)</p>
            <p className="mt-2 font-medium text-white">{guidedStep?.title}</p>
            <p className="mt-1 text-slate-400">{guidedStep?.detail}</p>
          </DemoPanel>
          <DemoPlanCard plan={plan} presentationMode={presentationMode} glow={glow("plan")} />
          <DemoExecutionTimeline steps={steps} presentationMode={presentationMode} glow={glow("execution")} />
          <DemoOrchestrationFlow agents={agents} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoReflectionCard reflection={reflection} presentationMode={presentationMode} glow={glow("reflection")} />
            <DemoMemoryCard memory={memory} presentationMode={presentationMode} glow={glow("memory")} />
          </div>
          <DemoMemoryTimeline stages={memoryTimeline} />
          <DemoReceiptChain receipts={receipts} />
          <DemoReputationPanel skill={activeSkill} compare={compareSkill ?? null} />
          <div className="space-y-2">
            {receipts.map((r: DemoReceiptFixture, i: number) => (
              <DemoReceiptCard key={r.id} receipt={r} defaultOpen={i === receipts.length - 1} />
            ))}
          </div>
          <DemoProofPanel receipt={receipts[receipts.length - 1]} />
        </div>
        <div className="space-y-4">
          <DemoPreviewPanel presentationMode={presentationMode} guidedStep={guidedStep} />
        </div>
      </div>
    </div>
  );
}

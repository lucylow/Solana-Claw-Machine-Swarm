import { cn } from "@/lib/utils";
import type { DemoPlanFixture } from "@shared/demoTypes";
import { GitBranch, Target } from "lucide-react";
import { DemoPanel } from "./DemoPanel";

export function DemoPlanCard({
  plan,
  presentationMode,
  glow,
}: {
  plan: DemoPlanFixture;
  presentationMode?: boolean;
  glow?: boolean;
}) {
  return (
    <DemoPanel
      glow={glow}
      presentationMode={presentationMode}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
        <Target className="h-4 w-4 text-[#3bff96]" />
        Plan artifact
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className={cn(
            "font-semibold text-white",
            presentationMode ? "text-xl" : "text-lg",
          )}
        >
          {plan.goal}
        </h3>
        <span className="font-mono text-xs text-slate-500">{plan.id}</span>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/35 p-2">
          <p className="text-xs text-slate-500">Task type</p>
          <p className="mt-1 text-slate-200">{plan.taskType}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 p-2">
          <p className="text-xs text-slate-500">Steps</p>
          <p className="mt-1 text-slate-200">
            {plan.stepCount} with dependency graph
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 p-2 md:col-span-2">
          <p className="text-xs text-slate-500">Dependencies</p>
          <p className="mt-1 text-slate-300">{plan.dependencies.join(" · ")}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 p-2 md:col-span-2">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <GitBranch className="h-3.5 w-3.5" />
            Chosen skills
          </p>
          <p className="mt-1 font-mono text-xs text-[#c8ffe2]">
            {plan.chosenSkillIds.join(", ")}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 p-2">
          <p className="text-xs text-slate-500">Plan hash</p>
          <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
            {plan.planSummaryHash}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 p-2">
          <p className="text-xs text-slate-500">Execution</p>
          <p className="mt-1 text-slate-200">{plan.executionStatus}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 p-2 md:col-span-2">
          <p className="text-xs text-slate-500">Result summary</p>
          <p className="mt-1 text-sm text-slate-200">{plan.resultSummary}</p>
          <p className="mt-2 break-all font-mono text-[11px] text-slate-500">
            Result hash: {plan.resultHash}
          </p>
        </div>
      </div>
    </DemoPanel>
  );
}

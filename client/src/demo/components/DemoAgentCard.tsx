import { cn } from "@/lib/utils";
import type { DemoAgentFixture } from "@shared/demoTypes";
import { Bot } from "lucide-react";
import { DemoPanel } from "./DemoPanel";

const roleColor: Record<string, string> = {
  planner: "text-teal-200",
  researcher: "text-cyan-200",
  operator: "text-[#b8ffd8]",
  critic: "text-amber-200",
  support: "text-slate-200",
  coordinator: "text-[#3bff96]",
};

export function DemoAgentCard({
  agent,
  active,
}: {
  agent: DemoAgentFixture;
  active?: boolean;
}) {
  return (
    <DemoPanel
      glow={active}
      className={cn("space-y-2 p-3", active && "border-[#3bff96]/40")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot
            className={cn("h-4 w-4", roleColor[agent.role] ?? "text-slate-300")}
          />
          <span className="text-sm font-medium text-white">
            {agent.displayName}
          </span>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
          {agent.status}
        </span>
      </div>
      <p className="text-xs text-slate-500">{agent.taskAssigned}</p>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-black/30 p-2">
          <p className="text-slate-500">Input</p>
          <p className="mt-1 text-slate-300">{agent.inputSummary}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/30 p-2">
          <p className="text-slate-500">Output</p>
          <p className="mt-1 text-slate-200">{agent.outputSummary}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
        <span>Confidence {agent.confidence}</span>
        <span>Reputation {agent.reputation}</span>
      </div>
    </DemoPanel>
  );
}

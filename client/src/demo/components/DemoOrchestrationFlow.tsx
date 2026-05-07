import { cn } from "@/lib/utils";
import type { DemoAgentFixture } from "@shared/demoTypes";
import { ArrowDown, GitMerge } from "lucide-react";
import { DemoAgentCard } from "./DemoAgentCard";
import { DemoPanel } from "./DemoPanel";

export function DemoOrchestrationFlow({ agents }: { agents: DemoAgentFixture[] }) {
  const order: DemoAgentFixture["role"][] = ["planner", "researcher", "operator", "critic", "support", "coordinator"];
  const sorted = order.map(role => agents.find(a => a.role === role)).filter(Boolean) as DemoAgentFixture[];

  return (
    <DemoPanel className="space-y-4">
      <div className="flex items-center gap-2">
        <GitMerge className="h-5 w-5 text-[#38d7d0]" />
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Multi-agent orchestration</p>
          <h3 className="text-lg font-semibold text-white">Lanes · merge · coordinator verdict</h3>
        </div>
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-stretch">
        {sorted.map((agent, idx) => (
          <div key={agent.role} className="flex flex-col items-center gap-2 lg:flex-row">
            <div className={cn("w-full min-w-[200px] max-w-sm lg:w-[220px]", agent.role === "coordinator" && "ring-1 ring-[#3bff96]/30 rounded-2xl")}>
              <DemoAgentCard agent={agent} active={agent.role === "coordinator" || agent.status === "blocked"} />
            </div>
            {idx < sorted.length - 1 ? (
              <ArrowDown className="h-5 w-5 shrink-0 text-slate-600 lg:hidden" aria-hidden />
            ) : null}
            {idx < sorted.length - 1 ? (
              <span className="hidden px-1 text-slate-600 lg:inline" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </DemoPanel>
  );
}

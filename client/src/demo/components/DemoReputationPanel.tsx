import { cn } from "@/lib/utils";
import type { DemoSkillFixture } from "@shared/demoTypes";
import { Award, TrendingDown, TrendingUp } from "lucide-react";
import { DemoPanel } from "./DemoPanel";

export function DemoReputationPanel({
  skill,
  compare,
}: {
  skill: DemoSkillFixture;
  compare?: DemoSkillFixture | null;
}) {
  const delta =
    compare && compare.id !== skill.id
      ? skill.reputationScore - compare.reputationScore
      : skill.successRate >= 90
        ? 4
        : -3;

  return (
    <DemoPanel className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-[#38d7d0]" />
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            SWARM reputation
          </p>
          <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-xs text-slate-500">Usage (30d)</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {skill.usageCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-xs text-slate-500">Success rate</p>
          <p className="mt-1 text-xl font-semibold text-[#b8ffd8]">
            {skill.successRate}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-xs text-slate-500">Reputation score</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {skill.reputationScore}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
          delta >= 0
            ? "border-[#3bff96]/35 bg-[#3bff96]/10 text-[#c8ffe2]"
            : "border-amber-500/35 bg-amber-500/10 text-amber-100",
        )}
      >
        {delta >= 0 ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span>
          After this anchored turn, discovery rank moves{" "}
          {delta >= 0 ? "up" : "down"} by {Math.abs(delta)} pts vs cohort
          baseline — visible on the next wallet session.
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Trust badges and sort order in skill discovery are
        Solana-receipt-weighted in this demo narrative.
      </p>
    </DemoPanel>
  );
}

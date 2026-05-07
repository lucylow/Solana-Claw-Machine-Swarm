import { ProofVerificationBadge } from "@/components/command-center/CommandCenterComponents";
import { cn } from "@/lib/utils";
import type { DemoSkillFixture } from "@shared/demoTypes";
import { TrendingUp } from "lucide-react";

export function DemoSkillCard({
  skill,
  selected,
  onSelect,
  presentationMode,
}: {
  skill: DemoSkillFixture;
  selected: boolean;
  onSelect: () => void;
  presentationMode?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all duration-200",
        "border-white/10 bg-[#070b11]/90 hover:border-[#38d7d0]/35",
        selected && "border-[#3bff96]/50 shadow-[0_0_16px_rgba(59,255,150,0.12)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn("font-semibold text-white", presentationMode && "text-lg")}>{skill.name}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">{skill.description}</p>
        </div>
        <ProofVerificationBadge
          verification={{
            status: skill.status === "deprecated" ? "degraded" : "verified",
            label: skill.status === "deprecated" ? "Deprecated skill" : "Registry verified",
          }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {skill.tags.slice(0, 4).map(t => (
          <span key={t} className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-slate-300">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
        <span>v{skill.version}</span>
        <span className="flex items-center gap-1 text-[#b8ffd8]">
          <TrendingUp className="h-3 w-3" />
          {skill.reputationScore} rep
        </span>
        <span>{skill.successRate}% ok</span>
      </div>
    </button>
  );
}

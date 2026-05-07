import { cn } from "@/lib/utils";
import type { DemoScenarioFixture } from "@shared/demoTypes";
import { ChevronRight } from "lucide-react";

export function DemoScenarioCard({
  scenario,
  selected,
  onSelect,
  presentationMode,
}: {
  scenario: DemoScenarioFixture;
  selected: boolean;
  onSelect: () => void;
  presentationMode?: boolean;
}) {
  const accent =
    scenario.accent === "green"
      ? "border-[#3bff96]/40 bg-[#3bff96]/5"
      : scenario.accent === "teal"
        ? "border-[#38d7d0]/40 bg-[#38d7d0]/6"
        : "border-cyan-500/35 bg-cyan-500/5";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border p-4 text-left transition-all duration-200",
        "border-white/10 bg-[#070b11]/90 hover:border-white/20",
        selected && "ring-1 ring-[#3bff96]/50",
        selected && accent
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn("font-semibold text-white", presentationMode && "text-lg")}>{scenario.title}</p>
          <p className="mt-1 text-xs text-slate-400">{scenario.subtitle}</p>
        </div>
        <ChevronRight
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-[#3bff96]",
            selected && "text-[#3bff96]"
          )}
        />
      </div>
      <p className="mt-3 text-sm text-slate-300">{scenario.summary}</p>
    </button>
  );
}

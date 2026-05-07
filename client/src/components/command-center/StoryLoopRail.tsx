import { cn } from "@/lib/utils";
import type { STORY_LOOP_LABELS } from "@/lib/swarmApi";
import { Check } from "lucide-react";

type Step = (typeof STORY_LOOP_LABELS)[number];

export function StoryLoopRail({
  activeIndex,
  labels,
  className,
}: {
  activeIndex: number;
  labels: readonly Step[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-2xl border border-white/10 bg-[#060a10]/90 px-3 py-3",
        className
      )}
    >
      {labels.map((label, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <div key={label} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide transition",
                done && "border-[#3bff96]/35 bg-[#3bff96]/10 text-[#c8ffe2]",
                current && "border-[#38d7d0]/50 bg-[#38d7d0]/15 text-[#d4fffb] shadow-[0_0_12px_rgba(56,215,208,0.25)]",
                !done && !current && "border-white/10 bg-black/30 text-slate-500"
              )}
            >
              {done ? <Check className="h-3 w-3 text-[#3bff96]" /> : <span className="text-slate-600">{i + 1}</span>}
              <span>{label}</span>
            </div>
            {i < labels.length - 1 ? (
              <span className="hidden text-slate-600 sm:inline" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { StoryLoopLabel } from "@shared/copy";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

/**
 * The story spine that lives above every mission stage. Reads as a single
 * sentence the user must believe in:
 *   "Wallet → Skill → Run → Reflect → Memory → 0G → DA → Solana → Verify."
 *
 * Connected by gradient lines (not just spaces) to communicate sequencing.
 * Active step gets the live teal pulse; completed steps get the proof green.
 */
export function StoryLoopRail({
  activeIndex,
  labels,
  className,
}: {
  activeIndex: number;
  labels: readonly StoryLoopLabel[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#060a0f]/95 px-3 py-3.5",
        className,
      )}
      role="list"
      aria-label="Solana agent story loop"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#14f195]/40 to-transparent" />

      <div className="cc-scroll flex items-center gap-1 overflow-x-auto pb-1">
        {labels.map((label, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          const upcoming = !done && !current;
          return (
            <div
              key={label}
              className="flex shrink-0 items-center gap-1"
              role="listitem"
              aria-current={current ? "step" : undefined}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: current ? [1, 1.04, 1] : 1,
                }}
                transition={{
                  duration: 1.6,
                  repeat: current ? Infinity : 0,
                  ease: "easeInOut",
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide transition",
                  done && "border-[#14f195]/40 bg-[#14f195]/10 text-[#c8ffe8]",
                  current &&
                    "border-[#38d7d0]/55 bg-[#38d7d0]/15 text-[#d4fffb] shadow-[0_0_18px_rgba(56,215,208,0.32)]",
                  upcoming && "border-white/10 bg-black/30 text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full",
                    done && "bg-[#14f195]/20 text-[#14f195]",
                    current && "bg-[#38d7d0]/25 text-[#bdf6f0]",
                    upcoming && "bg-white/5 text-slate-600",
                  )}
                  aria-hidden
                >
                  {done ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : current ? (
                    <span className="block h-1.5 w-1.5 rounded-full bg-[#38d7d0] shadow-[0_0_8px_rgba(56,215,208,0.7)]" />
                  ) : (
                    <Lock className="h-2.5 w-2.5" />
                  )}
                </span>
                <span className="font-mono text-[9px] text-slate-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{label}</span>
              </motion.div>
              {i < labels.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "hidden h-px w-4 sm:block",
                    done &&
                      "bg-gradient-to-r from-[#14f195]/60 to-[#38d7d0]/40",
                    current && "bg-gradient-to-r from-[#38d7d0]/60 to-white/10",
                    upcoming && "bg-white/5",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

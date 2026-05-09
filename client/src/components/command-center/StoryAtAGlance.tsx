import { cn } from "@/lib/utils";
import type { UXTimelineItem } from "@shared/uxState";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

/**
 * Screen-reader-friendly checklist of the same phases as the bottom timeline,
 * without replacing the horizontal spine.
 */
export function StoryAtAGlance({ items }: { items: UXTimelineItem[] }) {
  if (!items.length) return null;
  return (
    <ol
      className="mt-2 max-h-[220px] space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]"
      aria-label="Execution story checkpoints"
    >
      {items.map((item) => {
        const Icon =
          item.status === "completed"
            ? CheckCircle2
            : item.status === "active"
              ? Loader2
              : item.status === "failed"
                ? XCircle
                : Circle;
        const iconClass =
          item.status === "completed"
            ? "text-[#14f195]"
            : item.status === "active"
              ? "animate-spin text-[#38d7d0]"
              : item.status === "failed"
                ? "text-rose-400"
                : "text-slate-600";
        return (
          <li
            key={item.id}
            className="flex gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-2 py-1.5"
          >
            <Icon
              className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", iconClass)}
              aria-hidden
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[11px] font-medium text-slate-200",
                  item.status === "active" && "text-[#bdf6f0]",
                )}
              >
                {item.label}
              </p>
              <p className="line-clamp-2 text-[10px] text-slate-500">
                {item.description}
              </p>
              <span className="sr-only">
                Status: {item.status}
                {item.proofStatus
                  ? `. Proof: ${item.proofStatus.replaceAll("_", " ")}`
                  : ""}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

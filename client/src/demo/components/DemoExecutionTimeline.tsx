import { cn } from "@/lib/utils";
import type { DemoExecutionStepFixture } from "@shared/demoTypes";
import { Check, Circle, Loader2, X } from "lucide-react";
import { DemoPanel } from "./DemoPanel";

export function DemoExecutionTimeline({
  steps,
  presentationMode,
  glow,
}: {
  steps: DemoExecutionStepFixture[];
  presentationMode?: boolean;
  glow?: boolean;
}) {
  return (
    <DemoPanel glow={glow} presentationMode={presentationMode} className="space-y-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Execution rail</p>
      <div className="space-y-0">
        {steps.map((s, idx) => {
          const icon =
            s.status === "done" ? (
              <Check className="h-4 w-4 text-[#3bff96]" />
            ) : s.status === "failed" ? (
              <X className="h-4 w-4 text-red-400" />
            ) : s.status === "active" ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#38d7d0]" />
            ) : (
              <Circle className="h-4 w-4 text-slate-600" />
            );
          return (
            <div key={s.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border",
                    s.status === "done" && "border-[#3bff96]/50 bg-[#3bff96]/10",
                    s.status === "failed" && "border-red-500/50 bg-red-500/10",
                    s.status === "active" && "border-[#38d7d0]/50 bg-[#38d7d0]/10 shadow-[0_0_12px_rgba(56,215,208,0.2)]",
                    s.status === "pending" && "border-slate-700 bg-slate-900/80"
                  )}
                >
                  {icon}
                </div>
                {idx < steps.length - 1 ? <div className="my-1 w-px flex-1 bg-gradient-to-b from-white/20 to-transparent min-h-[20px]" /> : null}
              </div>
              <div className="flex-1 pb-6">
                <p className="text-sm font-medium text-white">
                  Step {s.order}: {s.title}
                </p>
                <p className="mt-1 text-xs text-slate-400">{s.detail}</p>
                <p className="mt-1 text-[11px] text-slate-600">{s.durationMs}ms wall · {s.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DemoPanel>
  );
}

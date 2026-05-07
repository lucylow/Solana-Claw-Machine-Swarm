import { cn } from "@/lib/utils";
import type { DemoMemoryTimelineStage } from "@shared/demoTypes";
import { DemoPanel } from "./DemoPanel";

export function DemoMemoryTimeline({ stages }: { stages: DemoMemoryTimelineStage[] }) {
  return (
    <DemoPanel className="space-y-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Memory lifecycle</p>
      <h3 className="text-lg font-semibold text-white">From capture to verified reuse</h3>
      <div className="relative space-y-0 pl-2">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-[#3bff96]/40 via-cyan-500/20 to-transparent" />
        {stages.map((st, i) => (
          <div key={st.id} className="relative flex gap-4 pb-8 last:pb-0">
            <div
              className={cn(
                "z-[1] mt-1 h-3 w-3 shrink-0 rounded-full border-2",
                st.status === "complete" && "border-[#3bff96] bg-[#3bff96]/30 shadow-[0_0_10px_rgba(59,255,150,0.35)]",
                st.status === "active" && "border-[#38d7d0] bg-[#38d7d0]/40 animate-pulse",
                st.status === "pending" && "border-slate-600 bg-slate-900"
              )}
            />
            <div className="flex-1 rounded-xl border border-white/10 bg-black/35 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium capitalize text-white">{st.stage}</p>
                <span className="text-[10px] uppercase tracking-wide text-slate-500">{st.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-200">{st.title}</p>
              <p className="mt-1 text-xs text-slate-500">{st.description}</p>
              <p className="mt-2 text-[11px] text-slate-600">{new Date(st.timestampIso).toLocaleString()}</p>
              {st.proofOrStorageRef ? (
                <p className="mt-1 break-all font-mono text-[10px] text-[#8ceada]">{st.proofOrStorageRef}</p>
              ) : null}
            </div>
            {i < stages.length - 1 ? (
              <span className="sr-only">then</span>
            ) : null}
          </div>
        ))}
      </div>
    </DemoPanel>
  );
}

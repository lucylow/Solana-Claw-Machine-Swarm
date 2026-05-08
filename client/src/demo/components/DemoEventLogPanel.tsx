import { cn } from "@/lib/utils";
import { ExplorerLinkButton } from "@/components/command-center/CommandCenterComponents";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";

const statusTone: Record<string, string> = {
  info: "text-slate-300",
  success: "text-[#7dffb3]",
  warning: "text-amber-200",
  error: "text-rose-300",
  live: "text-cyan-200",
};

export function DemoEventLogPanel({ presentationMode }: { presentationMode?: boolean }) {
  const { demoSnapshot } = useDemo();
  const log = demoSnapshot.eventLog;

  return (
    <DemoPanel presentationMode={presentationMode} className="max-h-[420px] space-y-3 overflow-y-auto">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87f7d0]">Story event stream</p>
        <p className="mt-1 text-xs text-slate-500">
          Deterministic log · {log.length} events · posture {demoSnapshot.derived.dataPosture.replace(/_/g, " ")}
        </p>
      </div>
      <ul className="space-y-2">
        {log
          .slice()
          .reverse()
          .map(ev => (
            <li
              key={ev.id}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] leading-relaxed"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn("font-medium", statusTone[ev.status] ?? "text-slate-200")}>{ev.label}</span>
                <span className="font-mono text-[10px] text-slate-600">{ev.timestamp}</span>
              </div>
              <p className="mt-1 text-slate-400">{ev.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-600">{ev.stage.replace(/_/g, " ")}</p>
              {ev.linkUrl ? (
                <div className="mt-2">
                  <ExplorerLinkButton payload={{ label: "Open link", url: ev.linkUrl }} />
                </div>
              ) : null}
              {ev.notes ? <p className="mt-1 text-[10px] text-slate-600">{ev.notes}</p> : null}
            </li>
          ))}
      </ul>
    </DemoPanel>
  );
}

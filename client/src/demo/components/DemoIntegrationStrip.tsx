import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";

export function DemoIntegrationStrip({ presentationMode }: { presentationMode?: boolean }) {
  const { demoSnapshot } = useDemo();
  const z = demoSnapshot.zerog;
  const o = demoSnapshot.openclaw;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <DemoPanel presentationMode={presentationMode} className="space-y-2 border-cyan-500/20">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">0G storage / DA (demo)</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/15 text-[10px] text-slate-300">
            Storage · {z?.storage.available ? "available" : "unavailable"} · {z?.mode ?? "—"}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-[10px] text-slate-300">
            DA · {z?.da.available ? "available" : "unavailable"}
          </Badge>
        </div>
        <p className={cn("text-[11px] text-slate-400", presentationMode && "text-sm")}>
          Last upload · {z?.storage.lastUploadAt ?? "—"}
        </p>
        <p className="font-mono text-[10px] text-slate-500">Batch root · {z?.da.lastRootHash ?? "not committed on this beat"}</p>
      </DemoPanel>
      <DemoPanel presentationMode={presentationMode} className="space-y-2 border-violet-500/20">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/90">OpenClaw bridge (demo)</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/15 text-[10px] text-slate-300">
            Mode · {o?.mode ?? "idle"}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-[10px] text-slate-300">
            Connected · {o?.connected ? "yes" : "no"}
          </Badge>
        </div>
        <p className="text-[11px] text-slate-400">
          Imported {o?.importedCount ?? 0} · Exported {o?.exportedCount ?? 0}
        </p>
        <p className="font-mono text-[10px] text-slate-500">Last sync · {o?.lastSyncAt ?? "—"}</p>
      </DemoPanel>
    </div>
  );
}

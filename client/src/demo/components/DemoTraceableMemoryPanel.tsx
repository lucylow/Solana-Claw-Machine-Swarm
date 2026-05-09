import { DemoPanel } from "./DemoPanel";
import type { TraceableMemoryRecord } from "@shared/executionStory";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UnifiedStoryBeat } from "@shared/executionStory";

export function DemoTraceableMemoryPanel({
  memory,
  presentationMode,
  glow,
  beatHighlight,
}: {
  memory: TraceableMemoryRecord;
  presentationMode?: boolean;
  glow?: boolean;
  beatHighlight?: UnifiedStoryBeat["highlight"];
}) {
  const match = beatHighlight === "memory";

  return (
    <DemoPanel
      glow={match || glow}
      presentationMode={presentationMode}
      className="space-y-4 border-teal-500/25 bg-[#051016]/95"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-[#14f195]/35 bg-black/60 text-[#c8ffe8]">
          Traceable memory
        </Badge>
        <Badge
          variant="outline"
          className="border-white/15 text-[10px] uppercase tracking-wide text-slate-400"
        >
          proof · {memory.proofStatus.replace(/_/g, " ")}
        </Badge>
        <Badge
          variant="outline"
          className="border-white/15 text-[10px] text-slate-300"
        >
          visibility · {memory.visibility}
        </Badge>
      </div>
      <p className="font-mono text-xs text-teal-200/85">{memory.id}</p>
      <p className={cn("text-sm text-white", presentationMode && "text-base")}>
        {memory.summary}
      </p>
      <dl className="grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-slate-500">Source turn</dt>
          <dd className="mt-1 font-mono">{memory.sourceTurnId}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-slate-500">Source execution</dt>
          <dd className="mt-1 font-mono">{memory.sourceExecutionId}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-slate-500">Reflection id</dt>
          <dd className="mt-1 font-mono">
            {memory.sourceReflectionId ?? "unknown / not linked"}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-slate-500">Skill</dt>
          <dd className="mt-1 font-mono">{memory.sourceSkillId}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 sm:col-span-2">
          <dt className="text-slate-500">Storage reference</dt>
          <dd className="mt-1 break-all font-mono text-[11px] text-[#bfffea]">
            {memory.storageRef ?? "unknown"}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 sm:col-span-2">
          <dt className="text-slate-500">Proof receipt id · explorer hint</dt>
          <dd className="mt-1 break-all font-mono text-[11px] text-slate-400">
            {memory.proofReceiptId ?? "unknown"} ·{" "}
            {memory.explorerUrlHint ?? "no explorer linkage"}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-slate-500">Next turn id</dt>
          <dd className="mt-1 font-mono">
            {memory.linkedNextTurnId ?? "unknown"}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-slate-500">Retrieved · last</dt>
          <dd className="mt-1">
            {(memory.retrievedCount ?? 0).toLocaleString()} ·{" "}
            {memory.lastRetrievedAt
              ? new Date(memory.lastRetrievedAt).toLocaleString()
              : "never"}
          </dd>
        </div>
      </dl>
      <p className="text-[10px] text-slate-500">
        Judges should click receipt explorer links for ground truth · demo
        signatures are reproducible mocks, not mined txs.
      </p>
    </DemoPanel>
  );
}

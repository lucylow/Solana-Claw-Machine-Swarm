import { formatHash, formatRef } from "@/lib/zerog/format";
import type { ZeroGComputeJob } from "@/lib/zerog/types";

export function ZeroGComputeCard({ job }: { job: ZeroGComputeJob }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-white">
          {job.taskType.replaceAll("_", " ")}
        </h4>
        <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">
          {job.status}
        </span>
      </div>
      <div className="mt-2 grid gap-1 text-[11px] text-slate-300">
        <span>compute ref: {formatRef(job.computeRef)}</span>
        <span>input ref: {formatRef(job.inputRef)}</span>
        <span>output hash: {formatHash(job.outputHash, 7)}</span>
        <span>model: {job.model || "demo-default"}</span>
      </div>
    </article>
  );
}

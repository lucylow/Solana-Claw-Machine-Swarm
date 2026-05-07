import { formatHash, formatRef } from "@/lib/zerog/format";
import type { ZeroGStorageArtifact } from "@/lib/zerog/types";

export function ZeroGArtifactCard({ artifact }: { artifact: ZeroGStorageArtifact }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-white">{artifact.title}</h4>
        <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">{artifact.status}</span>
      </div>
      <p className="mt-1 text-slate-400">{artifact.summary}</p>
      <div className="mt-2 grid gap-1 text-[11px] text-slate-300">
        <span>kind: {artifact.kind}</span>
        <span>storage: {formatRef(artifact.storageRef)}</span>
        <span>hash: {formatHash(artifact.contentHash, 7)}</span>
        <span>size: {artifact.sizeBytes} bytes</span>
      </div>
    </article>
  );
}

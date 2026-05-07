import { cn } from "@/lib/utils";
import type { ZeroGHealthResponse } from "@/lib/zerog/types";

export function ZeroGHealthBanner({ health }: { health: ZeroGHealthResponse | null }) {
  if (!health) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-400">
        0G status unavailable. Solana proof layer still active.
      </div>
    );
  }

  const tone =
    health.mode === "live"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
      : health.mode === "demo"
        ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
        : "border-amber-300/40 bg-amber-300/10 text-amber-100";

  return (
    <div className={cn("rounded-xl border px-3 py-3 text-xs", tone)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{health.statusLabel}</span>
        <span>{health.config.environment}</span>
      </div>
      <div className="mt-2 grid gap-1 text-[11px] md:grid-cols-4">
        <span>
          storage: {health.storage.ok ? "healthy" : "degraded"}
          {health.storage.remoteReachable === false ? " · remote unreachable" : ""}
        </span>
        <span>
          compute: {health.compute.ok ? "healthy" : "degraded"}
          {health.compute.remoteReachable === false ? " · remote unreachable" : ""}
        </span>
        <span>
          da: {health.da.ok ? "healthy" : "degraded"}
          {health.da.remoteReachable === false ? " · remote unreachable" : ""}
        </span>
        <span>bridge: {health.bridge.ok ? "healthy" : "degraded"}</span>
      </div>
      {health.remoteProbesSkipped ? (
        <p className="mt-2 text-[10px] text-slate-400">
          Remote HTTP probes skipped (demo/disabled). Adapter health reflects orchestration readiness, not live 0G service guarantees.
        </p>
      ) : null}
    </div>
  );
}

import { getClientZeroGConfig } from "@/lib/zerog/config";
import type { ZeroGBridgeState, ZeroGHealthResponse } from "@/lib/zerog/types";
import { bridgeStatusLabel } from "@/lib/zerog/bridge";

export function ZeroGStatusPanel({
  health,
  bridge,
  onRunDemo,
}: {
  health: ZeroGHealthResponse | null;
  bridge: ZeroGBridgeState | null;
  onRunDemo: () => void;
}) {
  const config = getClientZeroGConfig();

  return (
    <section className="rounded-2xl border border-white/10 bg-[#070d12]/95 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">
          0G Modular Sidecar Control
        </h3>
        <button
          type="button"
          className="rounded-md border border-[#3bff96]/40 bg-[#3bff96]/10 px-3 py-1 text-xs text-[#cdffe6] hover:bg-[#3bff96]/20"
          onClick={onRunDemo}
        >
          Run sidecar demo flow
        </button>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-slate-400">mode</p>
          <p>{health?.mode || config.mode}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-slate-400">environment</p>
          <p>{health?.config.environment || config.environment}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-slate-400">bridge</p>
          <p>{bridge ? bridgeStatusLabel(bridge) : "Bridge unavailable"}</p>
        </div>
      </div>
    </section>
  );
}

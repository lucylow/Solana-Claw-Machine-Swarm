import { bridgeStatusLabel } from "@/lib/zerog/bridge";
import { formatHash } from "@/lib/zerog/format";
import type { ZeroGBridgeState } from "@/lib/zerog/types";

export function ZeroGBridgeCard({
  bridge,
  tokenDisclaimer,
}: {
  bridge: ZeroGBridgeState | null;
  /** Shown under flow; use official-config disclaimer, not exchange copy. */
  tokenDisclaimer?: string;
}) {
  if (!bridge) {
    return (
      <article className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-slate-300">
        Bridge unavailable. Solana proof anchoring remains active.
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-white">Bridge Flow</h4>
        <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">{bridgeStatusLabel(bridge)}</span>
      </div>
      <div className="mt-2 grid gap-1 text-[11px] text-slate-300">
        <span>
          path: {bridge.sourceChain} -&gt; {bridge.destinationChain}
        </span>
        <span>token: {bridge.tokenSymbol}</span>
        <span>tx: {formatHash(bridge.txHash, 8)}</span>
        <span>mode: {bridge.mode || "unavailable"}</span>
        {bridge.notes ? <span className="text-slate-400">{bridge.notes}</span> : null}
      </div>
      {tokenDisclaimer ? <p className="mt-2 border-t border-white/10 pt-2 text-[10px] text-slate-500">{tokenDisclaimer}</p> : null}
    </article>
  );
}

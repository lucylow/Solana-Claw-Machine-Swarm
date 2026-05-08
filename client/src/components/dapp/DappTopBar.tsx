import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { DappNetworkBadge } from "./DappNetworkBadge";
import { DappTransactionStatus } from "./DappTransactionStatus";
import { DappWalletSummary } from "./DappWalletSummary";
import type { DappChainState } from "./types";
import { useDappChainState } from "./useDappChainState";

function RpcHealthPill({ state }: { state: DappChainState }) {
  if (state.rpcReachable == null) {
    return (
      <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">
        RPC …
      </span>
    );
  }
  if (state.rpcReachable === false) {
    return (
      <span
        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100"
        title={state.rpcError ?? "Cluster RPC unreachable"}
      >
        RPC down
      </span>
    );
  }
  return (
    <span
      className="rounded-full border border-[#14f195]/35 bg-[#14f195]/10 px-2 py-0.5 text-[10px] text-[#c9ffe7]"
      title={
        state.rpcSlot != null
          ? `slot ${state.rpcSlot}${state.rpcLatencyMs != null ? ` · ${state.rpcLatencyMs}ms` : ""}`
          : "Cluster RPC healthy"
      }
    >
      RPC ok
    </span>
  );
}

/**
 * Solana dApp top app bar.
 *
 * Always shows:
 *  - brand
 *  - cluster badge
 *  - transaction lifecycle pill
 *  - wallet identity (or Connect CTA when disconnected)
 *
 * The right slot is for primary navigation; the inline `nav` slot is for
 * small chips like balance summaries.
 */
export function DappTopBar({
  brand = "CLAW MACHINE · SWARM",
  brandHref = "/",
  nav,
  rightSlot,
  className,
}: {
  brand?: ReactNode;
  brandHref?: string;
  /** Slot for nav links / chips between brand and wallet. */
  nav?: ReactNode;
  /** Slot rendered just before the wallet summary (CTAs etc). */
  rightSlot?: ReactNode;
  className?: string;
}) {
  const state = useDappChainState();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-white/[0.06] bg-[#040508]/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#040508]/60",
        className
      )}
    >
      <a
        href="#main-content"
        className="absolute left-3 top-2 -translate-y-16 rounded-md bg-[#14f195] px-3 py-1.5 text-xs font-semibold text-black shadow transition focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link
          href={brandHref}
          className="group flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14f195]/55"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#14f195]/35 bg-[#14f195]/10 shadow-[inset_0_0_8px_rgba(20,241,149,0.18)]">
            <Sparkles className="h-3.5 w-3.5 text-[#14f195]" aria-hidden />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7dccb8]">
              Solana dApp
            </span>
            <span className="text-xs font-semibold tracking-wide text-white">
              {brand}
            </span>
          </span>
        </Link>

        <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />

        <div className="hidden items-center gap-2 sm:flex">
          <DappNetworkBadge cluster={state.cluster} wrong={state.wrongCluster} size="sm" />
          <RpcHealthPill state={state} />
          {state.txStatus !== "idle" ? (
            <DappTransactionStatus status={state.txStatus} size="sm" />
          ) : null}
        </div>

        <div className="ml-2 mr-1 hidden min-w-0 flex-1 items-center gap-2 lg:flex">
          {nav}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {rightSlot}
          <DappWalletSummary />
        </div>
      </div>

      {/* Compact secondary row visible on small screens — keeps cluster + tx visible. */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-white/[0.04] bg-black/30 px-4 py-1.5 sm:hidden">
        <DappNetworkBadge cluster={state.cluster} wrong={state.wrongCluster} size="sm" />
        <RpcHealthPill state={state} />
        <DappTransactionStatus status={state.txStatus} size="sm" />
        {state.balanceSol ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-300">
            {Number(state.balanceSol).toFixed(3)} SOL
          </span>
        ) : null}
      </div>
    </header>
  );
}

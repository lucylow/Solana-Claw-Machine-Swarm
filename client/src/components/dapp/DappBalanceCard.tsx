import { Coins, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";
import { DappCopyButton } from "./DappCopyButton";
import { DappExplorerLink } from "./DappExplorerLink";
import { DappNetworkBadge } from "./DappNetworkBadge";
import { useDappChainState } from "./useDappChainState";

function formatBalance(balanceSol?: string) {
  if (!balanceSol) return "—";
  const n = Number(balanceSol);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(4)} SOL`;
}

/**
 * Compact card showing balance, cluster, and a refresh affordance.
 * Sits in the side rail or top of action surfaces.
 */
export function DappBalanceCard({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const wallet = useSolanaWalletContext();
  const state = useDappChainState();

  const balance = formatBalance(state.balanceSol);
  const lamports = state.balanceLamports
    ? `${Number(state.balanceLamports).toLocaleString()} lamports`
    : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a120e]/95 to-[#06090c]/95 shadow-[0_12px_36px_rgba(0,0,0,0.45)]",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#14f195]/35 bg-[#14f195]/10">
            <Coins className="h-4 w-4 text-[#9cf6d8]" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7dccb8]">
              Wallet balance
            </p>
            <p className="text-base font-semibold tracking-tight text-white">
              {state.connected ? balance : "Connect wallet"}
            </p>
          </div>
        </div>
        <DappNetworkBadge cluster={state.cluster} wrong={state.wrongCluster} size="sm" />
      </div>

      {state.connected ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          {lamports ? <span className="font-mono">{lamports}</span> : null}
          {state.walletAddress ? (
            <DappCopyButton
              value={state.walletAddress}
              label={`${state.walletAddress.slice(0, 4)}…${state.walletAddress.slice(-4)}`}
            />
          ) : null}
          <DappExplorerLink
            kind="address"
            value={state.walletAddress}
            cluster={state.cluster}
            label="Wallet on Explorer"
            variant="inline"
          />
          <button
            type="button"
            onClick={() => wallet.refreshBalance().catch(() => undefined)}
            className="ml-auto inline-flex items-center gap-1 rounded text-[10px] uppercase tracking-wide text-slate-500 transition hover:text-[#9cf6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14f195]/60"
            aria-label="Refresh balance"
          >
            <RefreshCw
              className={cn(
                "h-3 w-3",
                state.busy && "animate-spin text-[#9cf6d8]"
              )}
              aria-hidden
            />
            Refresh
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500">
          Connect a Solana wallet to read balance + lamport detail.
        </p>
      )}
    </div>
  );
}

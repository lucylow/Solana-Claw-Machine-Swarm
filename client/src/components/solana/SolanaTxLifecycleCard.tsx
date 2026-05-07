import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SOLANA_COPY } from "@shared/copy";
import type { WalletConnectionStatus } from "@shared/solana/types";

const VARIANTS: Partial<
  Record<WalletConnectionStatus, { variant: string }>
> = {
  disconnected: { variant: "border-white/15 bg-white/5 text-slate-300" },
  connecting: { variant: "border-cyan-400/40 bg-cyan-500/15 text-cyan-50" },
  connected: { variant: "border-sky-400/35 bg-sky-500/10 text-sky-50" },
  signing: { variant: "border-violet-400/40 bg-violet-500/15 text-violet-50" },
  session_verifying: { variant: "border-amber-400/35 bg-amber-500/15 text-amber-50" },
  session_verified: { variant: "border-[#3bff96]/45 bg-[#3bff96]/12 text-[#d8ffe9]" },
  wrong_cluster: { variant: "border-amber-400/50 bg-amber-500/15 text-amber-50" },
  balance_loading: { variant: "border-white/15 bg-white/5 text-slate-200" },
  ready: { variant: "border-[#3bff96]/55 bg-[#3bff96]/14 text-[#eafff4]" },
  error: { variant: "border-red-400/45 bg-red-500/15 text-red-50" },
};

const LABEL_TEXT: Partial<Record<WalletConnectionStatus, string>> = {
  disconnected: SOLANA_COPY.walletLifecycle.disconnected,
  connecting: SOLANA_COPY.walletLifecycle.connecting,
  connected: SOLANA_COPY.walletLifecycle.connected,
  signing: SOLANA_COPY.walletLifecycle.signing,
  session_verifying: SOLANA_COPY.walletLifecycle.sessionVerifying,
  session_verified: SOLANA_COPY.walletLifecycle.sessionVerified,
  wrong_cluster: SOLANA_COPY.walletLifecycle.wrongCluster,
  balance_loading: SOLANA_COPY.walletLifecycle.balanceLoading,
  ready: SOLANA_COPY.walletLifecycle.ready,
  error: SOLANA_COPY.walletLifecycle.error,
};

export function SolanaTxLifecycleCard({ status }: { status: WalletConnectionStatus }) {
  const variant = VARIANTS[status]?.variant ?? "border-white/15 bg-white/5 text-slate-200";
  const label = LABEL_TEXT[status] ?? status.replaceAll("_", " ");
  return (
    <div className={cn("rounded-xl border border-white/10 bg-black/35 p-4")}>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{SOLANA_COPY.wallet.lifecycleTitle}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className={cn("text-[11px] font-semibold", variant)}>{label}</Badge>
      </div>
    </div>
  );
}

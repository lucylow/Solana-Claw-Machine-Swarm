import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WalletConnectionStatus } from "@shared/solana/types";

const LABELS: Partial<Record<WalletConnectionStatus, { label: string; variant: string }>> = {
  disconnected: { label: "Disconnected", variant: "border-white/15 bg-white/5 text-slate-300" },
  connecting: { label: "Connecting wallet", variant: "border-cyan-400/40 bg-cyan-500/15 text-cyan-50" },
  connected: { label: "Connected", variant: "border-sky-400/35 bg-sky-500/10 text-sky-50" },
  signing: { label: "Signing session", variant: "border-violet-400/40 bg-violet-500/15 text-violet-50" },
  session_verifying: { label: "Verifying session", variant: "border-amber-400/35 bg-amber-500/15 text-amber-50" },
  session_verified: { label: "Session verified", variant: "border-[#3bff96]/45 bg-[#3bff96]/12 text-[#d8ffe9]" },
  wrong_cluster: { label: "Wrong cluster", variant: "border-amber-400/50 bg-amber-500/15 text-amber-50" },
  balance_loading: { label: "Balance loading", variant: "border-white/15 bg-white/5 text-slate-200" },
  ready: { label: "Ready", variant: "border-[#3bff96]/55 bg-[#3bff96]/14 text-[#eafff4]" },
  error: { label: "Error", variant: "border-red-400/45 bg-red-500/15 text-red-50" },
};

export function SolanaTxLifecycleCard({ status }: { status: WalletConnectionStatus }) {
  const cfg = LABELS[status] ?? { label: status, variant: "border-white/15 bg-white/5 text-slate-200" };
  return (
    <div className={cn("rounded-xl border border-white/10 bg-black/35 p-4")}>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Wallet lifecycle</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className={cn("text-[11px] font-semibold", cfg.variant)}>{cfg.label}</Badge>
      </div>
    </div>
  );
}

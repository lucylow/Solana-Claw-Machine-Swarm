import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  TimerReset,
  XCircle,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { DAPP_TX_STATUS_HINT, DAPP_TX_STATUS_LABEL } from "./types";
import type { TransactionStatus } from "./types";

const ICON: Record<TransactionStatus, ComponentType<{ className?: string }>> = {
  idle: Sparkles,
  preparing: RefreshCw,
  signing: PenLine,
  submitted: Send,
  confirming: Loader2,
  confirmed: CheckCircle2,
  failed: XCircle,
  expired: TimerReset,
  degraded: AlertTriangle,
};

const TONE: Record<TransactionStatus, string> = {
  idle: "border-white/10 bg-white/[0.04] text-slate-300",
  preparing: "border-cyan-400/40 bg-cyan-500/10 text-cyan-100",
  signing: "border-violet-400/40 bg-violet-500/10 text-violet-100",
  submitted: "border-sky-400/40 bg-sky-500/10 text-sky-100",
  confirming: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  confirmed: "border-[#14f195]/45 bg-[#14f195]/10 text-[#d6ffe9]",
  failed: "border-rose-400/40 bg-rose-500/10 text-rose-100",
  expired: "border-orange-400/40 bg-orange-500/10 text-orange-100",
  degraded: "border-yellow-400/40 bg-yellow-500/10 text-yellow-100",
};

const PULSE: Partial<Record<TransactionStatus, boolean>> = {
  preparing: true,
  signing: true,
  submitted: true,
  confirming: true,
};

const SPIN: Partial<Record<TransactionStatus, boolean>> = {
  preparing: true,
  confirming: true,
};

/**
 * Compact, colour-coded transaction lifecycle pill.
 * Clear states: idle, preparing, signing, submitted, confirming,
 * confirmed, failed, expired, degraded.
 */
export function DappTransactionStatus({
  status,
  size = "md",
  showHint = false,
  pulse,
  className,
}: {
  status: TransactionStatus;
  size?: "sm" | "md";
  showHint?: boolean;
  /** Override pulse defaults. */
  pulse?: boolean;
  className?: string;
}) {
  const Icon = ICON[status];
  const label = DAPP_TX_STATUS_LABEL[status];
  const pulsing = pulse ?? PULSE[status] ?? false;
  const spinning = SPIN[status] ?? false;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-full border font-semibold",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
          TONE[status],
        )}
        title={DAPP_TX_STATUS_HINT[status]}
      >
        <Icon
          className={cn("h-3 w-3", spinning && "animate-spin")}
          aria-hidden
        />
        <span className="uppercase tracking-wide">{label}</span>
        {pulsing ? (
          <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-current opacity-30 motion-safe:animate-ping" />
        ) : null}
      </span>
      {showHint ? (
        <span className="text-[11px] text-slate-500">
          {DAPP_TX_STATUS_HINT[status]}
        </span>
      ) : null}
    </div>
  );
}

const LIFECYCLE_ORDER: TransactionStatus[] = [
  "preparing",
  "signing",
  "submitted",
  "confirming",
  "confirmed",
];

/**
 * Lifecycle ribbon: shows current step within preparing → confirmed.
 * Failed/expired/degraded states render their own collapsed marker.
 */
export function DappTransactionLifecycle({
  status,
  signature,
  className,
}: {
  status: TransactionStatus;
  signature?: string | null;
  className?: string;
}) {
  const idx = LIFECYCLE_ORDER.indexOf(status);
  const terminal =
    status === "failed" || status === "expired" || status === "degraded";

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-black/30 p-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Transaction lifecycle
        </p>
        <DappTransactionStatus status={status} size="sm" />
      </div>

      {terminal ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-rose-200">
          <Clock3 className="h-3 w-3" aria-hidden />
          {DAPP_TX_STATUS_HINT[status]}
        </p>
      ) : (
        <ol className="mt-3 grid grid-cols-5 gap-1.5">
          {LIFECYCLE_ORDER.map((step, stepIdx) => {
            const reached = idx >= stepIdx;
            const active = idx === stepIdx;
            return (
              <li
                key={step}
                className={cn(
                  "flex flex-col items-center gap-1 text-center text-[9px] uppercase tracking-wide",
                  reached ? "text-[#9cf6d8]" : "text-slate-600",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-full rounded-full",
                    active
                      ? "bg-[#14f195] shadow-[0_0_10px_rgba(20,241,149,0.55)]"
                      : reached
                        ? "bg-[#14f195]/55"
                        : "bg-white/10",
                  )}
                />
                {DAPP_TX_STATUS_LABEL[step]}
              </li>
            );
          })}
        </ol>
      )}
      {signature ? (
        <p className="mt-2 truncate font-mono text-[10px] text-slate-500">
          sig {signature.slice(0, 14)}…{signature.slice(-6)}
        </p>
      ) : null}
    </div>
  );
}

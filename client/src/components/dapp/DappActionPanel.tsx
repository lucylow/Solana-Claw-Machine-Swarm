import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";
import { DappOnchainTag, type DappScope } from "./DappOnchainTag";
import {
  DappTransactionLifecycle,
  DappTransactionStatus,
} from "./DappTransactionStatus";
import { useDappChainState } from "./useDappChainState";
import type { TransactionStatus } from "./types";

/**
 * "Transaction workspace" — the primary action surface of any dApp page.
 *
 * Composes:
 *  - eyebrow + title + body
 *  - explicit dApp scope tag (onchain / offchain / demo)
 *  - transaction lifecycle ribbon driven by `txStatus`
 *  - primary CTA that adapts to wallet state (Connect → Sign → Run → Re-run)
 *
 * Set `requiresWallet` to true (default) so disconnected users see a wallet CTA
 * that owns the action; this is what makes the surface feel dApp-like instead
 * of a generic content card.
 */
export function DappActionPanel({
  eyebrow,
  title,
  description,
  scope = "onchain",
  Icon,
  children,
  primaryAction,
  secondaryAction,
  txStatus,
  txSignature,
  requiresWallet = true,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  scope?: DappScope;
  Icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    busy?: boolean;
    disabled?: boolean;
    /** Override the disabled-due-to-wallet hint. */
    walletHint?: string;
  };
  secondaryAction?: ReactNode;
  txStatus?: TransactionStatus;
  txSignature?: string;
  requiresWallet?: boolean;
  className?: string;
}) {
  const wallet = useSolanaWalletContext();
  const state = useDappChainState();

  const status = txStatus ?? state.txStatus;
  const sig = txSignature ?? state.txSignature;

  const walletGated = requiresWallet && !state.connected;
  const sessionGated =
    requiresWallet && state.connected && state.sessionStatus !== "verified";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[#14f195]/15 bg-gradient-to-br from-[#0a120e]/95 via-[#070b0e]/95 to-[#04080b]/95 p-5 shadow-[0_28px_60px_rgba(0,0,0,0.55)] sm:p-6",
        className,
      )}
      aria-label={title}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-[#14f195]/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {Icon ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#14f195]/40 bg-[#14f195]/10 text-[#9cf6d8] shadow-[inset_0_0_18px_rgba(20,241,149,0.18)]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7dccb8]">
                  {eyebrow}
                </p>
              ) : null}
              <DappOnchainTag scope={scope} size="sm" />
            </div>
            <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {title}
            </h3>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <DappTransactionStatus status={status} className="shrink-0" />
      </div>

      {children ? <div className="relative mt-5">{children}</div> : null}

      <div className="relative mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <DappTransactionLifecycle status={status} signature={sig} />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {secondaryAction}
          {walletGated ? (
            <Button
              size="sm"
              className="rounded-full bg-[#14f195] font-semibold text-black shadow-[0_0_22px_rgba(20,241,149,0.4)] hover:bg-[#3bff96]"
              onClick={() => wallet.connectAndVerify().catch(() => undefined)}
            >
              <Wallet className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Connect Phantom to continue
            </Button>
          ) : sessionGated ? (
            <Button
              size="sm"
              className="rounded-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
              onClick={() => wallet.connectAndVerify().catch(() => undefined)}
            >
              {state.busy ? (
                <Loader2
                  className="mr-1.5 h-3.5 w-3.5 animate-spin"
                  aria-hidden
                />
              ) : null}
              Sign Phantom session
            </Button>
          ) : primaryAction ? (
            <Button
              size="sm"
              className="rounded-full bg-[#14f195] font-semibold text-black shadow-[0_0_18px_rgba(20,241,149,0.35)] hover:bg-[#3bff96]"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || primaryAction.busy}
            >
              {primaryAction.busy ? (
                <Loader2
                  className="mr-1.5 h-3.5 w-3.5 animate-spin"
                  aria-hidden
                />
              ) : (
                <ArrowRight className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              )}
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>

      {primaryAction?.walletHint && walletGated ? (
        <p className="relative mt-3 text-[11px] text-slate-500">
          {primaryAction.walletHint}
        </p>
      ) : null}
    </section>
  );
}

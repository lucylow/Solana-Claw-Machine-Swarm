import {
  CheckCircle2,
  Circle,
  Clock3,
  Hash,
  Loader2,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Wallet,
  Workflow,
  XCircle,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { addressExplorerUrl, txExplorerUrl } from "@/lib/solana/explorer";
import { shortenAddress } from "@/lib/solana/format";
import type { SolanaCluster, SolanaTxRecord } from "@shared/solana/types";
import { DappCopyButton } from "./DappCopyButton";
import { DappOnchainTag } from "./DappOnchainTag";

export type DappActivityKind =
  | "wallet_connect"
  | "session_verify"
  | "skill_selected"
  | "action_prepared"
  | "tx_signed"
  | "tx_submitted"
  | "tx_confirmed"
  | "receipt_anchored"
  | "proof_verified"
  | "memory_updated";

export type DappActivityStatus =
  | "pending"
  | "active"
  | "complete"
  | "failed"
  | "skipped";

export interface DappActivityItem {
  id: string;
  kind: DappActivityKind;
  status: DappActivityStatus;
  title: string;
  detail?: string;
  txSignature?: string;
  account?: string;
  hash?: string;
  timestamp?: string;
  /** Marks rows as fixture-driven rather than live. */
  demo?: boolean;
}

const KIND_META: Record<
  DappActivityKind,
  { Icon: ComponentType<{ className?: string }>; eyebrow: string }
> = {
  wallet_connect: { Icon: Wallet, eyebrow: "Wallet" },
  session_verify: { Icon: ShieldQuestion, eyebrow: "Session" },
  skill_selected: { Icon: Sparkles, eyebrow: "Action" },
  action_prepared: { Icon: Workflow, eyebrow: "Plan" },
  tx_signed: { Icon: Hash, eyebrow: "Sign" },
  tx_submitted: { Icon: Hash, eyebrow: "Submit" },
  tx_confirmed: { Icon: CheckCircle2, eyebrow: "Confirm" },
  receipt_anchored: { Icon: ShieldCheck, eyebrow: "Anchor" },
  proof_verified: { Icon: ShieldCheck, eyebrow: "Proof" },
  memory_updated: { Icon: Sparkles, eyebrow: "Memory" },
};

const STATUS_DOT: Record<DappActivityStatus, string> = {
  pending: "bg-slate-700",
  active: "bg-[#38d7d0] shadow-[0_0_14px_rgba(56,215,208,0.5)] animate-pulse",
  complete: "bg-[#14f195] shadow-[0_0_12px_rgba(20,241,149,0.5)]",
  failed: "bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.45)]",
  skipped: "bg-slate-500 opacity-50",
};

function StatusIcon({ status }: { status: DappActivityStatus }) {
  switch (status) {
    case "complete":
      return (
        <CheckCircle2 className="h-3.5 w-3.5 text-[#3bff96]" aria-hidden />
      );
    case "active":
      return (
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-cyan-300"
          aria-hidden
        />
      );
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-rose-300" aria-hidden />;
    case "skipped":
      return <Circle className="h-3.5 w-3.5 text-slate-500" aria-hidden />;
    case "pending":
    default:
      return <Clock3 className="h-3.5 w-3.5 text-slate-500" aria-hidden />;
  }
}

/**
 * Activity / transaction timeline.
 *
 * Renders the canonical Solana dApp loop:
 *   wallet → session → action → sign → submit → confirm → anchor → verify
 *
 * Use `mode="timeline"` (default) for the vertical, side-rail style; use
 * `mode="strip"` for a compact horizontal ribbon.
 */
export function DappActivityTimeline({
  items,
  cluster,
  title = "Activity",
  description,
  mode = "timeline",
  empty,
  className,
}: {
  items: DappActivityItem[];
  cluster: SolanaCluster;
  title?: string;
  description?: string;
  mode?: "timeline" | "strip";
  empty?: ReactNode;
  className?: string;
}) {
  if (mode === "strip") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/40 px-3 py-2 [scrollbar-width:thin]",
          className,
        )}
        aria-label={title}
      >
        {items.length === 0 ? (
          <p className="text-[11px] text-slate-500">No activity yet</p>
        ) : (
          items.map((item, idx) => {
            const meta = KIND_META[item.kind];
            return (
              <div
                key={item.id}
                className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    STATUS_DOT[item.status],
                  )}
                />
                <span className="text-slate-300">{meta.eyebrow}</span>
                {idx < items.length - 1 ? (
                  <span className="text-slate-700">→</span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-black/30 p-4",
        className,
      )}
      aria-label={title}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7dccb8]">
            Onchain activity
          </p>
          <p className="text-sm font-semibold text-white">{title}</p>
          {description ? (
            <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
          ) : null}
        </div>
      </header>

      {items.length === 0 ? (
        (empty ?? (
          <p className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-slate-500">
            Activity appears here as the wallet signs and transactions confirm.
          </p>
        ))
      ) : (
        <ol className="relative ml-2 space-y-3 border-l border-white/10 pl-4">
          {items.map((item) => {
            const meta = KIND_META[item.kind];
            return (
              <li key={item.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[22px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-black/40",
                    STATUS_DOT[item.status],
                  )}
                  aria-hidden
                />
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                      <meta.Icon
                        className="h-3 w-3 text-[#9cf6d8]"
                        aria-hidden
                      />
                      <span className="text-[#9cf6d8]">{meta.eyebrow}</span>
                      {item.demo ? (
                        <DappOnchainTag scope="demo" size="sm" />
                      ) : null}
                    </div>
                    <StatusIcon status={item.status} />
                  </div>
                  <p className="mt-1 text-xs font-medium text-white">
                    {item.title}
                  </p>
                  {item.detail ? (
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                      {item.detail}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {item.txSignature ? (
                      <a
                        href={txExplorerUrl(item.txSignature, cluster)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[10px] text-[#9cf6d8] hover:underline"
                      >
                        sig {shortenAddress(item.txSignature, 6, 6)}
                      </a>
                    ) : null}
                    {item.account ? (
                      <a
                        href={addressExplorerUrl(item.account, cluster)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[10px] text-cyan-200 hover:underline"
                      >
                        acct {shortenAddress(item.account, 4, 4)}
                      </a>
                    ) : null}
                    {item.hash ? (
                      <DappCopyButton
                        value={item.hash}
                        label={`hash ${item.hash.slice(0, 10)}…`}
                        variant="ghost"
                      />
                    ) : null}
                    {item.timestamp ? (
                      <span className="ml-auto text-[10px] text-slate-600">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

const DEFAULT_LOOP: DappActivityKind[] = [
  "wallet_connect",
  "session_verify",
  "skill_selected",
  "action_prepared",
  "tx_signed",
  "tx_submitted",
  "tx_confirmed",
  "receipt_anchored",
  "proof_verified",
  "memory_updated",
];

const KIND_TITLE: Record<DappActivityKind, string> = {
  wallet_connect: "Wallet connected",
  session_verify: "Session verified",
  skill_selected: "Skill / action selected",
  action_prepared: "Action prepared",
  tx_signed: "Transaction signed",
  tx_submitted: "Transaction submitted",
  tx_confirmed: "Transaction confirmed",
  receipt_anchored: "Receipt anchored",
  proof_verified: "Proof verified",
  memory_updated: "Memory updated",
};

/**
 * Builds a default 10-step Solana dApp loop from explicit booleans + a
 * recent transaction list. Drives `DappActivityTimeline`.
 */
export function buildDappActivityFromState(input: {
  walletConnected: boolean;
  sessionVerified: boolean;
  skillSelected?: boolean;
  actionPrepared?: boolean;
  txSignature?: string;
  txConfirmed?: boolean;
  receiptAnchored?: boolean;
  proofVerified?: boolean;
  memoryUpdated?: boolean;
  failureKind?: DappActivityKind;
  receipts?: SolanaTxRecord[];
  demo?: boolean;
}): DappActivityItem[] {
  const reachedKind = (kind: DappActivityKind): DappActivityStatus => {
    if (input.failureKind && input.failureKind === kind) return "failed";
    switch (kind) {
      case "wallet_connect":
        return input.walletConnected ? "complete" : "pending";
      case "session_verify":
        return input.sessionVerified
          ? "complete"
          : input.walletConnected
            ? "active"
            : "pending";
      case "skill_selected":
        return input.skillSelected ? "complete" : "pending";
      case "action_prepared":
        return input.actionPrepared ? "complete" : "pending";
      case "tx_signed":
        return input.txSignature ? "complete" : "pending";
      case "tx_submitted":
        return input.txSignature ? "complete" : "pending";
      case "tx_confirmed":
        return input.txConfirmed
          ? "complete"
          : input.txSignature
            ? "active"
            : "pending";
      case "receipt_anchored":
        return input.receiptAnchored ? "complete" : "pending";
      case "proof_verified":
        return input.proofVerified ? "complete" : "pending";
      case "memory_updated":
        return input.memoryUpdated ? "complete" : "pending";
    }
  };

  return DEFAULT_LOOP.map<DappActivityItem>((kind, idx) => {
    const matchingReceipt = input.receipts?.find((r) => {
      if (kind === "receipt_anchored")
        return r.type === "proof" || r.type === "memory";
      if (kind === "tx_confirmed")
        return r.status === "confirmed" || r.status === "verified";
      return false;
    });
    return {
      id: `dapp-activity-${idx}`,
      kind,
      status: reachedKind(kind),
      title: KIND_TITLE[kind],
      detail: undefined,
      txSignature: matchingReceipt?.txSignature,
      account: matchingReceipt?.account,
      timestamp: matchingReceipt?.createdAt,
      demo: input.demo,
    };
  });
}

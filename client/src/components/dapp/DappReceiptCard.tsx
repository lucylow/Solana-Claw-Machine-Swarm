import { ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/lib/solana/format";
import { ProofStateBadge } from "@/components/solana/ProofStateBadge";
import type { SolanaCluster, SolanaTxRecord } from "@shared/solana/types";
import { solanaTxRecordToStructured } from "@shared/proofTruth";
import { DappCopyButton } from "./DappCopyButton";
import { DappExplorerLink } from "./DappExplorerLink";
import { DappOnchainTag } from "./DappOnchainTag";

/**
 * First-class receipt object.
 *
 * Every receipt shows: type · subject · wallet · tx signature · PDA / account ·
 * proof state · status · explorer link · storage ref · summary hash.
 */
export function DappReceiptCard({
  receipt,
  cluster,
  demo = false,
  highlight = false,
  className,
}: {
  receipt: SolanaTxRecord;
  cluster: SolanaCluster;
  demo?: boolean;
  highlight?: boolean;
  className?: string;
}) {
  const structured = solanaTxRecordToStructured(receipt, { demoMode: demo });
  const onchain = Boolean(receipt.txSignature);
  const scope = demo ? "demo" : onchain ? "onchain" : "offchain";

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-gradient-to-br from-[#070b11]/95 to-[#040608]/95 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition motion-safe:hover:shadow-[0_18px_44px_rgba(20,241,149,0.12)]",
        highlight
          ? "border-[#14f195]/45 shadow-[0_0_0_1px_rgba(20,241,149,0.15),0_18px_40px_rgba(20,241,149,0.2)] motion-safe:animate-[receiptGlow_1.6s_ease-out]"
          : "border-white/[0.08] hover:border-[#14f195]/30",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
              onchain
                ? "border-[#14f195]/45 bg-[#14f195]/10 text-[#9cf6d8]"
                : "border-amber-400/35 bg-amber-500/10 text-amber-100"
            )}
          >
            <ReceiptText className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {structured.title}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {new Date(receipt.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ProofStateBadge status={structured.proofStatus} />
          <DappOnchainTag scope={scope} size="sm" />
        </div>
      </header>

      <p className="text-[12px] leading-snug text-slate-300">
        {structured.summary}
      </p>

      <dl className="grid gap-2 text-[11px] sm:grid-cols-2">
        <div className="rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5">
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Wallet
          </dt>
          <dd className="mt-0.5 flex items-center justify-between gap-2">
            <span className="font-mono text-slate-200">
              {shortenAddress(receipt.wallet, 4, 4)}
            </span>
            <DappCopyButton
              value={receipt.wallet}
              label="Copy"
              variant="ghost"
            />
          </dd>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5">
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Status
          </dt>
          <dd className="mt-0.5 capitalize text-slate-200">{receipt.status}</dd>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5 sm:col-span-2">
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Transaction signature
          </dt>
          <dd className="mt-0.5 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-slate-200">
              {receipt.txSignature
                ? shortenAddress(receipt.txSignature, 8, 8)
                : "—"}
            </span>
            {receipt.txSignature ? (
              <DappCopyButton
                value={receipt.txSignature}
                label="Copy"
                variant="ghost"
              />
            ) : null}
          </dd>
        </div>
        {receipt.account ? (
          <div className="rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5 sm:col-span-2">
            <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              Account / PDA
            </dt>
            <dd className="mt-0.5 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-slate-200">
                {shortenAddress(receipt.account, 8, 8)}
              </span>
              <DappCopyButton
                value={receipt.account}
                label="Copy"
                variant="ghost"
              />
            </dd>
          </div>
        ) : null}
        {receipt.summaryHash ? (
          <div className="rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5 sm:col-span-2">
            <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              Summary hash
            </dt>
            <dd className="mt-0.5 truncate font-mono text-slate-200">
              {receipt.summaryHash}
            </dd>
          </div>
        ) : null}
        {receipt.storageRef ? (
          <div className="rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5 sm:col-span-2">
            <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              Storage ref
            </dt>
            <dd className="mt-0.5 truncate font-mono text-slate-300">
              {receipt.storageRef}
            </dd>
          </div>
        ) : null}
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <DappExplorerLink
          kind="tx"
          value={receipt.txSignature}
          cluster={cluster}
        />
        {receipt.account ? (
          <DappExplorerLink
            kind="address"
            value={receipt.account}
            cluster={cluster}
            label="Account in Explorer"
            variant="inline"
          />
        ) : null}
      </footer>
    </article>
  );
}

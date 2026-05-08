import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ProofStateBadge } from "@/components/solana/ProofStateBadge";
import type { SolanaCluster, SolanaTxRecord } from "@shared/solana/types";
import { DappEmptyState } from "./DappEmptyState";
import { DappReceiptCard } from "./DappReceiptCard";
import { DappOnchainTag } from "./DappOnchainTag";
import type { DappProofStatus } from "./types";

/**
 * Side panel that turns proof + receipts into a primary surface.
 *
 * Renders:
 *  - proof headline (status + scope)
 *  - top receipt(s) with explorer links and copy affordances
 *  - extension slot for additional content (e.g. memory references)
 */
export function DappProofPanel({
  receipts,
  cluster,
  proofStatus,
  demoIds,
  highlightId,
  description,
  emptyTitle = "No receipts yet",
  emptyDescription = "Receipts appear here once your wallet signs an action and the transaction lands on Solana.",
  extension,
  className,
}: {
  receipts: SolanaTxRecord[];
  cluster: SolanaCluster;
  proofStatus: DappProofStatus;
  demoIds?: string[];
  highlightId?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  extension?: ReactNode;
  className?: string;
}) {
  const visible = receipts.slice(0, 6);
  const demoSet = demoIds?.length ? new Set(demoIds) : undefined;

  return (
    <aside
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#040608]/95 to-[#02040a]/95 p-4 sm:p-5",
        className
      )}
      aria-label="Proof and receipts"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-[#14f195]/35 bg-[#14f195]/10 text-[#9cf6d8]">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7dccb8]">
              Proof & receipts
            </p>
            <p className="text-sm font-semibold text-white">
              Solana evidence ledger
            </p>
            {description ? (
              <p className="mt-0.5 max-w-md text-[11px] text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ProofStateBadge status={proofStatus} />
          <DappOnchainTag
            scope={
              proofStatus === "demo_only"
                ? "demo"
                : proofStatus === "verified" || proofStatus === "pending"
                  ? "onchain"
                  : "offchain"
            }
            size="sm"
          />
        </div>
      </header>

      {visible.length === 0 ? (
        <DappEmptyState
          title={emptyTitle}
          description={emptyDescription}
          tone="wallet"
        />
      ) : (
        <div className="space-y-3">
          {visible.map((receipt) => (
            <DappReceiptCard
              key={receipt.id}
              receipt={receipt}
              cluster={cluster}
              demo={demoSet?.has(receipt.id) ?? false}
              highlight={highlightId === receipt.id}
            />
          ))}
        </div>
      )}

      {extension}
    </aside>
  );
}

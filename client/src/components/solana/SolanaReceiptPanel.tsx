import { ProofStateBadge } from "@/components/solana/ProofStateBadge";
import { Badge } from "@/components/ui/badge";
import { proofStatusHint } from "@/lib/copy/renderProofClaim";
import { SOLANA_COPY } from "@shared/copy";
import { getClaimText, getReceiptTruthLine, solanaTxRecordToStructured } from "@shared/proofTruth";
import type { SolanaTxRecord } from "@shared/solana/types";
import { ReceiptText } from "lucide-react";

export function SolanaReceiptPanel({
  receipts,
  demoReceiptIds,
}: {
  receipts: SolanaTxRecord[];
  /** Mark known fixture rows as demo / cache-only (does not claim live verification). */
  demoReceiptIds?: string[];
}) {
  const demoSet = demoReceiptIds?.length ? new Set(demoReceiptIds) : undefined;
  const rows = receipts.slice(0, 6);

  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
      <div className="flex items-center gap-2">
        <ReceiptText className="h-4 w-4 text-[#3bff96]" aria-hidden />
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{SOLANA_COPY.receipts.panelTitle}</p>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">{SOLANA_COPY.receipts.empty}</p>
        ) : (
          rows.map(r => {
            const demo = demoSet?.has(r.id) === true;
            const structured = solanaTxRecordToStructured(r, { demoMode: demo });
            const truth = getReceiptTruthLine(structured);
            const claim = getClaimText(structured);
            return (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">{structured.title}</p>
                    <p className="text-[11px] text-slate-500">{new Date(r.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-[11px] leading-snug text-slate-400">{structured.summary}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ProofStateBadge status={structured.proofStatus} />
                    <Badge className="border-white/15 bg-black/50 text-[10px] font-normal text-slate-400">
                      {structured.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                  {r.txSignature ? (
                    <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono">
                      tx {r.txSignature.slice(0, 12)}…
                    </span>
                  ) : (
                    <span className="rounded border border-amber-500/25 bg-amber-950/20 px-1.5 py-0.5 text-amber-100/90">
                      tx missing
                    </span>
                  )}
                  {r.account ? (
                    <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono">
                      acct {r.account.slice(0, 8)}…
                    </span>
                  ) : null}
                  {r.summaryHash ? (
                    <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono">
                      hash {String(r.summaryHash).slice(0, 10)}…
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#8fd9c4]" title={proofStatusHint(structured.proofStatus)}>
                  {truth}
                </p>
                <p className="text-[11px] text-slate-500">{claim}</p>
                {r.explorerUrl ? (
                  <a
                    href={r.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#38d7d0] underline-offset-4 hover:underline"
                  >
                    {SOLANA_COPY.receipts.explorerVerifiable}
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-600">Explorer link not set for this row.</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

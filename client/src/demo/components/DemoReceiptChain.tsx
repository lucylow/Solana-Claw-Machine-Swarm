import type { DemoReceiptFixture } from "@shared/demoTypes";
import { ArrowRight } from "lucide-react";
import { DemoPanel } from "./DemoPanel";

const CHAIN_ORDER: DemoReceiptFixture["kind"][] = [
  "plan_generate",
  "execution_complete",
  "reflection_store",
  "memory_store",
  "proof_anchor",
];

export function DemoReceiptChain({
  receipts,
}: {
  receipts: DemoReceiptFixture[];
}) {
  const ordered = CHAIN_ORDER.map((k) =>
    receipts.find((r) => r.kind === k),
  ).filter(Boolean) as DemoReceiptFixture[];

  return (
    <DemoPanel className="space-y-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        Chain of custody
      </p>
      <h3 className="text-lg font-semibold text-white">
        Receipt chain on Solana
      </h3>
      <div className="flex flex-wrap items-stretch gap-2">
        {ordered.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2">
            <div className="min-w-[140px] flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                {r.kind.replace(/_/g, " ")}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-200">
                {r.subject}
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-600">
                {r.id}
              </p>
            </div>
            {i < ordered.length - 1 ? (
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-600"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Each receipt references the prior artifact hash — an audit trail that is
        cheap to verify on Solana.
      </p>
    </DemoPanel>
  );
}

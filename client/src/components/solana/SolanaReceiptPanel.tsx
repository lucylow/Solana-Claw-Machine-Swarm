import { Badge } from "@/components/ui/badge";
import type { SolanaTxRecord } from "@shared/solana/types";
import { ReceiptText } from "lucide-react";

export function SolanaReceiptPanel({ receipts }: { receipts: SolanaTxRecord[] }) {
  const rows = receipts.slice(0, 6);
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
      <div className="flex items-center gap-2">
        <ReceiptText className="h-4 w-4 text-[#3bff96]" aria-hidden />
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Recent receipts</p>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">Anchored receipts appear here after skills, runs, and proofs settle.</p>
        ) : (
          rows.map(r => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-100">{r.type}</p>
                <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <Badge className="border-[#3bff96]/35 bg-[#3bff96]/10 text-[11px] text-[#c9ffe8]">{r.status}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

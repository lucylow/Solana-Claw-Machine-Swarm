import { ExplorerLinkButton, ProofVerificationBadge } from "@/components/command-center/CommandCenterComponents";
import { txExplorerUrl } from "@/lib/solana/explorer";
import { shortenAddress } from "@/lib/solana/format";
import { cn } from "@/lib/utils";
import type { DemoReceiptFixture } from "@shared/demoTypes";
import { ChevronDown, ChevronUp, ReceiptText } from "lucide-react";
import { useState } from "react";
import { DemoPanel } from "./DemoPanel";

export function DemoReceiptCard({
  receipt,
  defaultOpen = false,
}: {
  receipt: DemoReceiptFixture;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <DemoPanel className={cn("space-y-2 p-3", open && "border-[#3bff96]/30")}>
      <button type="button" className="flex w-full items-start justify-between gap-2 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-[#3bff96]" />
          <div>
            <p className="text-sm font-medium text-white">{receipt.kind.replace(/_/g, " ")}</p>
            <p className="text-xs text-slate-500">{receipt.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ProofVerificationBadge
            verification={{
              status: receipt.status === "verified" ? "verified" : receipt.status === "pending" ? "pending" : "verified",
              label: receipt.status,
            }}
          />
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-slate-500">Receipt id</p>
              <p className="mt-1 font-mono text-slate-300">{receipt.id}</p>
            </div>
            <div>
              <p className="text-slate-500">Chain</p>
              <p className="mt-1 text-slate-200">{receipt.chain} · subject {receipt.subjectType}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-500">Wallet author</p>
              <p className="mt-1 font-mono text-slate-300">{shortenAddress(receipt.wallet, 8, 8)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-500">Transaction signature</p>
              <p className="mt-1 break-all font-mono text-[11px] text-[#c8ffe2]">{receipt.txSignature}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-500">Account / proof ref</p>
              <p className="mt-1 font-mono text-slate-400">{receipt.accountOrProofRef}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-500">Summary hash</p>
              <p className="mt-1 break-all font-mono text-slate-500">{receipt.summaryHash}</p>
            </div>
            {receipt.storageReference ? (
              <div className="sm:col-span-2">
                <p className="text-slate-500">Storage reference</p>
                <p className="mt-1 break-all font-mono text-slate-400">{receipt.storageReference}</p>
              </div>
            ) : null}
          </div>
          <p className="text-slate-600">Anyone can verify this receipt on Solana against the published hashes.</p>
          <ExplorerLinkButton payload={{ label: "Verify on Solana Explorer", url: txExplorerUrl(receipt.txSignature) }} />
        </div>
      ) : null}
    </DemoPanel>
  );
}

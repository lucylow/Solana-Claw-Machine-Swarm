import {
  ExplorerLinkButton,
  ProofVerificationBadge,
} from "@/components/command-center/CommandCenterComponents";
import { txExplorerUrl } from "@/lib/solana/explorer";
import { shortenAddress } from "@/lib/solana/format";
import type { DemoReceiptFixture } from "@shared/demoTypes";
import { Shield } from "lucide-react";
import { DemoPanel } from "./DemoPanel";

export function DemoProofPanel({
  receipt,
}: {
  receipt: DemoReceiptFixture | undefined;
}) {
  if (!receipt) {
    return (
      <DemoPanel className="text-sm text-slate-500">
        No receipt selected — pick a scenario with anchored proofs.
      </DemoPanel>
    );
  }

  return (
    <DemoPanel className="space-y-4 border-[#3bff96]/25 shadow-[0_0_24px_rgba(59,255,150,0.08)]">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-[#3bff96]" />
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            On-chain proof
          </p>
          <h3 className="text-lg font-semibold text-white">
            Solana receipt viewer
          </h3>
        </div>
        <ProofVerificationBadge
          verification={{
            status: receipt.status === "verified" ? "verified" : "pending",
            label:
              receipt.status === "verified"
                ? "Confirmed on Solana"
                : "Pending confirmation",
          }}
        />
      </div>
      <p className="text-sm text-slate-300">
        Durable receipts anchor summaries so judges, users, and counterparties
        can verify execution without trusting a central UI.
      </p>
      <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-300">
        <p>
          <span className="text-slate-500">Author</span> ·{" "}
          {shortenAddress(receipt.wallet, 6, 6)}
        </p>
        <p className="mt-2 break-all">
          <span className="text-slate-500">Signature</span> ·{" "}
          {receipt.txSignature.slice(0, 18)}…{receipt.txSignature.slice(-12)}
        </p>
        <p className="mt-2">
          <span className="text-slate-500">Compact hash</span> ·{" "}
          {receipt.summaryHash}
        </p>
      </div>
      <ExplorerLinkButton
        payload={{
          label: "Open Solana Explorer",
          url: txExplorerUrl(receipt.txSignature),
        }}
      />
    </DemoPanel>
  );
}

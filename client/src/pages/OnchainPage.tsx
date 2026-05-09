import {
  ArrowRight,
  Database,
  ExternalLink,
  Hash,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DappBalanceCard,
  DappShell,
  DappActivityTimeline,
  DappOnchainTag,
  DappProofPanel,
  DappSectionHeader,
  DappWalletSummary,
  buildDappActivityFromState,
  useDappChainState,
} from "@/components/dapp";
import { DEMO_CHAIN_RECEIPT } from "@shared/solana/demoCanonical";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";

const custodySteps = [
  {
    label: "Offchain artifact",
    detail:
      "Reflections, plans, manifests, and chat — stored backend / 0G with replay URIs.",
    Icon: Database,
    scope: "offchain" as const,
  },
  {
    label: "Summary hash",
    detail:
      "SHA-256 fingerprints prove content without putting prose on-chain.",
    Icon: Hash,
    scope: "offchain" as const,
  },
  {
    label: "Onchain proof",
    detail:
      "Memo + PDAs carry compact payload hashes, wallet, cluster, receipts.",
    Icon: Link2,
    scope: "onchain" as const,
  },
  {
    label: "Explorer verification",
    detail: "Every signature and account opens directly on Solana Explorer.",
    Icon: ExternalLink,
    scope: "onchain" as const,
  },
];

export default function OnchainPage() {
  const wallet = useSolanaWalletContext();
  const state = useDappChainState();
  const receipts =
    wallet.txHistory.length > 0 ? wallet.txHistory : [DEMO_CHAIN_RECEIPT];
  const demoIds = wallet.txHistory.length === 0 ? [DEMO_CHAIN_RECEIPT.id] : [];

  const activity = buildDappActivityFromState({
    walletConnected: state.connected,
    sessionVerified: state.sessionStatus === "verified",
    skillSelected: false,
    actionPrepared: Boolean(state.txSignature),
    txSignature: state.txSignature,
    txConfirmed:
      state.txStatus === "confirmed" ||
      receipts.some((r) => r.status === "confirmed"),
    receiptAnchored: receipts.some(
      (r) => r.status === "confirmed" || r.status === "verified",
    ),
    proofVerified: state.proofStatus === "verified",
    receipts,
    demo: state.demoMode || demoIds.length > 0,
  });

  const sideRail = (
    <>
      <DappWalletSummary variant="block" />
      <DappBalanceCard />
      <DappActivityTimeline
        items={activity}
        cluster={state.cluster}
        title="Onchain custody trail"
        description="What is anchored, what is offchain, what is demo."
      />
    </>
  );

  return (
    <DappShell
      brand="Onchain proof rail"
      sideRail={sideRail}
      topRightSlot={
        <Button
          asChild
          size="sm"
          variant="outline"
          className="rounded-full border-white/15 text-[11px] text-slate-200"
        >
          <Link href="/dashboard?section=overview">
            dApp dashboard
            <ArrowRight className="ml-1 h-3 w-3" aria-hidden />
          </Link>
        </Button>
      }
    >
      <DappSectionHeader
        eyebrow="Solana proof rail"
        title="Onchain custody and receipts"
        description="This surface shows exactly what is trusted on Solana versus what stays off-chain. Narratives never belong in memos — only hashes, pointers, and compact receipt metadata do."
        actions={
          <Link
            href="/proofs"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#14f195]/40 bg-[#14f195]/[0.08] px-3 py-1 text-[11px] font-semibold text-[#d6ffe9] hover:bg-[#14f195]/12"
          >
            Open proof explorer
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      />

      <DappProofPanel
        receipts={receipts}
        cluster={state.cluster}
        proofStatus={state.proofStatus}
        demoIds={demoIds}
        description="Compact proofs settle on Solana with explorer verification — full content stays off-chain."
      />

      <section className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0a120e]/95 to-[#04080b]/95 p-5 sm:p-6">
        <DappSectionHeader
          eyebrow="Chain of custody"
          title="From offchain artifact to explorer-verifiable proof"
        />
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {custodySteps.map((step, idx) => (
            <li
              key={step.label}
              className="flex gap-3 rounded-2xl border border-white/[0.06] bg-black/35 p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#14f195]/30 bg-[#14f195]/10 text-[#9cf6d8]">
                <step.Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Step {idx + 1}
                  </p>
                  <DappOnchainTag scope={step.scope} size="sm" />
                </div>
                <p className="mt-1 text-sm font-semibold text-white">
                  {step.label}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#04080b]/95 to-[#02060c]/95 p-5">
        <header className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Live wallet diagnostics
            </p>
            <p className="text-sm font-semibold text-white">
              Cluster + RPC integrity
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Diagnostic
          </span>
        </header>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Diag label="Cluster" value={state.cluster} mono />
          <Diag
            label="Cluster mismatch"
            value={state.wrongCluster ? "Yes" : "No"}
          />
          <Diag label="RPC URL" value={state.rpcUrl} mono />
          <Diag label="Explorer base" value={state.explorerBaseUrl} mono />
          <Diag
            label="Session"
            value={
              state.sessionStatus === "verified"
                ? "Verified"
                : state.sessionStatus
            }
            mono
          />
          <Diag label="Proof status" value={state.proofStatus} mono />
        </dl>
      </section>
    </DappShell>
  );
}

function Diag({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-0.5 break-all text-xs ${mono ? "font-mono text-slate-200" : "text-slate-200"}`}
      >
        {value}
      </dd>
    </div>
  );
}

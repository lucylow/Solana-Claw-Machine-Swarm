import { SolanaReceiptPanel } from "@/components/solana/SolanaReceiptPanel";
import { SolanaSessionBanner } from "@/components/solana/SolanaSessionBanner";
import SolanaWalletPanel from "@/components/solana/SolanaWalletPanel";
import { Button } from "@/components/ui/button";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { Link } from "wouter";

const custodySteps = [
  { label: "Offchain artifact", detail: "Reflections, plans, manifests, chat — stored backend / 0G with replay URIs." },
  { label: "Summary hash", detail: "SHA-256 fingerprints prove content without putting prose on-chain." },
  { label: "Onchain proof", detail: "Memo + PDAs carry compact payload hashes, wallet, cluster, and receipts." },
  { label: "Explorer verification", detail: "Every signature and account opens directly on Solana Explorer." },
];

export default function OnchainPage() {
  const { walletState: snap } = useSolanaWallet();
  const wrongCluster = Boolean(snap.diagnostics.wrongCluster);

  return (
    <div className="min-h-screen bg-[#030507] px-4 py-10 text-white">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7dccb8]">Solana proof rail</p>
            <h1 className="mt-2 text-3xl font-bold text-[#eafff4]">On-chain custody & receipts</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              This surface shows exactly what is trusted on Solana versus what stays off-chain. Narratives and large JSON
              never belong in memos — only hashes, pointers, and compact receipt metadata do.
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/20 text-slate-100">
            <Link href="/dashboard">Back to command center</Link>
          </Button>
        </div>

        <SolanaSessionBanner verified={snap.isSessionVerified} wrongCluster={wrongCluster} />

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <SolanaWalletPanel />
          <SolanaReceiptPanel receipts={snap.txHistory} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#070b11]/95 p-6">
          <h2 className="text-lg font-semibold text-[#d7ffe9]">Chain of custody</h2>
          <ol className="mt-4 space-y-4">
            {custodySteps.map((step, idx) => (
              <li key={step.label} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#3bff96]/35 bg-[#3bff96]/10 text-sm font-semibold text-[#c9ffe8]">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-white">{step.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-cyan-500/25 bg-black/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-200">Live wallet diagnostics</h3>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Cluster</dt>
              <dd className="font-mono text-slate-100">{snap.cluster}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Session cache key</dt>
              <dd className="break-all font-mono text-xs text-slate-400">
                {String(snap.diagnostics.sessionStorageKey ?? "—")} (non-authoritative)
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">RPC</dt>
              <dd className="break-all font-mono text-xs text-slate-400">{snap.rpcUrl}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Explorer base</dt>
              <dd className="break-all font-mono text-xs text-slate-400">{snap.explorerBaseUrl}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

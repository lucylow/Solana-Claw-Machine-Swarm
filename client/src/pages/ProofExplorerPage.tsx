import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DappBalanceCard,
  DappCopyButton,
  DappEmptyState,
  DappErrorState,
  DappExplorerLink,
  DappOnchainTag,
  DappReceiptSkeleton,
  DappSectionHeader,
  DappShell,
  DappWalletSummary,
  useDappChainState,
} from "@/components/dapp";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";
import { shortenAddress } from "@/lib/solana/format";
import { SOLANA_COPY } from "@shared/copy";

type ProofRow = {
  id: string;
  action: string;
  walletAddress: string;
  accountAddress: string;
  payloadHash: string;
  status: string;
  txSignature?: string;
  createdAt: number;
};

export default function ProofExplorerPage() {
  const wallet = useSolanaWalletContext();
  const state = useDappChainState();
  const [rows, setRows] = useState<ProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/solana/history?limit=50");
        const body = (await res.json()) as { ok: boolean; data?: ProofRow[]; error?: string };
        if (!res.ok || !body.ok || !body.data) {
          throw new Error(body.error || "proof_history_failed");
        }
        if (!canceled) {
          setRows(body.data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!canceled) setError(err instanceof Error ? err.message : "proof_history_failed");
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    load().catch(() => undefined);
    return () => {
      canceled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (scope === "mine" && wallet.walletAddress) {
      out = out.filter((row) => row.walletAddress === wallet.walletAddress);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      out = out.filter(
        (row) =>
          row.action.toLowerCase().includes(term) ||
          row.id.toLowerCase().includes(term) ||
          row.walletAddress.toLowerCase().includes(term) ||
          row.accountAddress.toLowerCase().includes(term) ||
          row.payloadHash.toLowerCase().includes(term)
      );
    }
    return out;
  }, [rows, scope, searchTerm, wallet.walletAddress]);

  const sideRail = (
    <>
      <DappWalletSummary variant="block" />
      <DappBalanceCard />
      <article className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
        <header className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7dccb8]">
            Proof legend
          </p>
          <ShieldCheck className="h-3.5 w-3.5 text-[#9cf6d8]" aria-hidden />
        </header>
        <ul className="mt-3 space-y-2 text-[11px] text-slate-400">
          <li>
            <DappOnchainTag scope="onchain" size="sm" /> — anchored signature on Solana.
          </li>
          <li>
            <DappOnchainTag scope="offchain" size="sm" /> — referenced via storage / sidecar.
          </li>
          <li>
            <DappOnchainTag scope="demo" size="sm" /> — fixture row for demo mode.
          </li>
        </ul>
      </article>
    </>
  );

  return (
    <DappShell
      brand="Solana proof explorer"
      sideRail={sideRail}
      topRightSlot={
        <Button asChild size="sm" variant="outline" className="rounded-full border-white/15 text-[11px] text-slate-200">
          <Link href="/dashboard?section=proof-explorer">
            {SOLANA_COPY.navigation.backCommandCenter}
            <ArrowRight className="ml-1 h-3 w-3" aria-hidden />
          </Link>
        </Button>
      }
    >
      <DappSectionHeader
        eyebrow="Solana proof explorer"
        title={SOLANA_COPY.explorer.pageTitle}
        description={SOLANA_COPY.explorer.pageSubtitle}
        actions={
          <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1">
            {(
              [
                { id: "all", label: "All wallets" },
                { id: "mine", label: "My wallet" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setScope(option.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  scope === option.id
                    ? "bg-[#14f195]/15 text-[#d6ffe9]"
                    : "text-slate-400 hover:text-[#d6ffe9]"
                }`}
                disabled={option.id === "mine" && !wallet.walletAddress}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-4">
        <label
          htmlFor="proof-search"
          className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500"
        >
          Search proofs
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          <input
            id="proof-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="By action, signature, wallet, or hash"
            className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
          {searchTerm ? (
            <button
              type="button"
              className="text-[11px] text-slate-500 hover:text-[#d6ffe9]"
              onClick={() => setSearchTerm("")}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <DappReceiptSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {error ? (
        <DappErrorState
          title="Could not load proof history"
          description={error}
          hint="Confirm the cluster RPC is reachable and the indexer endpoint is healthy."
          onRetry={() => window.location.reload()}
        />
      ) : null}

      <div className="space-y-3">
        {filtered.map((row) => (
          <article
            key={row.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#070b11]/95 to-[#040608]/95 p-4 transition hover:border-[#14f195]/30 hover:shadow-[0_18px_36px_rgba(20,241,149,0.08)]"
          >
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7dccb8]">
                  Receipt · {row.action}
                </p>
                <p className="mt-0.5 truncate font-mono text-sm text-white">
                  {row.id}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                  {row.status}
                </span>
                <DappOnchainTag
                  scope={row.txSignature ? "onchain" : "offchain"}
                  size="sm"
                />
              </div>
            </header>

            <dl className="grid gap-2 text-[11px] sm:grid-cols-2">
              <Field label="Author wallet" value={shortenAddress(row.walletAddress, 6, 6)} copy={row.walletAddress} />
              <Field
                label="Account / PDA"
                value={shortenAddress(row.accountAddress, 6, 6)}
                copy={row.accountAddress}
              />
              <Field
                label="Payload hash"
                value={shortenAddress(row.payloadHash, 8, 8)}
                copy={row.payloadHash}
                mono
              />
              <Field
                label="Created"
                value={new Date(row.createdAt).toLocaleString()}
              />
            </dl>

            <footer className="flex flex-wrap items-center gap-2">
              {row.txSignature ? (
                <DappExplorerLink
                  kind="tx"
                  value={row.txSignature}
                  cluster={state.cluster}
                  label="Open tx in Explorer"
                />
              ) : null}
              <DappExplorerLink
                kind="address"
                value={row.accountAddress}
                cluster={state.cluster}
                label="Open account"
                variant="inline"
              />
              {row.txSignature ? (
                <DappCopyButton
                  value={row.txSignature}
                  label="Copy signature"
                />
              ) : null}
            </footer>
          </article>
        ))}

        {!loading && filtered.length === 0 ? (
          <DappEmptyState
            title="No matching Solana receipts"
            description="Run a skill execution or demo to emit explorer-verifiable proof rows. Filters and search apply to all available rows."
            tone="wallet"
            action={
              <Button
                size="sm"
                className="rounded-full bg-[#14f195] font-semibold text-black hover:bg-[#3bff96]"
                onClick={() => {
                  setScope("all");
                  setSearchTerm("");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : null}
      </div>
    </DappShell>
  );
}

function Field({
  label,
  value,
  copy,
  mono,
}: {
  label: string;
  value: string;
  copy?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1.5">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-0.5 flex items-center justify-between gap-2 ${mono ? "font-mono" : ""} text-slate-200`}
      >
        <span className="truncate">{value}</span>
        {copy ? (
          <DappCopyButton value={copy} label="Copy" variant="ghost" />
        ) : null}
      </dd>
    </div>
  );
}

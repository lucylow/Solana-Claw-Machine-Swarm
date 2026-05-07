import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { createSolanaExplorerUrl } from "@/lib/solana/explorer";
import { shortenAddress } from "@/lib/solana/format";

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
  const wallet = useSolanaWallet();
  const [rows, setRows] = useState<ProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!wallet.walletAddress) return rows;
    return rows.filter(row => row.walletAddress === wallet.walletAddress);
  }, [rows, wallet.walletAddress]);

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      <header className="border-b border-slate-800 bg-black/80">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-semibold">Proof Explorer</h1>
            <p className="text-xs text-slate-400">Solana explorer for agent receipts and proof objects</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="border-slate-700 text-slate-200">
                Dashboard
              </Button>
            </Link>
            <Link href="/receipts">
              <Button variant="outline" className="border-cyan-500/40 text-cyan-200">
                Receipts
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Card className="mb-4 border-slate-800 bg-black/40 p-4 text-sm">
          Wallet: <span className="text-[#b8ffd8]">{wallet.walletAddress || "Not connected"}</span> | Session:{" "}
          <span className="text-cyan-300">{wallet.state}</span> | Cluster:{" "}
          <span className="text-cyan-300">{wallet.cluster}</span>
        </Card>

        {loading ? <Card className="border-slate-800 bg-black/40 p-4">Loading proof history...</Card> : null}
        {error ? <Card className="border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</Card> : null}

        <div className="space-y-3">
          {filtered.map(row => (
            <Card key={row.id} className="border-slate-800 bg-black/40 p-4">
              <div className="grid gap-2 text-xs md:grid-cols-4">
                <div>
                  <p className="text-slate-500">Receipt ID</p>
                  <p className="text-slate-200">{row.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Action</p>
                  <p className="text-slate-200">{row.action}</p>
                </div>
                <div>
                  <p className="text-slate-500">Wallet</p>
                  <p className="text-slate-200">{shortenAddress(row.walletAddress, 8, 8)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="text-slate-200">{row.status}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-500">Account/PDA</p>
                  <p className="text-slate-200">{shortenAddress(row.accountAddress, 10, 10)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-500">Hash</p>
                  <p className="font-mono text-slate-200">{shortenAddress(row.payloadHash, 14, 14)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {row.txSignature ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/40 text-cyan-200"
                    onClick={() => window.open(createSolanaExplorerUrl("tx", row.txSignature || ""), "_blank")}
                  >
                    Open tx on explorer
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-200"
                  onClick={() => navigator.clipboard.writeText(row.accountAddress)}
                >
                  Copy account
                </Button>
              </div>
            </Card>
          ))}
          {!loading && filtered.length === 0 ? (
            <Card className="border-slate-800 bg-black/40 p-4 text-sm text-slate-400">
              No proof receipts yet. Run a skill execution or demo to generate on-chain proof events.
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}

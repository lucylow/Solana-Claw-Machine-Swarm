import DaoAgentCouncil from "@/components/dao/DaoAgentCouncil";
import DaoMemoryPanel from "@/components/dao/DaoMemoryPanel";
import { daoApi } from "@/dao/daoApi";
import "@/dao/dao.css";
import type { DaoCommandCenterPayload } from "@shared/dao/types";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

type Tab = "summary" | "votes" | "delegation" | "agents" | "treasury" | "receipts" | "memory";

export default function DaoProposalPage() {
  const [, params] = useRoute("/dao/proposals/:id");
  const id = params?.id ?? "";
  const { walletAddress } = useSolanaWallet();
  const [data, setData] = useState<DaoCommandCenterPayload | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [demo, setDemo] = useState(true);

  useEffect(() => {
    daoApi
      .getCommandCenter({ demo, walletAddress: walletAddress ?? undefined })
      .then(setData)
      .catch(() => setData(null));
  }, [demo, walletAddress]);

  const p = data?.proposals.find(x => x.id === id);

  return (
    <div className="min-h-screen bg-[#030507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(36,208,170,0.12),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(120,80,200,0.1),transparent_40%)]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dao" className="ghost-btn inline-flex items-center text-[#b8ffe0]">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Command center
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">CLAW MACHINE</p>
              <h1 className="text-lg font-semibold">Proposal · Solana governance</h1>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/80">
            <input type="checkbox" checked={demo} onChange={e => setDemo(e.target.checked)} />
            Demo fixtures
          </label>
        </div>
      </header>

      <main className="container relative z-10 pb-12">
        {!data || !p ? (
          <div className="dao-shell muted-line mt-8">Loading proposal…</div>
        ) : (
          <section className="dao-shell mt-6">
            <div className="item-meta mb-4">
              <span className="mini-pill">{p.status}</span>
              <span className="mini-pill">{p.proposalType.replace(/_/g, " ")}</span>
              <span className="mini-pill">{p.proofStatus}</span>
              <span className="mini-pill">cluster {p.onchain?.cluster ?? data.cluster}</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">{p.title}</h2>
            <p className="muted-line">Author {p.authorWallet}</p>

            <div className="dao-cc-nav mt-4" style={{ position: "static", flexWrap: "wrap" }}>
              {(
                [
                  "summary",
                  "votes",
                  "delegation",
                  "agents",
                  "treasury",
                  "receipts",
                  "memory",
                ] as const
              ).map(t => (
                <button
                  key={t}
                  type="button"
                  className={tab === t ? "dao-cc-nav-active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === "summary" ? (
                <div>
                  <p className="text-white/90">{p.summary}</p>
                  {p.fullDescription ? <p className="muted-line mt-2">{p.fullDescription}</p> : null}
                  <div className="dao-cc-split mt-4">
                    <div className="item-card">
                      <div className="dao-cc-panel-title">Quorum</div>
                      <div className="text-white">
                        {p.quorumReached} / {p.quorumRequired} bps
                      </div>
                    </div>
                    <div className="item-card">
                      <div className="dao-cc-panel-title">Votes</div>
                      <div className="muted-line">
                        yes {p.voteYes} · no {p.voteNo} · abstain {p.voteAbstain} · veto {p.voteVeto}
                      </div>
                    </div>
                  </div>
                  <div className="item-card mt-3">
                    <div className="dao-cc-panel-title">Off-chain deliberation</div>
                    <div className="muted-line">ref {p.offchain?.storageRef ?? "—"}</div>
                    <div className="muted-line">thread {p.offchain?.discussionThreadId ?? "—"}</div>
                  </div>
                </div>
              ) : null}

              {tab === "votes" ? (
                <div className="stack-list">
                  {data.votes
                    .filter(v => v.proposalId === id)
                    .map(v => (
                      <div key={v.id} className="item-card">
                        <div className="item-top">
                          <span className="text-white">{v.choice}</span>
                          <span className="chip">{v.status}</span>
                        </div>
                        <div className="muted-line">weight {v.weight}</div>
                        <div className="muted-line font-mono text-xs">{v.voterWallet}</div>
                        {v.proofReceiptId ? <div className="muted-line">receipt {v.proofReceiptId}</div> : null}
                      </div>
                    ))}
                </div>
              ) : null}

              {tab === "delegation" ? (
                <div className="stack-list">
                  {data.delegations.map(d => (
                    <div key={d.id} className="item-card">
                      <div className="muted-line">
                        {d.fromWallet.slice(0, 6)}… → {d.toWallet.slice(0, 6)}…
                      </div>
                      <div className="muted-line">status {d.status} · weight {d.weight}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              {tab === "agents" ? (
                <DaoAgentCouncil items={data.agentRecommendations.filter(a => a.proposalId === id)} />
              ) : null}

              {tab === "treasury" ? (
                <div className="item-card">
                  {p.treasuryImpact ? (
                    <>
                      <div className="text-white">
                        {(p.treasuryImpact.amount ?? 0) / 1e9} SOL · {p.treasuryImpact.budgetCategory}
                      </div>
                      <div className="muted-line font-mono text-xs">{p.treasuryImpact.destination}</div>
                    </>
                  ) : (
                    <p className="muted-line">No direct treasury impact on this proposal type.</p>
                  )}
                </div>
              ) : null}

              {tab === "receipts" ? (
                <div className="item-card">
                  <div className="muted-line">proposal receipt {p.proposalReceiptId ?? "—"}</div>
                  <div className="muted-line">execution {p.executionReceiptId ?? "—"}</div>
                  {p.executionTxSignature ? (
                    <a
                      className="text-[#87f7d0] underline text-sm mt-2 block"
                      href={`${data.explorerBaseUrl}/tx/${p.executionTxSignature}?cluster=${data.cluster}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explorer · execution signature
                    </a>
                  ) : null}
                  {p.onchain?.pda ? <div className="muted-line mt-2">PDA {p.onchain.pda}</div> : null}
                </div>
              ) : null}

              {tab === "memory" ? (
                <DaoMemoryPanel items={data.governanceMemory.filter(m => m.proposalId === id)} />
              ) : null}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

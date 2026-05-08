import { daoApi } from "@/dao/daoApi";
import "@/dao/dao.css";
import type { DaoCommandCenterPayload } from "@shared/dao/types";
import type { DaoProposalKind } from "@/dao/daoTypes";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { useCallback, useEffect, useMemo, useState } from "react";
import DaoAgentCouncil from "./DaoAgentCouncil";
import DaoDelegationPanel from "./DaoDelegationPanel";
import DaoGovernanceStage from "./DaoGovernanceStage";
import DaoMemoryPanel from "./DaoMemoryPanel";
import DaoProposalList from "./DaoProposalList";
import DaoReceiptExplorer from "./DaoReceiptExplorer";
import DaoRightIdentityPanel from "./DaoRightIdentityPanel";
import DaoStatusRail from "./DaoStatusRail";
import DaoTimeline from "./DaoTimeline";
import DaoTreasuryPanel from "./DaoTreasuryPanel";
import DaoVotePanel from "./DaoVotePanel";

type Section =
  | "overview"
  | "proposals"
  | "treasury"
  | "votes"
  | "delegation"
  | "members"
  | "agents"
  | "receipts"
  | "memory"
  | "settings";

const KINDS: DaoProposalKind[] = [
  "treasury_spend",
  "parameter_change",
  "skill_approve",
  "skill_version_approve",
  "dao_grant",
  "text",
];

const NAV: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "proposals", label: "Proposals" },
  { id: "treasury", label: "Treasury" },
  { id: "votes", label: "Votes" },
  { id: "delegation", label: "Delegation" },
  { id: "members", label: "Members" },
  { id: "agents", label: "Agent council" },
  { id: "receipts", label: "Receipts" },
  { id: "memory", label: "Memory" },
  { id: "settings", label: "Settings" },
];

export default function DaoDashboard() {
  const { walletAddress } = useSolanaWallet();
  const [demo, setDemo] = useState(true);
  const [data, setData] = useState<DaoCommandCenterPayload | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    proposalId: Date.now(),
    title: "Treasury buffer for claw-agent incidents",
    description: "Allocate SOL to a governed buffer; dual-sig treasurer release only.",
    kind: "treasury_spend" as DaoProposalKind,
    skillKey: "",
    recipient: "",
    amountLamports: 1_000_000_000,
  });

  const load = useCallback(async () => {
    const payload = await daoApi.getCommandCenter({
      demo,
      walletAddress: walletAddress ?? undefined,
    });
    setData(payload);
    setSelectedId(prev => prev ?? payload.activeProposalId ?? null);
  }, [demo, walletAddress]);

  useEffect(() => {
    load().catch((e: unknown) => setMessage(e instanceof Error ? e.message : String(e)));
  }, [load]);

  const selected = useMemo(() => {
    if (!data || !selectedId) return null;
    return data.proposals.find(p => p.id === selectedId) ?? null;
  }, [data, selectedId]);

  const recsForActive = useMemo(() => {
    if (!data || !selected) return [];
    return data.agentRecommendations.filter(r => r.proposalId === selected.id);
  }, [data, selected]);

  async function registerMe() {
    if (!walletAddress) {
      setMessage("Connect Solana wallet first.");
      return;
    }
    try {
      await daoApi.registerMember({
        wallet: walletAddress,
        delegate: walletAddress,
        stakeLamports: 1_000_000,
        reputationPoints: 42,
      });
      setMessage("Wallet registered as DAO member.");
      await load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function createProposal() {
    if (!walletAddress) {
      setMessage("Connect Solana wallet first.");
      return;
    }
    try {
      await daoApi.createProposal({
        proposer: walletAddress,
        proposalId: form.proposalId,
        title: form.title,
        description: form.description,
        kind: form.kind,
        skillKey: form.skillKey,
        recipient: form.recipient || walletAddress,
        amountLamports: form.amountLamports,
        startSlot: 0,
        endSlot: 0,
        quorumBps: data?.configSummary.quorumBps ?? 4000,
        approvalThresholdBps: data?.configSummary.thresholdBps ?? 5000,
      });
      setMessage("Proposal created with proposal receipt + agent council draft.");
      setForm(f => ({ ...f, proposalId: Date.now() }));
      await load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function vote(choice: "yes" | "no" | "abstain" | "veto") {
    if (!walletAddress || !selected) return;
    try {
      await daoApi.vote(Number(selected.id), {
        wallet: walletAddress,
        choice,
        reason: "CLAW governance vote",
      });
      setMessage(`Cast ${choice} on proposal ${selected.id}`);
      await load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function finalize() {
    if (!selected) return;
    try {
      await daoApi.finalize(Number(selected.id));
      setMessage(`Finalized proposal ${selected.id}`);
      await load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function execute() {
    if (!selected) return;
    try {
      await daoApi.execute(Number(selected.id));
      setMessage(`Executed proposal ${selected.id} — execution receipt queued.`);
      await load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  if (!data) {
    return <div className="dao-shell muted-line">Loading governance command center…</div>;
  }

  return (
    <section className="dao-shell">
      {data.demoMode ? (
        <div className="dao-cc-demo-banner">
          Demo governance story is ON — labels marked demo_only / simulated signatures illustrate the full agent economy
          cycle. Toggle off in Settings for live store only.
        </div>
      ) : null}

      <DaoStatusRail data={data} />

      {message ? <div className="info-box">{message}</div> : null}

      <div className="dao-cc-layout">
        <nav className="dao-cc-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              type="button"
              className={section === n.id ? "dao-cc-nav-active" : ""}
              onClick={() => setSection(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="dao-cc-main">
          {section === "overview" ? (
            <>
              <DaoGovernanceStage proposal={selected} recommendations={data.agentRecommendations} />
              <div className="dao-metrics" style={{ marginTop: 16 }}>
                <div className="metric-card">
                  <span>Members</span>
                  <strong>{data.members.length}</strong>
                </div>
                <div className="metric-card">
                  <span>Proposals</span>
                  <strong>{data.proposals.length}</strong>
                </div>
                <div className="metric-card">
                  <span>Delegation edges</span>
                  <strong>{data.delegations.filter(d => d.status === "active").length}</strong>
                </div>
                <div className="metric-card">
                  <span>Memory records</span>
                  <strong>{data.governanceMemory.length}</strong>
                </div>
              </div>
              <DaoTimeline stages={data.timeline} />
            </>
          ) : null}

          {section === "proposals" ? (
            <>
              <div className="dao-panel mb-4">
                <div className="dao-cc-panel-title">Create proposal (compact on-chain, narrative off-chain)</div>
                <div className="form-grid">
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Title"
                  />
                  <select
                    value={form.kind}
                    onChange={e => setForm(f => ({ ...f, kind: e.target.value as DaoProposalKind }))}
                  >
                    {KINDS.map(k => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short summary (long form via storage ref)"
                    className="span-2"
                  />
                  <input
                    value={form.recipient}
                    onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                    placeholder="Recipient wallet"
                  />
                  <input
                    type="number"
                    value={form.amountLamports || ""}
                    onChange={e => setForm(f => ({ ...f, amountLamports: Number(e.target.value) }))}
                    placeholder="Lamports"
                  />
                </div>
                <div className="dao-actions">
                  <button type="button" className="primary-btn" onClick={() => void registerMe()}>
                    Register wallet
                  </button>
                  <button type="button" className="primary-btn" onClick={() => void createProposal()}>
                    Publish proposal
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => void load()}>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="dao-cc-panel-title">All proposals</div>
              <DaoProposalList proposals={data.proposals} selectedId={selectedId} onSelect={setSelectedId} />
            </>
          ) : null}

          {section === "treasury" ? <DaoTreasuryPanel data={data} /> : null}

          {section === "votes" ? (
            <div className="dao-panel">
              <DaoVotePanel
                proposal={selected}
                walletConnected={Boolean(walletAddress)}
                effectiveWeight={data.effectiveVoteWeight}
                busy={busy}
                onVote={c => {
                  setBusy(true);
                  void vote(c).finally(() => setBusy(false));
                }}
              />
              <div className="dao-row-actions mt-3">
                <button type="button" className="ghost-btn" onClick={() => void finalize()} disabled={!selected}>
                  Finalize (quorum + threshold)
                </button>
                <button type="button" className="ghost-btn" onClick={() => void execute()} disabled={!selected}>
                  Execute (anchor receipt)
                </button>
              </div>
              <div className="dao-cc-panel-title mt-4">Recent vote ledger</div>
              <div className="stack-list">
                {data.votes.slice(0, 12).map(v => (
                  <div key={v.id} className="item-card">
                    <div className="item-top">
                      <span className="text-white text-sm">{v.choice}</span>
                      <span className="chip">w {v.weight}</span>
                    </div>
                    <div className="muted-line">proposal {v.proposalId}</div>
                    <div className="muted-line font-mono text-xs">{v.voterWallet}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {section === "delegation" ? (
            <DaoDelegationPanel
              data={data}
              walletAddress={walletAddress ?? null}
              onDelegate={async (to, reason) => {
                if (!walletAddress) return;
                await daoApi.delegate({ fromWallet: walletAddress, toWallet: to, reason });
                setMessage("Delegation updated.");
                await load();
              }}
              onRevoke={async () => {
                if (!walletAddress) return;
                await daoApi.revokeDelegation(walletAddress);
                setMessage("Delegation revoked.");
                await load();
              }}
            />
          ) : null}

          {section === "members" ? (
            <div className="stack-list">
              {data.members.map(m => (
                <div key={m.id} className="item-card">
                  <div className="item-top">
                    <strong className="text-white">{m.displayName ?? m.walletAddress.slice(0, 8)}</strong>
                    <span className="chip">{m.role}</span>
                  </div>
                  <div className="muted-line font-mono text-xs">{m.walletAddress}</div>
                  <div className="item-meta">
                    <span className="mini-pill">weight {m.weight}</span>
                    <span className="mini-pill">rep {m.reputationScore}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {section === "agents" ? (
            <div className="dao-panel">
              <DaoAgentCouncil items={recsForActive.length ? recsForActive : data.agentRecommendations} />
            </div>
          ) : null}

          {section === "receipts" ? <DaoReceiptExplorer data={data} /> : null}

          {section === "memory" ? (
            <div className="dao-panel">
              <DaoMemoryPanel items={data.governanceMemory} />
            </div>
          ) : null}

          {section === "settings" ? (
            <div className="dao-panel">
              <label className="flex items-center gap-2 text-sm text-white/90">
                <input type="checkbox" checked={demo} onChange={e => setDemo(e.target.checked)} />
                Include demo governance story (fixtures + demo_only labels)
              </label>
              <p className="muted-line mt-2">
                Live mode uses the server DAO store with Solana cluster from your backend. Wallet connection uses the
                adapter; session verification can be layered via `/api/session`.
              </p>
              <button type="button" className="primary-btn mt-3" onClick={() => void load()}>
                Apply & refresh
              </button>
            </div>
          ) : null}
        </div>

        <aside className="dao-cc-side">
          <DaoRightIdentityPanel data={data} walletAddress={walletAddress ?? null} />
          {section === "overview" || section === "proposals" ? (
            <div className="dao-panel">
              <div className="dao-cc-panel-title">Selected proposal</div>
              {selected ? (
                <>
                  <div className="text-white font-medium">{selected.title}</div>
                  <div className="muted-line text-sm mt-1">{selected.status}</div>
                </>
              ) : (
                <p className="muted-line">None</p>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

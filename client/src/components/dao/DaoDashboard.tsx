import { daoApi } from "@/dao/daoApi";
import type { DaoConfig, DaoDiscoveryRow, DaoMember, DaoProposal, DaoProposalKind } from "@/dao/daoTypes";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { useCallback, useEffect, useState } from "react";

const KINDS: DaoProposalKind[] = [
  "treasury_spend",
  "parameter_change",
  "skill_approve",
  "skill_version_approve",
  "dao_grant",
  "text",
];

export default function DaoDashboard() {
  const { walletAddress } = useSolanaWallet();
  const [config, setConfig] = useState<DaoConfig | null>(null);
  const [members, setMembers] = useState<DaoMember[]>([]);
  const [proposals, setProposals] = useState<DaoProposal[]>([]);
  const [discovery, setDiscovery] = useState<DaoDiscoveryRow[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    proposalId: Date.now(),
    title: "Approve CLAW skill registry policy",
    description: "Approve the next set of skill publishing rules for CLAW Machine.",
    kind: "parameter_change" as DaoProposalKind,
    skillKey: "",
    recipient: "",
    amountLamports: 0,
  });

  const loadAll = useCallback(async () => {
    const [c, m, p, d] = await Promise.all([
      daoApi.getConfig(),
      daoApi.getMembers(),
      daoApi.getProposals(),
      daoApi.getDiscovery(),
    ]);
    setConfig(c);
    setMembers(m);
    setProposals(p);
    setDiscovery(d);
  }, []);

  useEffect(() => {
    loadAll().catch((e: unknown) => setMessage(e instanceof Error ? e.message : String(e)));
  }, [loadAll]);

  async function registerMe() {
    if (!walletAddress) {
      setMessage("Connect Solana wallet first.");
      return;
    }
    try {
      const data = await daoApi.registerMember({
        wallet: walletAddress,
        delegate: walletAddress,
        stakeLamports: 1_000_000,
        reputationPoints: 12,
      });
      setMessage(`Member registered: ${data.wallet}`);
      await loadAll();
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
      const proposalId = form.proposalId;
      const data = await daoApi.createProposal({
        proposer: walletAddress,
        proposalId,
        title: form.title,
        description: form.description,
        kind: form.kind,
        skillKey: form.skillKey,
        recipient: form.recipient || walletAddress,
        amountLamports: form.amountLamports,
        startSlot: 0,
        endSlot: 0,
        quorumBps: config?.quorumBps ?? 4000,
        approvalThresholdBps: config?.proposalThresholdBps ?? 5000,
      });
      setMessage(`Proposal created: ${data.title}`);
      setForm(f => ({ ...f, proposalId: Date.now() }));
      await loadAll();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function vote(proposalId: number, choice: "yes" | "no" | "abstain") {
    if (!walletAddress) {
      setMessage("Connect Solana wallet first.");
      return;
    }
    try {
      await daoApi.vote(proposalId, {
        wallet: walletAddress,
        choice,
        reason: "Support CLAW governance",
      });
      setMessage(`Voted ${choice} on proposal ${proposalId}`);
      await loadAll();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function finalize(proposalId: number) {
    try {
      await daoApi.finalize(proposalId);
      setMessage(`Finalized proposal ${proposalId}`);
      await loadAll();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function execute(proposalId: number) {
    try {
      await daoApi.execute(proposalId);
      setMessage(`Executed proposal ${proposalId}`);
      await loadAll();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="dao-shell">
      <div className="dao-head">
        <div>
          <div className="eyebrow">CLAW DAO</div>
          <h2 className="text-xl font-semibold text-white">Governance for CLAW Machine</h2>
          <p className="text-slate-400">Members vote on skills, treasury actions, and framework policies.</p>
        </div>
        <div className="chip">
          {walletAddress
            ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
            : "No wallet"}
        </div>
      </div>

      {message ? <div className="info-box">{message}</div> : null}

      <div className="dao-metrics">
        <div className="metric-card">
          <span>Members</span>
          <strong>{config?.totalMembers ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Proposals</span>
          <strong>{config?.totalProposals ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Votes</span>
          <strong>{config?.totalVotes ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Executed</span>
          <strong>{config?.totalExecuted ?? 0}</strong>
        </div>
      </div>

      <div className="dao-actions">
        <button type="button" className="primary-btn" onClick={() => void registerMe()}>
          Register as member
        </button>
        <button type="button" className="ghost-btn" onClick={() => void loadAll()}>
          Refresh
        </button>
      </div>

      <div className="dao-grid">
        <div className="dao-panel">
          <h3 className="text-lg font-medium text-white">Create proposal</h3>
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
              rows={4}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              className="span-2"
            />
            <input
              value={form.skillKey}
              onChange={e => setForm(f => ({ ...f, skillKey: e.target.value }))}
              placeholder="Skill key"
              className="span-2"
            />
            <input
              value={form.recipient}
              onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
              placeholder="Recipient wallet"
            />
            <input
              value={form.amountLamports || ""}
              onChange={e => setForm(f => ({ ...f, amountLamports: Number(e.target.value) }))}
              placeholder="Amount lamports"
              type="number"
            />
          </div>
          <button type="button" className="primary-btn" onClick={() => void createProposal()}>
            Create
          </button>
        </div>

        <div className="dao-panel">
          <h3 className="text-lg font-medium text-white">DAO members</h3>
          <div className="stack-list">
            {members.map(m => (
              <div className="item-card" key={m.wallet}>
                <div className="item-top">
                  <strong className="text-white">
                    {m.wallet.slice(0, 4)}…{m.wallet.slice(-4)}
                  </strong>
                  <span className="chip">{m.active ? "active" : "inactive"}</span>
                </div>
                <div className="muted-line">Power {m.votingPower}</div>
                <div className="muted-line">Stake {m.stakeLamports}</div>
                <div className="muted-line">
                  Delegate {m.delegate.slice(0, 4)}…{m.delegate.slice(-4)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dao-panel">
          <h3 className="text-lg font-medium text-white">Proposals</h3>
          <div className="stack-list">
            {proposals.map(p => (
              <div className="item-card" key={p.proposalId}>
                <div className="item-top">
                  <strong className="text-white">{p.title}</strong>
                  <span className="chip">{p.status}</span>
                </div>
                <div className="muted-line">{p.kind}</div>
                <div className="muted-line">{p.description}</div>
                <div className="item-meta">
                  <span className="mini-pill">yes {p.yesVotes}</span>
                  <span className="mini-pill">no {p.noVotes}</span>
                  <span className="mini-pill">abstain {p.abstainVotes}</span>
                  <span className="mini-pill">total {p.totalVotes}</span>
                </div>
                <div className="dao-row-actions">
                  <button type="button" className="ghost-btn" onClick={() => void vote(p.proposalId, "yes")}>
                    Yes
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => void vote(p.proposalId, "no")}>
                    No
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => void vote(p.proposalId, "abstain")}
                  >
                    Abstain
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => void finalize(p.proposalId)}>
                    Finalize
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => void execute(p.proposalId)}>
                    Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dao-panel">
          <h3 className="text-lg font-medium text-white">Discovery surface</h3>
          <div className="stack-list">
            {discovery.map(d => (
              <div className="item-card" key={d.proposalId}>
                <div className="item-top">
                  <strong className="text-white">{d.title}</strong>
                  <span className="chip">{(d.rankScoreBps / 100).toFixed(1)}%</span>
                </div>
                <div className="muted-line">{d.kind}</div>
                <div className="muted-line">Status: {d.status}</div>
                <div className="item-meta">
                  <span className="mini-pill">yes {d.yesVotes}</span>
                  <span className="mini-pill">no {d.noVotes}</span>
                  <span className="mini-pill">votes {d.totalVotes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

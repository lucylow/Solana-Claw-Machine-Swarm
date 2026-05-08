import type { DaoProposal } from "@shared/dao/types";
import DaoAgentCouncil from "./DaoAgentCouncil";

export default function DaoGovernanceStage({
  proposal,
  recommendations,
}: {
  proposal: DaoProposal | null;
  recommendations: import("@shared/dao/types").DaoAgentRecommendation[];
}) {
  if (!proposal) {
    return (
      <div className="dao-panel">
        <div className="dao-cc-panel-title">Council room</div>
        <p className="muted-line">Select a proposal to see quorum progress, treasury impact, and agent analysis.</p>
      </div>
    );
  }

  const qPct = proposal.quorumRequired > 0 ? Math.min(100, (proposal.quorumReached / proposal.quorumRequired) * 100) : 0;
  const voted = proposal.voteYes + proposal.voteNo + proposal.voteVeto;
  const appr = voted > 0 ? proposal.voteYes / (proposal.voteYes + proposal.voteNo + proposal.voteVeto) : 0;
  const th = proposal.thresholdRequired;

  return (
    <div className="dao-panel">
      <div className="dao-cc-panel-title">Live council room</div>
      <h3 className="text-lg font-semibold text-white mb-1">{proposal.title}</h3>
      <div className="item-meta mb-2">
        <span className="mini-pill">{proposal.status}</span>
        <span className="mini-pill">{proposal.proposalType.replace(/_/g, " ")}</span>
        <span className="mini-pill">policy {proposal.policyLevel}</span>
      </div>
      <p className="muted-line">{proposal.summary}</p>

      <div className="dao-cc-split mt-3">
        <div className="item-card">
          <div className="muted-line mb-1">Quorum progress</div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#3bff96] to-[#38d7d0]" style={{ width: `${Math.min(100, qPct)}%` }} />
          </div>
          <div className="muted-line mt-1 text-xs">
            {proposal.quorumReached} / {proposal.quorumRequired} bps voter participation
          </div>
        </div>
        <div className="item-card">
          <div className="muted-line mb-1">Approval vs threshold</div>
          <div className="text-white font-medium">{(appr * 100).toFixed(1)}% yes / (yes+no+veto)</div>
          <div className="muted-line text-xs">needs ≥ {(th * 100).toFixed(1)}%</div>
        </div>
      </div>

      {proposal.treasuryImpact?.amount != null ? (
        <div className="item-card mt-3">
          <div className="dao-cc-panel-title">Treasury impact</div>
          <div className="muted-line">
            {(proposal.treasuryImpact.amount / 1e9).toFixed(4)} SOL · {proposal.treasuryImpact.budgetCategory}
          </div>
          {proposal.treasuryImpact.destination ? (
            <div className="muted-line font-mono text-xs">{proposal.treasuryImpact.destination}</div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="dao-cc-panel-title">Agent council (assistive, not authoritative)</div>
        <DaoAgentCouncil items={recommendations.filter(r => r.proposalId === proposal.id)} />
      </div>

      <div className="mt-3">
        <div className="dao-cc-panel-title">Discussion & long-form (off-chain)</div>
        <div className="muted-line text-sm">
          storage ref: {proposal.offchain?.storageRef ?? "—"} · checksum {proposal.offchain?.checksum ?? "—"}
        </div>
      </div>
    </div>
  );
}

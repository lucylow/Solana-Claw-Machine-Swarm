import type { DaoProposal } from "@shared/dao/types";
import { Link } from "wouter";

export default function DaoProposalList({
  proposals,
  selectedId,
  onSelect,
}: {
  proposals: DaoProposal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="stack-list">
      {proposals.map(p => (
        <div
          key={p.id}
          className="item-card"
          style={{
            outline: selectedId === p.id ? "1px solid rgba(59,255,150,0.45)" : undefined,
          }}
        >
          <div className="item-top">
            <button
              type="button"
              className="text-left font-semibold text-white"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onClick={() => onSelect(p.id)}
            >
              {p.title}
            </button>
            <span className="chip">{p.status}</span>
          </div>
          <div className="muted-line">{p.proposalType.replace(/_/g, " ")}</div>
          <div className="item-meta">
            <span className="mini-pill">quorum {p.quorumReached}/{p.quorumRequired} bps</span>
            <span className="mini-pill">yes {p.voteYes}</span>
            <span className="mini-pill">no {p.voteNo}</span>
            <span className="mini-pill">veto {p.voteVeto}</span>
            <span className="mini-pill">{p.proofStatus}</span>
          </div>
          <div className="dao-row-actions" style={{ marginTop: 8 }}>
            <Link href={`/dao/proposals/${p.id}`} className="ghost-btn">
              Open detail
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

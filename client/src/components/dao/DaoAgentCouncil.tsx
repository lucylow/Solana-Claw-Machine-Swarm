import type { DaoAgentRecommendation } from "@shared/dao/types";

export default function DaoAgentCouncil({ items }: { items: DaoAgentRecommendation[] }) {
  if (!items.length) {
    return <p className="muted-line">No agent recommendations for this view.</p>;
  }
  return (
    <div className="stack-list">
      {items.map(a => (
        <div key={a.id} className="item-card">
          <div className="item-top">
            <strong className="text-white">{a.agentName}</strong>
            <span className="chip">{a.role.replace(/_/g, " ")}</span>
          </div>
          <div className="muted-line">{a.summary}</div>
          <div className="muted-line mt-1">{a.recommendation}</div>
          <div className="item-meta">
            <span className="mini-pill">confidence {(a.confidence * 100).toFixed(0)}%</span>
            <span className="mini-pill">human: {a.humanDisposition ?? "pending"}</span>
            <span className="mini-pill">{a.status}</span>
          </div>
          {a.risks.length ? (
            <div className="muted-line mt-1">Risks: {a.risks.join("; ")}</div>
          ) : null}
          {a.storageRef ? <div className="muted-line">off-chain {a.storageRef}</div> : null}
        </div>
      ))}
    </div>
  );
}

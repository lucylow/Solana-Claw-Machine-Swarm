import type { DaoTimelineStage } from "@shared/dao/types";

export default function DaoTimeline({
  stages,
}: {
  stages: DaoTimelineStage[];
}) {
  return (
    <div className="dao-panel">
      <div className="dao-cc-panel-title">Governance timeline</div>
      <div className="stack-list">
        {stages.map((s) => (
          <div key={s.id} className="item-card">
            <div className="item-top">
              <strong className="text-white">{s.label}</strong>
              <span className="chip">{s.done ? "done" : "open"}</span>
            </div>
            <div className="muted-line">
              {s.artifact === "chain"
                ? "Anchored / Solana-verifiable path"
                : s.artifact === "receipt"
                  ? "Proposal receipt · compact proof"
                  : "Off-chain deliberation / 0G-capable storage"}
            </div>
            {s.at ? (
              <div className="muted-line">
                {new Date(s.at).toLocaleString()}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { DaoGovernanceMemoryRecord } from "@shared/dao/types";

export default function DaoMemoryPanel({ items }: { items: DaoGovernanceMemoryRecord[] }) {
  if (!items.length) return <p className="muted-line">Governance memory will appear after finalize / execute cycles.</p>;
  return (
    <div className="stack-list">
      {items.map(m => (
        <div key={m.id} className="item-card">
          <div className="item-top">
            <strong className="text-white">{m.title}</strong>
            <span className="chip">{m.outcome}</span>
          </div>
          <div className="muted-line">proposal {m.proposalId}</div>
          <div className="muted-line mt-1">{m.lesson}</div>
          {m.linkedReceiptIds.length ? (
            <div className="muted-line">receipts: {m.linkedReceiptIds.join(", ")}</div>
          ) : null}
          {m.storageRef ? <div className="muted-line">off-chain {m.storageRef}</div> : null}
        </div>
      ))}
    </div>
  );
}

import type { DaoCommandCenterPayload } from "@shared/dao/types";

export default function DaoReceiptExplorer({
  data,
}: {
  data: DaoCommandCenterPayload;
}) {
  const props = data.proposals.filter(
    (p) => p.proposalReceiptId || p.executionTxSignature,
  );
  return (
    <div>
      <div className="dao-cc-panel-title">
        Receipts & proof · explorer-verifiable
      </div>
      <div className="stack-list">
        {data.executionReceipts.map((r) => (
          <div key={r.id} className="item-card">
            <div className="item-top">
              <strong className="text-white">{r.title}</strong>
              <span className="chip">{r.proofStatus}</span>
            </div>
            <div className="muted-line">{r.summary}</div>
            {r.txSignature ? (
              <a
                className="muted-line block mt-1 text-[#87f7d0] underline"
                href={r.explorerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Transaction · Solana Explorer
              </a>
            ) : null}
            {r.storageRef ? (
              <div className="muted-line">off-chain {r.storageRef}</div>
            ) : null}
          </div>
        ))}
        {props.map((p) => (
          <div key={p.id} className="item-card">
            <div className="item-top">
              <strong className="text-white">
                Proposal receipt · {p.title.slice(0, 40)}
              </strong>
              <span className="chip">{p.proofStatus}</span>
            </div>
            {p.proposalReceiptId ? (
              <div className="muted-line">id {p.proposalReceiptId}</div>
            ) : null}
            {p.onchain?.txSignature ? (
              <div className="muted-line">
                create tx {p.onchain.txSignature.slice(0, 24)}…
              </div>
            ) : null}
            {p.onchain?.pda ? (
              <div className="muted-line">PDA {p.onchain.pda}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

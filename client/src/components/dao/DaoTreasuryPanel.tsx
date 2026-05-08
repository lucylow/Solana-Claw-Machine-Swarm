import type { DaoCommandCenterPayload } from "@shared/dao/types";

export default function DaoTreasuryPanel({ data }: { data: DaoCommandCenterPayload }) {
  const t = data.treasury;
  if (!t) {
    return <p className="muted-line">Treasury snapshot not available yet.</p>;
  }
  return (
    <div>
      <div className="dao-cc-panel-title">Treasury · governance instrument</div>
      <div className="item-card">
        <div className="item-top">
          <strong className="text-white">{t.totalBalanceSol} SOL</strong>
          <span className="chip">{t.status}</span>
        </div>
        <div className="muted-line">vault / account {t.walletAddress.slice(0, 8)}…</div>
        <div className="muted-line">cluster {t.cluster}</div>
        {t.pda ? <div className="muted-line">treasury PDA {t.pda}</div> : null}
        {t.proofReceiptId ? <div className="muted-line">snapshot receipt {t.proofReceiptId}</div> : null}
        <div className="muted-line mt-2">Token balances</div>
        <div className="item-meta">
          {t.tokenBalances.map(tb => (
            <span key={tb.mint} className="mini-pill">
              {tb.symbol || tb.mint.slice(0, 4)} · {tb.balance}
            </span>
          ))}
        </div>
      </div>
      <p className="muted-line mt-2">
        Large allocations show policy warnings in proposals. Long narratives stay off-chain; Solana holds compact proof.
      </p>
    </div>
  );
}

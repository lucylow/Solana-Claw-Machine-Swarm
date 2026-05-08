import type { DaoCommandCenterPayload } from "@shared/dao/types";
import { useState } from "react";

export default function DaoDelegationPanel({
  data,
  walletAddress,
  onDelegate,
  onRevoke,
}: {
  data: DaoCommandCenterPayload;
  walletAddress: string | null;
  onDelegate: (to: string, reason: string) => Promise<void>;
  onRevoke: () => Promise<void>;
}) {
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <div className="dao-cc-panel-title">Delegation · Solana wallets</div>
      <p className="muted-line mb-2">
        Delegating transfers your voting power snapshot to a representative. You cannot vote while an active delegation
        is outbound.
      </p>
      <div className="stack-list">
        {data.delegations.map(d => (
          <div key={d.id} className="item-card">
            <div className="item-top">
              <span className="text-white text-sm">
                {d.fromWallet.slice(0, 4)}… → {d.toWallet.slice(0, 4)}…
              </span>
              <span className="chip">{d.status}</span>
            </div>
            <div className="muted-line">weight {d.weight}</div>
            {d.proofReceiptId ? <div className="muted-line">receipt {d.proofReceiptId}</div> : null}
            {d.pda ? <div className="muted-line">delegate PDA {d.pda.slice(0, 12)}…</div> : null}
          </div>
        ))}
      </div>
      {walletAddress ? (
        <div className="form-grid" style={{ marginTop: 12 }}>
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="Delegate to wallet address"
            className="span-2"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
            }}
          />
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="span-2"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
            }}
          />
          <button
            type="button"
            className="primary-btn"
            disabled={busy || to.length < 32}
            onClick={() => {
              setBusy(true);
              void onDelegate(to, reason).finally(() => setBusy(false));
            }}
          >
            Delegate vote power
          </button>
          <button
            type="button"
            className="ghost-btn"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onRevoke().finally(() => setBusy(false));
            }}
          >
            Revoke my delegation
          </button>
        </div>
      ) : (
        <p className="muted-line mt-2">Connect wallet to delegate.</p>
      )}
    </div>
  );
}

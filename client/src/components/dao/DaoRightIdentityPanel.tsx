import type { DaoCommandCenterPayload } from "@shared/dao/types";

export default function DaoRightIdentityPanel({
  data,
  walletAddress,
}: {
  data: DaoCommandCenterPayload;
  walletAddress: string | null;
}) {
  const m = data.member;
  return (
    <div className="dao-panel">
      <div className="dao-cc-panel-title">Wallet identity</div>
      {walletAddress ? (
        <>
          <div className="muted-line font-mono text-sm text-white/90">
            {walletAddress}
          </div>
          {m ? (
            <>
              <div className="item-meta" style={{ marginTop: 8 }}>
                <span className="mini-pill">role {m.role}</span>
                <span className="mini-pill">weight {m.weight}</span>
                <span className="mini-pill">rep {m.reputationScore}</span>
              </div>
              <div className="muted-line mt-2">Permissions</div>
              <div className="muted-line">
                vote {m.permissions.canVote ? "yes" : "no"} · propose{" "}
                {m.permissions.canPropose ? "yes" : "no"} · execute{" "}
                {m.permissions.canExecute ? "yes" : "no"}
              </div>
            </>
          ) : (
            <p className="muted-line mt-2">
              Wallet not registered as DAO member yet.
            </p>
          )}
          <div className="muted-line mt-3">
            Effective voting power (delegation-aware)
          </div>
          <div className="text-lg font-semibold text-[#b8ffe0]">
            {data.effectiveVoteWeight}
          </div>
        </>
      ) : (
        <p className="muted-line">
          Connect wallet to bind session to a Solana identity.
        </p>
      )}
      <div className="muted-line mt-4">Last receipts</div>
      <div className="muted-line text-xs">
        {data.executionReceipts[0]?.id ?? "—"} ·{" "}
        {data.executionReceipts[0]?.proofStatus ?? ""}
      </div>
      <a
        className="muted-line text-[#87f7d0] underline text-sm mt-2 block"
        href={`${data.explorerBaseUrl}?cluster=${data.cluster}`}
        target="_blank"
        rel="noreferrer"
      >
        Open Solana Explorer ({data.cluster})
      </a>
    </div>
  );
}

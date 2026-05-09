import type { DaoCommandCenterPayload } from "@shared/dao/types";

export default function DaoStatusRail({
  data,
}: {
  data: DaoCommandCenterPayload;
}) {
  const stage =
    data.activeProposalId != null
      ? `Active proposal · ${data.activeProposalId}`
      : "Awaiting next proposal";

  return (
    <div className="dao-cc-toprail">
      <div className="dao-cc-stat">
        <span>Cluster</span>
        <strong>{data.cluster}</strong>
      </div>
      <div className="dao-cc-stat">
        <span>Program</span>
        <strong title={data.programId}>
          {data.programId ? `${data.programId.slice(0, 6)}…` : "—"}
        </strong>
      </div>
      <div className="dao-cc-stat">
        <span>Quorum</span>
        <strong>
          {(data.configSummary.quorumBps / 100).toFixed(1)}% participation
        </strong>
      </div>
      <div className="dao-cc-stat">
        <span>Threshold</span>
        <strong>
          {(data.configSummary.thresholdBps / 100).toFixed(1)}% yes /
          (yes+no+veto)
        </strong>
      </div>
      <div className="dao-cc-stat">
        <span>Treasury PDA</span>
        <strong>
          {data.treasury?.pda
            ? `${data.treasury.pda.slice(0, 8)}…`
            : "Snapshot pending"}
        </strong>
      </div>
      <div className="dao-cc-stat">
        <span>Governance stage</span>
        <strong>{stage}</strong>
      </div>
    </div>
  );
}

import type { DaoProposal } from "@shared/dao/types";

export default function DaoVotePanel({
  proposal,
  walletConnected,
  effectiveWeight,
  onVote,
  busy,
}: {
  proposal: DaoProposal | null;
  walletConnected: boolean;
  effectiveWeight: number;
  onVote: (choice: "yes" | "no" | "abstain" | "veto") => void;
  busy: boolean;
}) {
  if (!proposal) {
    return <p className="muted-line">Select a proposal to vote.</p>;
  }
  const open = proposal.status === "voting" || proposal.status === "quorum_reached";

  return (
    <div>
      <div className="dao-cc-panel-title">Vote · wallet-weighted</div>
      {!walletConnected ? (
        <p className="muted-line">Connect a Solana wallet to vote. Identity is the wallet — not localStorage.</p>
      ) : effectiveWeight <= 0 ? (
        <p className="muted-line">
          No effective voting power (delegate inactive, or all power delegated away). Revoke delegation or receive
          delegation to vote.
        </p>
      ) : !open ? (
        <p className="muted-line">Voting closed for status {proposal.status}.</p>
      ) : (
        <p className="muted-line">Your effective weight: {effectiveWeight}</p>
      )}
      <div className="dao-row-actions" style={{ marginTop: 10 }}>
        {(["yes", "no", "abstain", "veto"] as const).map(c => (
          <button
            key={c}
            type="button"
            className="ghost-btn"
            disabled={!open || !walletConnected || effectiveWeight <= 0 || busy}
            onClick={() => onVote(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

use anchor_lang::prelude::*;

#[error_code]
pub enum ClawDaoError {
    #[msg("The provided string is too long.")]
    StringTooLong,

    #[msg("The DAO is paused.")]
    DaoPaused,

    #[msg("The caller is not authorized.")]
    Unauthorized,

    #[msg("The proposal is not active.")]
    ProposalNotActive,

    #[msg("The proposal has ended.")]
    ProposalEnded,

    #[msg("The proposal is not ready to finalize.")]
    ProposalNotReady,

    #[msg("The proposal has already been executed.")]
    ProposalAlreadyExecuted,

    #[msg("The proposal has not passed.")]
    ProposalNotPassed,

    #[msg("The member is not registered.")]
    MemberNotRegistered,

    #[msg("The member has already voted.")]
    MemberAlreadyVoted,

    #[msg("Voting power is zero.")]
    ZeroVotingPower,

    #[msg("Math overflow.")]
    MathOverflow,

    #[msg("Invalid quorum or threshold.")]
    InvalidThreshold,

    #[msg("Invalid proposal kind.")]
    InvalidProposalKind,

    #[msg("Treasury transfer failed.")]
    TreasuryTransferFailed,
}

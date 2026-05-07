use anchor_lang::prelude::*;

#[event]
pub struct DaoInitialized {
    pub dao: Pubkey,
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub name: String,
    pub symbol: String,
    pub timestamp: i64,
}

#[event]
pub struct DaoUpdated {
    pub dao: Pubkey,
    pub authority: Pubkey,
    pub quorum_bps: u16,
    pub proposal_threshold_bps: u16,
    pub paused: bool,
    pub timestamp: i64,
}

#[event]
pub struct MemberRegistered {
    pub dao: Pubkey,
    pub member: Pubkey,
    pub delegate: Pubkey,
    pub stake_lamports: u64,
    pub voting_power: u64,
    pub timestamp: i64,
}

#[event]
pub struct MemberUpdated {
    pub dao: Pubkey,
    pub member: Pubkey,
    pub delegate: Pubkey,
    pub stake_lamports: u64,
    pub voting_power: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalCreated {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub proposer: Pubkey,
    pub proposal_kind: u8,
    pub title: String,
    pub timestamp: i64,
}

#[event]
pub struct VoteCast {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub delegate: Pubkey,
    pub choice: u8,
    pub weight: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalFinalized {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub passed: bool,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub abstain_votes: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalExecuted {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub executor: Pubkey,
    pub success: bool,
    pub result_hash: String,
    pub timestamp: i64,
}

#[event]
pub struct TreasurySpendExecuted {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct SkillApproved {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub skill_key: String,
    pub approved_by: Pubkey,
    pub timestamp: i64,
}

use anchor_lang::prelude::*;

pub const NAME_MAX: usize = 64;
pub const SYMBOL_MAX: usize = 16;
pub const URI_MAX: usize = 200;
pub const TITLE_MAX: usize = 96;
pub const DESC_MAX: usize = 512;
pub const HASH_MAX: usize = 128;
pub const NOTE_MAX: usize = 256;
pub const TAGS_MAX: usize = 256;
pub const KIND_MAX: usize = 32;
pub const REASON_MAX: usize = 160;
pub const KEY_MAX: usize = 160;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalKind {
    TreasurySpend,
    ParameterChange,
    SkillApprove,
    SkillVersionApprove,
    DAOGrant,
    Text,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Draft,
    Active,
    Succeeded,
    Defeated,
    Cancelled,
    Executed,
}

#[account]
pub struct DaoConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub chain_id: u64,
    pub paused: bool,
    pub quorum_bps: u16,
    pub proposal_threshold_bps: u16,
    pub vote_duration_slots: u64,
    pub min_stake_lamports: u64,
    pub total_members: u64,
    pub total_proposals: u64,
    pub total_votes: u64,
    pub total_executed: u64,
    pub total_treasury_spend: u64,
    pub bump: u8,
    pub created_at: i64,
    pub updated_at: i64,
}

impl DaoConfig {
    pub fn space() -> usize {
        8 + 32 + 32
            + (4 + NAME_MAX)
            + (4 + SYMBOL_MAX)
            + (4 + URI_MAX)
            + 8 + 1 + 2 + 2 + 8 + 8
            + 8 + 8 + 8 + 8 + 8
            + 1 + 8 + 8
    }
}

#[account]
pub struct DaoMember {
    pub dao: Pubkey,
    pub wallet: Pubkey,
    pub delegate: Pubkey,
    pub stake_lamports: u64,
    pub voting_power: u64,
    pub reputation_points: u64,
    pub proposals_created: u64,
    pub votes_cast: u64,
    pub active: bool,
    pub joined_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl DaoMember {
    pub fn space() -> usize {
        8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8 + 1
    }
}

#[account]
pub struct DaoProposal {
    pub dao: Pubkey,
    pub proposer: Pubkey,
    pub proposal_id: u64,
    pub kind: ProposalKind,
    pub status: ProposalStatus,
    pub title: String,
    pub description: String,
    pub skill_key: String,
    pub target_program: Pubkey,
    pub target_account: Pubkey,
    pub recipient: Pubkey,
    pub amount_lamports: u64,
    pub start_slot: u64,
    pub end_slot: u64,
    pub quorum_bps: u16,
    pub approval_threshold_bps: u16,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub abstain_votes: u64,
    pub total_votes: u64,
    pub voter_count: u64,
    pub execution_hash: String,
    pub result_hash: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub executed_at: i64,
    pub cancelled_at: i64,
    pub bump: u8,
}

impl DaoProposal {
    pub fn space() -> usize {
        8 + 32 + 32 + 8 + 1 + 1
            + (4 + TITLE_MAX)
            + (4 + DESC_MAX)
            + (4 + KEY_MAX)
            + 32 + 32 + 32
            + 8
            + 8 + 8
            + 2 + 2
            + 8 + 8 + 8 + 8 + 8
            + (4 + HASH_MAX)
            + (4 + HASH_MAX)
            + 8 + 8 + 8 + 8
            + 1
    }
}

#[account]
pub struct DaoVoteRecord {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub delegate: Pubkey,
    pub choice: VoteChoice,
    pub weight: u64,
    pub reason: String,
    pub created_at: i64,
    pub bump: u8,
}

impl DaoVoteRecord {
    pub fn space() -> usize {
        8 + 32 + 32 + 32 + 32 + 1 + 8 + (4 + REASON_MAX) + 8 + 1
    }
}

#[account]
pub struct DaoExecutionRecord {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub executor: Pubkey,
    pub success: bool,
    pub result_hash: String,
    pub tx_sig: String,
    pub notes: String,
    pub created_at: i64,
    pub bump: u8,
}

impl DaoExecutionRecord {
    pub fn space() -> usize {
        8 + 32 + 32 + 32 + 1 + (4 + HASH_MAX) + (4 + HASH_MAX) + (4 + NOTE_MAX) + 8 + 1
    }
}

#[account]
pub struct DaoTreasury {
    pub dao: Pubkey,
    pub authority: Pubkey,
    pub vault_bump: u8,
    pub spend_limit_lamports: u64,
    pub total_deposits: u64,
    pub total_spent: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

impl DaoTreasury {
    pub fn space() -> usize {
        8 + 32 + 32 + 1 + 8 + 8 + 8 + 8 + 8
    }
}

#[account]
pub struct DaoDiscoveryRow {
    pub dao: Pubkey,
    pub proposal: Pubkey,
    pub proposal_id: u64,
    pub kind: ProposalKind,
    pub title: String,
    pub status: ProposalStatus,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub abstain_votes: u64,
    pub total_votes: u64,
    pub quorum_bps: u16,
    pub approval_threshold_bps: u16,
    pub rank_score_bps: u16,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl DaoDiscoveryRow {
    pub fn space() -> usize {
        8 + 32 + 32 + 8 + 1 + (4 + TITLE_MAX) + 1
            + 8 + 8 + 8 + 8 + 2 + 2 + 2 + 8 + 8 + 1
    }
}

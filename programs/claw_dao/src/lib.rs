use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("ClAwDAo111111111111111111111111111111111111");

#[program]
pub mod claw_dao {
    use super::*;

    pub fn initialize_dao(
        ctx: Context<InitializeDao>,
        name: String,
        symbol: String,
        uri: String,
        chain_id: u64,
        quorum_bps: u16,
        proposal_threshold_bps: u16,
        vote_duration_slots: u64,
        min_stake_lamports: u64,
        spend_limit_lamports: u64,
    ) -> Result<()> {
        initialize_dao::handler(
            ctx,
            name,
            symbol,
            uri,
            chain_id,
            quorum_bps,
            proposal_threshold_bps,
            vote_duration_slots,
            min_stake_lamports,
            spend_limit_lamports,
        )
    }

    pub fn update_dao(
        ctx: Context<UpdateDao>,
        name: Option<String>,
        symbol: Option<String>,
        uri: Option<String>,
        paused: Option<bool>,
        quorum_bps: Option<u16>,
        proposal_threshold_bps: Option<u16>,
        vote_duration_slots: Option<u64>,
        min_stake_lamports: Option<u64>,
    ) -> Result<()> {
        update_dao::handler(
            ctx,
            name,
            symbol,
            uri,
            paused,
            quorum_bps,
            proposal_threshold_bps,
            vote_duration_slots,
            min_stake_lamports,
        )
    }

    pub fn register_member(
        ctx: Context<RegisterMember>,
        delegate: Pubkey,
        stake_lamports: u64,
        reputation_points: u64,
    ) -> Result<()> {
        register_member::handler(ctx, delegate, stake_lamports, reputation_points)
    }

    pub fn update_member(
        ctx: Context<UpdateMember>,
        delegate: Option<Pubkey>,
        stake_lamports: Option<u64>,
        reputation_points: Option<u64>,
        active: Option<bool>,
    ) -> Result<()> {
        update_member::handler(ctx, delegate, stake_lamports, reputation_points, active)
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title: String,
        description: String,
        kind: state::ProposalKind,
        skill_key: String,
        recipient: Pubkey,
        amount_lamports: u64,
        target_program: Pubkey,
        target_account: Pubkey,
        vote_duration_slots: u64,
    ) -> Result<()> {
        create_proposal::handler(
            ctx,
            proposal_id,
            title,
            description,
            kind,
            skill_key,
            recipient,
            amount_lamports,
            target_program,
            target_account,
            vote_duration_slots,
        )
    }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        choice: state::VoteChoice,
        reason: String,
    ) -> Result<()> {
        cast_vote::handler(ctx, choice, reason)
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        finalize_proposal::handler(ctx)
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        execute_proposal::handler(ctx)
    }

    pub fn deposit_treasury(ctx: Context<DepositTreasury>, amount_lamports: u64) -> Result<()> {
        deposit_treasury::handler(ctx, amount_lamports)
    }

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>) -> Result<()> {
        withdraw_treasury::handler(ctx)
    }

    pub fn refresh_discovery(ctx: Context<RefreshDiscovery>) -> Result<()> {
        refresh_discovery::handler(ctx)
    }
}

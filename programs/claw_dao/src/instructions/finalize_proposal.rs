use crate::{
    events::ProposalFinalized,
    state::{DaoConfig, DaoProposal, ProposalStatus},
    utils::{bps_from_ratio, now_ts},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        mut,
        seeds = [b"dao-proposal", dao.key().as_ref(), proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, DaoProposal>,
}

pub fn handler(ctx: Context<FinalizeProposal>) -> Result<()> {
    let now = now_ts()?;
    let dao = &ctx.accounts.dao;
    let proposal = &mut ctx.accounts.proposal;

    require!(
        proposal.status == ProposalStatus::Active,
        crate::errors::ClawDaoError::ProposalNotActive
    );
    require!(
        Clock::get()?.slot > proposal.end_slot,
        crate::errors::ClawDaoError::ProposalNotReady
    );

    let participation_bps = bps_from_ratio(proposal.voter_count, dao.total_members.max(1));
    let quorum_reached = participation_bps >= dao.quorum_bps;

    let yes_ratio = bps_from_ratio(
        proposal.yes_votes,
        (proposal.yes_votes + proposal.no_votes).max(1),
    );
    let passed = quorum_reached && yes_ratio >= proposal.approval_threshold_bps;

    proposal.status = if passed {
        ProposalStatus::Succeeded
    } else {
        ProposalStatus::Defeated
    };
    proposal.updated_at = now;

    emit!(ProposalFinalized {
        dao: ctx.accounts.dao.key(),
        proposal: ctx.accounts.proposal.key(),
        passed,
        yes_votes: proposal.yes_votes,
        no_votes: proposal.no_votes,
        abstain_votes: proposal.abstain_votes,
        timestamp: now,
    });

    Ok(())
}

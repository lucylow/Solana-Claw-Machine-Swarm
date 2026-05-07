use crate::{
    state::{DaoConfig, DaoDiscoveryRow, DaoProposal},
    utils::{compute_rank_score, now_ts},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RefreshDiscovery<'info> {
    #[account(seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        mut,
        seeds = [b"dao-proposal", dao.key().as_ref(), proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, DaoProposal>,

    #[account(
        init_if_needed,
        payer = authority,
        space = DaoDiscoveryRow::space(),
        seeds = [b"dao-discovery", proposal.key().as_ref()],
        bump
    )]
    pub discovery_row: Account<'info, DaoDiscoveryRow>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RefreshDiscovery>) -> Result<()> {
    let now = now_ts()?;
    let proposal = &ctx.accounts.proposal;

    let rank_score_bps = compute_rank_score(
        proposal.yes_votes,
        proposal.no_votes,
        proposal.abstain_votes,
        proposal.total_votes,
        proposal.quorum_bps,
        proposal.approval_threshold_bps,
    );

    let row = &mut ctx.accounts.discovery_row;
    row.dao = ctx.accounts.dao.key();
    row.proposal = ctx.accounts.proposal.key();
    row.proposal_id = proposal.proposal_id;
    row.kind = proposal.kind.clone();
    row.title = proposal.title.clone();
    row.status = proposal.status.clone();
    row.yes_votes = proposal.yes_votes;
    row.no_votes = proposal.no_votes;
    row.abstain_votes = proposal.abstain_votes;
    row.total_votes = proposal.total_votes;
    row.quorum_bps = proposal.quorum_bps;
    row.approval_threshold_bps = proposal.approval_threshold_bps;
    row.rank_score_bps = rank_score_bps;
    row.created_at = proposal.created_at;
    row.updated_at = now;
    row.bump = ctx.bumps.discovery_row;

    Ok(())
}

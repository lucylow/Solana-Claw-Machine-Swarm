use crate::{
    errors::ClawDaoError,
    events::ProposalCreated,
    state::{DaoConfig, DaoMember, DaoProposal, ProposalKind, ProposalStatus},
    utils::{ensure_len, now_ts, proposal_kind_tag},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateProposal<'info> {
    #[account(mut, seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        mut,
        seeds = [b"dao-member", dao.key().as_ref(), proposer.key().as_ref()],
        bump = member.bump,
        constraint = member.wallet == proposer.key()
    )]
    pub member: Account<'info, DaoMember>,

    #[account(
        init,
        payer = proposer,
        space = DaoProposal::space(),
        seeds = [b"dao-proposal", dao.key().as_ref(), proposal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, DaoProposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateProposal>,
    proposal_id: u64,
    title: String,
    description: String,
    kind: ProposalKind,
    skill_key: String,
    recipient: Pubkey,
    amount_lamports: u64,
    target_program: Pubkey,
    target_account: Pubkey,
    vote_duration_slots: u64,
) -> Result<()> {
    let now = now_ts()?;
    let dao = &mut ctx.accounts.dao;
    require!(!dao.paused, ClawDaoError::DaoPaused);

    let member = &mut ctx.accounts.member;

    ensure_len(&title, crate::state::TITLE_MAX)?;
    ensure_len(&description, crate::state::DESC_MAX)?;
    ensure_len(&skill_key, crate::state::KEY_MAX)?;

    require!(member.active, ClawDaoError::MemberNotRegistered);

    let proposal = &mut ctx.accounts.proposal;
    proposal.dao = ctx.accounts.dao.key();
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.proposal_id = proposal_id;
    proposal.kind = kind.clone();
    proposal.status = ProposalStatus::Active;
    proposal.title = title.clone();
    proposal.description = description;
    proposal.skill_key = skill_key;
    proposal.target_program = target_program;
    proposal.target_account = target_account;
    proposal.recipient = recipient;
    proposal.amount_lamports = amount_lamports;
    proposal.start_slot = Clock::get()?.slot;
    proposal.end_slot = proposal
        .start_slot
        .saturating_add(vote_duration_slots.max(dao.vote_duration_slots));
    proposal.quorum_bps = dao.quorum_bps;
    proposal.approval_threshold_bps = dao.proposal_threshold_bps;
    proposal.yes_votes = 0;
    proposal.no_votes = 0;
    proposal.abstain_votes = 0;
    proposal.total_votes = 0;
    proposal.voter_count = 0;
    proposal.execution_hash = String::new();
    proposal.result_hash = String::new();
    proposal.created_at = now;
    proposal.updated_at = now;
    proposal.executed_at = 0;
    proposal.cancelled_at = 0;
    proposal.bump = ctx.bumps.proposal;

    member.proposals_created = member
        .proposals_created
        .checked_add(1)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    member.updated_at = now;

    dao.total_proposals = dao
        .total_proposals
        .checked_add(1)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    dao.updated_at = now;

    emit!(ProposalCreated {
        dao: ctx.accounts.dao.key(),
        proposal: ctx.accounts.proposal.key(),
        proposer: ctx.accounts.proposer.key(),
        proposal_kind: proposal_kind_tag(&kind),
        title,
        timestamp: now,
    });

    Ok(())
}

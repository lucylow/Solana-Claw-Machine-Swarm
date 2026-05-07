use crate::{
    errors::ClawDaoError,
    events::VoteCast,
    state::{DaoConfig, DaoMember, DaoProposal, DaoVoteRecord, ProposalStatus, VoteChoice},
    utils::{ensure_len, now_ts, vote_choice_tag},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut, seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        mut,
        seeds = [b"dao-member", dao.key().as_ref(), voter.key().as_ref()],
        bump = member.bump,
        constraint = member.wallet == voter.key()
    )]
    pub member: Account<'info, DaoMember>,

    #[account(
        mut,
        seeds = [b"dao-proposal", dao.key().as_ref(), proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, DaoProposal>,

    #[account(
        init,
        payer = voter,
        space = DaoVoteRecord::space(),
        seeds = [b"dao-vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, DaoVoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CastVote>, choice: VoteChoice, reason: String) -> Result<()> {
    ensure_len(&reason, crate::state::REASON_MAX)?;
    let now = now_ts()?;
    let dao = &mut ctx.accounts.dao;
    let member = &mut ctx.accounts.member;
    let proposal = &mut ctx.accounts.proposal;

    require!(!dao.paused, ClawDaoError::DaoPaused);
    require!(member.active, ClawDaoError::MemberNotRegistered);
    require!(
        proposal.status == ProposalStatus::Active,
        ClawDaoError::ProposalNotActive
    );
    require!(
        Clock::get()?.slot <= proposal.end_slot,
        ClawDaoError::ProposalEnded
    );

    let vote_record = &mut ctx.accounts.vote_record;
    vote_record.dao = ctx.accounts.dao.key();
    vote_record.proposal = ctx.accounts.proposal.key();
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.delegate = member.delegate;
    vote_record.choice = choice.clone();
    vote_record.weight = member.voting_power;
    vote_record.reason = reason;
    vote_record.created_at = now;
    vote_record.bump = ctx.bumps.vote_record;

    match choice {
        VoteChoice::Yes => {
            proposal.yes_votes = proposal
                .yes_votes
                .checked_add(member.voting_power)
                .ok_or(error!(ClawDaoError::MathOverflow))?;
        }
        VoteChoice::No => {
            proposal.no_votes = proposal
                .no_votes
                .checked_add(member.voting_power)
                .ok_or(error!(ClawDaoError::MathOverflow))?;
        }
        VoteChoice::Abstain => {
            proposal.abstain_votes = proposal
                .abstain_votes
                .checked_add(member.voting_power)
                .ok_or(error!(ClawDaoError::MathOverflow))?;
        }
    }

    proposal.total_votes = proposal
        .total_votes
        .checked_add(member.voting_power)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    proposal.voter_count = proposal
        .voter_count
        .checked_add(1)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    proposal.updated_at = now;

    member.votes_cast = member
        .votes_cast
        .checked_add(1)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    member.updated_at = now;

    dao.total_votes = dao
        .total_votes
        .checked_add(1)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    dao.updated_at = now;

    emit!(VoteCast {
        dao: ctx.accounts.dao.key(),
        proposal: ctx.accounts.proposal.key(),
        voter: ctx.accounts.voter.key(),
        delegate: member.delegate,
        choice: vote_choice_tag(&choice),
        weight: member.voting_power,
        timestamp: now,
    });

    Ok(())
}

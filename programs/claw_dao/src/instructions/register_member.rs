use crate::{
    errors::ClawDaoError,
    events::MemberRegistered,
    state::{DaoConfig, DaoMember},
    utils::now_ts,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterMember<'info> {
    #[account(
        mut,
        seeds = [b"dao-config"],
        bump = dao.bump
    )]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        init,
        payer = payer,
        space = DaoMember::space(),
        seeds = [b"dao-member", dao.key().as_ref(), payer.key().as_ref()],
        bump
    )]
    pub member: Account<'info, DaoMember>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterMember>,
    delegate: Pubkey,
    stake_lamports: u64,
    reputation_points: u64,
) -> Result<()> {
    let now = now_ts()?;
    let dao = &mut ctx.accounts.dao;
    require!(!dao.paused, ClawDaoError::DaoPaused);
    require!(
        stake_lamports >= dao.min_stake_lamports,
        ClawDaoError::ZeroVotingPower
    );

    let voting_power = stake_lamports.saturating_add(reputation_points.saturating_mul(10));

    let member = &mut ctx.accounts.member;
    member.dao = ctx.accounts.dao.key();
    member.wallet = ctx.accounts.payer.key();
    member.delegate = delegate;
    member.stake_lamports = stake_lamports;
    member.voting_power = voting_power;
    member.reputation_points = reputation_points;
    member.proposals_created = 0;
    member.votes_cast = 0;
    member.active = true;
    member.joined_at = now;
    member.updated_at = now;
    member.bump = ctx.bumps.member;

    dao.total_members = dao
        .total_members
        .checked_add(1)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    dao.updated_at = now;

    emit!(MemberRegistered {
        dao: ctx.accounts.dao.key(),
        member: ctx.accounts.member.key(),
        delegate,
        stake_lamports,
        voting_power,
        timestamp: now,
    });

    Ok(())
}

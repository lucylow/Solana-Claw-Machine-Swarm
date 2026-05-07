use crate::{
    events::MemberUpdated,
    state::{DaoConfig, DaoMember},
    utils::now_ts,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateMember<'info> {
    #[account(mut, seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        mut,
        seeds = [b"dao-member", dao.key().as_ref(), wallet.key().as_ref()],
        bump = member.bump,
        has_one = wallet
    )]
    pub member: Account<'info, DaoMember>,

    pub wallet: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateMember>,
    delegate: Option<Pubkey>,
    stake_lamports: Option<u64>,
    reputation_points: Option<u64>,
    active: Option<bool>,
) -> Result<()> {
    let now = now_ts()?;
    let dao = &mut ctx.accounts.dao;
    let member = &mut ctx.accounts.member;

    if let Some(v) = delegate {
        member.delegate = v;
    }
    if let Some(v) = stake_lamports {
        member.stake_lamports = v;
    }
    if let Some(v) = reputation_points {
        member.reputation_points = v;
    }
    if let Some(v) = active {
        member.active = v;
    }

    member.voting_power = member
        .stake_lamports
        .saturating_add(member.reputation_points.saturating_mul(10));
    member.updated_at = now;

    dao.updated_at = now;

    emit!(MemberUpdated {
        dao: ctx.accounts.dao.key(),
        member: ctx.accounts.member.key(),
        delegate: member.delegate,
        stake_lamports: member.stake_lamports,
        voting_power: member.voting_power,
        timestamp: now,
    });

    Ok(())
}

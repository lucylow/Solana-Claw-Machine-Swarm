use crate::{
    events::DaoUpdated,
    state::DaoConfig,
    utils::{ensure_len, now_ts},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateDao<'info> {
    #[account(
        mut,
        seeds = [b"dao-config"],
        bump = dao.bump,
        has_one = authority
    )]
    pub dao: Account<'info, DaoConfig>,
    pub authority: Signer<'info>,
}

pub fn handler(
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
    let now = now_ts()?;
    let dao = &mut ctx.accounts.dao;

    if let Some(v) = name {
        ensure_len(&v, crate::state::NAME_MAX)?;
        dao.name = v;
    }
    if let Some(v) = symbol {
        ensure_len(&v, crate::state::SYMBOL_MAX)?;
        dao.symbol = v;
    }
    if let Some(v) = uri {
        ensure_len(&v, crate::state::URI_MAX)?;
        dao.uri = v;
    }
    if let Some(v) = paused {
        dao.paused = v;
    }
    if let Some(v) = quorum_bps {
        dao.quorum_bps = v;
    }
    if let Some(v) = proposal_threshold_bps {
        dao.proposal_threshold_bps = v;
    }
    if let Some(v) = vote_duration_slots {
        dao.vote_duration_slots = v;
    }
    if let Some(v) = min_stake_lamports {
        dao.min_stake_lamports = v;
    }

    dao.updated_at = now;

    emit!(DaoUpdated {
        dao: ctx.accounts.dao.key(),
        authority: ctx.accounts.authority.key(),
        quorum_bps: dao.quorum_bps,
        proposal_threshold_bps: dao.proposal_threshold_bps,
        paused: dao.paused,
        timestamp: now,
    });

    Ok(())
}

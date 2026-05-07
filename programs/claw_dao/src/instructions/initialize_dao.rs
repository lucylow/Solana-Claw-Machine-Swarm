use crate::{
    events::DaoInitialized,
    state::{DaoConfig, DaoTreasury},
    utils::{ensure_len, now_ts},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeDao<'info> {
    #[account(
        init,
        payer = authority,
        space = DaoConfig::space(),
        seeds = [b"dao-config"],
        bump
    )]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        init,
        payer = authority,
        space = DaoTreasury::space(),
        seeds = [b"dao-treasury"],
        bump
    )]
    pub treasury: Account<'info, DaoTreasury>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
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
    ensure_len(&name, crate::state::NAME_MAX)?;
    ensure_len(&symbol, crate::state::SYMBOL_MAX)?;
    ensure_len(&uri, crate::state::URI_MAX)?;

    let now = now_ts()?;
    let bump = ctx.bumps.dao;
    let treasury_bump = ctx.bumps.treasury;

    let dao = &mut ctx.accounts.dao;
    dao.authority = ctx.accounts.authority.key();
    dao.treasury = ctx.accounts.treasury.key();
    dao.name = name.clone();
    dao.symbol = symbol.clone();
    dao.uri = uri;
    dao.chain_id = chain_id;
    dao.paused = false;
    dao.quorum_bps = quorum_bps;
    dao.proposal_threshold_bps = proposal_threshold_bps;
    dao.vote_duration_slots = vote_duration_slots;
    dao.min_stake_lamports = min_stake_lamports;
    dao.total_members = 0;
    dao.total_proposals = 0;
    dao.total_votes = 0;
    dao.total_executed = 0;
    dao.total_treasury_spend = 0;
    dao.bump = bump;
    dao.created_at = now;
    dao.updated_at = now;

    let treasury = &mut ctx.accounts.treasury;
    treasury.dao = ctx.accounts.dao.key();
    treasury.authority = ctx.accounts.authority.key();
    treasury.vault_bump = treasury_bump;
    treasury.spend_limit_lamports = spend_limit_lamports;
    treasury.total_deposits = 0;
    treasury.total_spent = 0;
    treasury.created_at = now;
    treasury.updated_at = now;

    emit!(DaoInitialized {
        dao: ctx.accounts.dao.key(),
        authority: ctx.accounts.authority.key(),
        treasury: ctx.accounts.treasury.key(),
        name,
        symbol,
        timestamp: now,
    });

    Ok(())
}

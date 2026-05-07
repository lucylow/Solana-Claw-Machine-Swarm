use crate::{
    state::{DaoConfig, DaoTreasury},
    utils::now_ts,
};
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[derive(Accounts)]
pub struct DepositTreasury<'info> {
    #[account(seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        mut,
        seeds = [b"dao-treasury"],
        bump = treasury.vault_bump
    )]
    pub treasury: Account<'info, DaoTreasury>,

    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DepositTreasury>, amount_lamports: u64) -> Result<()> {
    let now = now_ts()?;

    let cpi_accounts = Transfer {
        from: ctx.accounts.depositor.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
    transfer(cpi_ctx, amount_lamports)?;

    let treasury = &mut ctx.accounts.treasury;
    treasury.total_deposits = treasury
        .total_deposits
        .checked_add(amount_lamports)
        .ok_or(error!(crate::errors::ClawDaoError::MathOverflow))?;
    treasury.updated_at = now;

    Ok(())
}

use crate::{
    errors::ClawDaoError,
    events::TreasurySpendExecuted,
    state::{
        DaoConfig, DaoExecutionRecord, DaoProposal, DaoTreasury, ProposalKind, ProposalStatus,
    },
    utils::now_ts,
};
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(mut, seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(
        mut,
        seeds = [b"dao-treasury"],
        bump = treasury.vault_bump
    )]
    pub treasury: Account<'info, DaoTreasury>,

    #[account(
        mut,
        seeds = [b"dao-proposal", dao.key().as_ref(), proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, DaoProposal>,

    #[account(
        init_if_needed,
        payer = executor,
        space = DaoExecutionRecord::space(),
        seeds = [b"dao-exec", proposal.key().as_ref()],
        bump
    )]
    pub execution_record: Account<'info, DaoExecutionRecord>,

    #[account(mut)]
    pub executor: Signer<'info>,

    /// CHECK: recipient of lamports
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawTreasury>) -> Result<()> {
    let now = now_ts()?;
    let dao = &mut ctx.accounts.dao;
    let treasury = &mut ctx.accounts.treasury;
    let proposal = &mut ctx.accounts.proposal;

    require!(
        proposal.status == ProposalStatus::Succeeded,
        ClawDaoError::ProposalNotPassed
    );
    require!(
        proposal.kind == ProposalKind::TreasurySpend,
        ClawDaoError::InvalidProposalKind
    );
    require!(
        proposal.amount_lamports <= treasury.spend_limit_lamports,
        ClawDaoError::Unauthorized
    );

    let vault_bump = treasury.vault_bump;
    let seeds: &[&[u8]] = &[b"dao-treasury", &[vault_bump]];
    let signer = &[seeds];

    let cpi_accounts = Transfer {
        from: treasury.to_account_info(),
        to: ctx.accounts.recipient.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    transfer(cpi_ctx, proposal.amount_lamports).map_err(|_| error!(ClawDaoError::TreasuryTransferFailed))?;

    treasury.total_spent = treasury
        .total_spent
        .checked_add(proposal.amount_lamports)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    treasury.updated_at = now;

    proposal.status = ProposalStatus::Executed;
    proposal.executed_at = now;
    proposal.updated_at = now;

    let exec = &mut ctx.accounts.execution_record;
    exec.dao = ctx.accounts.dao.key();
    exec.proposal = ctx.accounts.proposal.key();
    exec.executor = ctx.accounts.executor.key();
    exec.success = true;
    exec.result_hash = String::from("treasury-spend");
    exec.tx_sig = String::new();
    exec.notes = String::from("Treasury spend executed");
    exec.created_at = now;
    exec.bump = ctx.bumps.execution_record;

    dao.total_executed = dao
        .total_executed
        .checked_add(1)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    dao.total_treasury_spend = dao
        .total_treasury_spend
        .checked_add(proposal.amount_lamports)
        .ok_or(error!(ClawDaoError::MathOverflow))?;
    dao.updated_at = now;

    emit!(TreasurySpendExecuted {
        dao: ctx.accounts.dao.key(),
        proposal: ctx.accounts.proposal.key(),
        recipient: ctx.accounts.recipient.key(),
        amount: proposal.amount_lamports,
        timestamp: now,
    });

    Ok(())
}

use crate::{
    events::{ProposalExecuted, SkillApproved},
    state::{DaoConfig, DaoExecutionRecord, DaoProposal, ProposalKind, ProposalStatus},
    utils::now_ts,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut, seeds = [b"dao-config"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

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
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let now = now_ts()?;
    let dao = &mut ctx.accounts.dao;
    let proposal = &mut ctx.accounts.proposal;

    require!(
        proposal.status == ProposalStatus::Succeeded,
        crate::errors::ClawDaoError::ProposalNotPassed
    );
    require!(
        proposal.executed_at == 0,
        crate::errors::ClawDaoError::ProposalAlreadyExecuted
    );

    let success = true;
    let result_hash = match proposal.kind {
        ProposalKind::TreasurySpend => String::from("treasury-spend-ready"),
        ProposalKind::ParameterChange => String::from("parameter-change-applied"),
        ProposalKind::SkillApprove => {
            emit!(SkillApproved {
                dao: ctx.accounts.dao.key(),
                proposal: ctx.accounts.proposal.key(),
                skill_key: proposal.skill_key.clone(),
                approved_by: ctx.accounts.executor.key(),
                timestamp: now,
            });
            String::from("skill-approved")
        }
        ProposalKind::SkillVersionApprove => String::from("skill-version-approved"),
        ProposalKind::DAOGrant => String::from("dao-grant-approved"),
        ProposalKind::Text => String::from("text-recorded"),
    };

    proposal.status = ProposalStatus::Executed;
    proposal.executed_at = now;
    proposal.updated_at = now;
    proposal.result_hash = result_hash.clone();

    let exec = &mut ctx.accounts.execution_record;
    exec.dao = ctx.accounts.dao.key();
    exec.proposal = ctx.accounts.proposal.key();
    exec.executor = ctx.accounts.executor.key();
    exec.success = success;
    exec.result_hash = result_hash.clone();
    exec.tx_sig = String::new();
    exec.notes = String::from("Proposal executed");
    exec.created_at = now;
    exec.bump = ctx.bumps.execution_record;

    dao.total_executed = dao
        .total_executed
        .checked_add(1)
        .ok_or(error!(crate::errors::ClawDaoError::MathOverflow))?;
    dao.updated_at = now;

    emit!(ProposalExecuted {
        dao: ctx.accounts.dao.key(),
        proposal: ctx.accounts.proposal.key(),
        executor: ctx.accounts.executor.key(),
        success,
        result_hash,
        timestamp: now,
    });

    Ok(())
}

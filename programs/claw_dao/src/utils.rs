use crate::errors::ClawDaoError;
use crate::state::{ProposalKind, VoteChoice};
use anchor_lang::prelude::*;

pub fn ensure_len(value: &str, max: usize) -> Result<()> {
    require!(value.len() <= max, ClawDaoError::StringTooLong);
    Ok(())
}

pub fn now_ts() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}

pub fn checked_add_u64(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or(error!(ClawDaoError::MathOverflow))
}

pub fn bps_from_ratio(numerator: u64, denominator: u64) -> u16 {
    if denominator == 0 {
        return 0;
    }
    let scaled = numerator.saturating_mul(10_000) / denominator;
    scaled.min(10_000) as u16
}

pub fn proposal_kind_tag(kind: &ProposalKind) -> u8 {
    match kind {
        ProposalKind::TreasurySpend => 0,
        ProposalKind::ParameterChange => 1,
        ProposalKind::SkillApprove => 2,
        ProposalKind::SkillVersionApprove => 3,
        ProposalKind::DAOGrant => 4,
        ProposalKind::Text => 5,
    }
}

pub fn vote_choice_tag(choice: &VoteChoice) -> u8 {
    match choice {
        VoteChoice::Yes => 0,
        VoteChoice::No => 1,
        VoteChoice::Abstain => 2,
    }
}

pub fn compute_rank_score(
    yes_votes: u64,
    no_votes: u64,
    abstain_votes: u64,
    total_votes: u64,
    quorum_bps: u16,
    approval_threshold_bps: u16,
) -> u16 {
    let participation = bps_from_ratio(total_votes, yes_votes + no_votes + abstain_votes + 1);
    let approval = bps_from_ratio(yes_votes, yes_votes + no_votes + 1);
    let base = quorum_bps / 2 + approval_threshold_bps / 2;
    let reward = participation / 2 + approval / 2;
    base.saturating_add(reward).min(10_000)
}

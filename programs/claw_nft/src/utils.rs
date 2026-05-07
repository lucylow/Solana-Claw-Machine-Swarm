use crate::error::ClawNftError;
use anchor_lang::prelude::*;

pub fn ensure_len(value: &str, max: usize) -> Result<()> {
    require!(value.len() <= max, ClawNftError::StringTooLong);
    Ok(())
}

pub fn now_ts() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}

pub fn csv_join(values: &[String]) -> String {
    values.join(",")
}

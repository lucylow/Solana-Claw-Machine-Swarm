use anchor_lang::prelude::*;

#[error_code]
pub enum ClawError {
    #[msg("The provided string is too long.")]
    StringTooLong,
    #[msg("The program is paused.")]
    ProgramPaused,
    #[msg("The caller is not authorized.")]
    Unauthorized,
    #[msg("Math overflow.")]
    MathOverflow,
    #[msg("Invalid reputation input.")]
    InvalidReputationInput,
    #[msg("Version already active.")]
    VersionAlreadyActive,
    #[msg("Invalid range or ratio input.")]
    InvalidRange,
    #[msg("Invalid step counts.")]
    InvalidStepCounts,
}

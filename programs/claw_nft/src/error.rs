use anchor_lang::prelude::*;

#[error_code]
pub enum ClawNftError {
    #[msg("String too long")]
    StringTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Collection already initialized")]
    CollectionAlreadyInitialized,
    #[msg("Collection not initialized")]
    CollectionNotInitialized,
    #[msg("Mint already exists")]
    MintAlreadyExists,
    #[msg("Invalid URI")]
    InvalidUri,
    #[msg("Invalid supply")]
    InvalidSupply,
}

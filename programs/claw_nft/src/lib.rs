use anchor_lang::prelude::*;

pub mod error;
pub mod event;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("ClAwNft1111111111111111111111111111111111111");

#[program]
pub mod claw_nft {
    use super::*;

    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        name: String,
        symbol: String,
        uri: String,
        description: String,
        max_supply: u64,
    ) -> Result<()> {
        initialize_collection::handler(ctx, name, symbol, uri, description, max_supply)
    }

    pub fn mint_nft(
        ctx: Context<MintNft>,
        name: String,
        symbol: String,
        uri: String,
        description: String,
        nft_type: state::NftType,
        tags: Vec<String>,
    ) -> Result<()> {
        mint_nft::handler(ctx, name, symbol, uri, description, nft_type, tags)
    }

    pub fn freeze_collection(ctx: Context<FreezeCollection>) -> Result<()> {
        freeze_collection::handler(ctx)
    }

    pub fn record_receipt(ctx: Context<RecordReceipt>, tx_sig: String) -> Result<()> {
        record_receipt::handler(ctx, tx_sig)
    }
}

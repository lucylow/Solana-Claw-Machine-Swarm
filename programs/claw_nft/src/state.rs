use anchor_lang::prelude::*;

pub const NAME_MAX: usize = 32;
pub const SYMBOL_MAX: usize = 10;
pub const URI_MAX: usize = 200;
pub const DESCRIPTION_MAX: usize = 400;
pub const ATTRIBUTES_MAX: usize = 512;
pub const TAGS_MAX: usize = 256;

#[account]
pub struct NftCollectionConfig {
    pub authority: Pubkey,
    pub mint_authority: Pubkey,
    pub collection_mint: Pubkey,
    pub collection_metadata: Pubkey,
    pub collection_master_edition: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub description: String,
    pub total_minted: u64,
    pub max_supply: u64,
    pub frozen: bool,
    pub bump: u8,
    pub created_at: i64,
    pub updated_at: i64,
}

impl NftCollectionConfig {
    pub fn space() -> usize {
        8 + 32 + 32 + 32 + 32 + 32
            + (4 + NAME_MAX)
            + (4 + SYMBOL_MAX)
            + (4 + URI_MAX)
            + (4 + DESCRIPTION_MAX)
            + 8 + 8 + 1 + 1 + 8 + 8
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
#[repr(u8)]
pub enum NftType {
    Badge,
    Membership,
    Achievement,
    Receipt,
    Collectible,
}

#[account]
pub struct NftReceipt {
    pub authority: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub collection: Pubkey,
    pub nft_type: NftType,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub description: String,
    pub tags_csv: String,
    pub tx_sig: String,
    pub edition: u64,
    pub supply: u64,
    pub frozen: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl NftReceipt {
    pub fn space() -> usize {
        8 + 32 + 32 + 32 + 32 + 1
            + (4 + NAME_MAX)
            + (4 + SYMBOL_MAX)
            + (4 + URI_MAX)
            + (4 + DESCRIPTION_MAX)
            + (4 + TAGS_MAX)
            + (4 + 128)
            + 8 + 8 + 1 + 8 + 1
    }
}

#[account]
pub struct NftMintState {
    pub collection: Pubkey,
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub name: String,
    pub uri: String,
    pub nft_type: NftType,
    pub minted_at: i64,
    pub bump: u8,
}

impl NftMintState {
    pub fn space() -> usize {
        8 + 32 + 32 + 32 + (4 + NAME_MAX) + (4 + URI_MAX) + 1 + 8 + 1
    }
}

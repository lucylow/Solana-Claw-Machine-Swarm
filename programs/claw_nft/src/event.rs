use anchor_lang::prelude::*;

#[event]
pub struct CollectionInitialized {
    pub collection_config: Pubkey,
    pub collection_mint: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub timestamp: i64,
}

#[event]
pub struct NftMinted {
    pub collection: Pubkey,
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub name: String,
    pub uri: String,
    pub nft_type: u8,
    pub tx_sig: String,
    pub timestamp: i64,
}

#[event]
pub struct CollectionFrozen {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

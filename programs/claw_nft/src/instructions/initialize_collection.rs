use crate::{
    event::CollectionInitialized,
    state::NftCollectionConfig,
    utils::{ensure_len, now_ts},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token},
};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = NftCollectionConfig::space(),
        seeds = [b"claw-collection"],
        bump
    )]
    pub collection_config: Account<'info, NftCollectionConfig>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority
    )]
    pub collection_mint: Account<'info, Mint>,

    /// CHECK: PDA mint authority for collection and minted NFTs
    #[account(
        seeds = [b"claw-mint-authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    /// CHECK: Metaplex metadata PDA (initialize via Metaplex CPI in a follow-up tx if needed)
    #[account(mut)]
    pub collection_metadata: UncheckedAccount<'info>,

    /// CHECK: Master edition PDA
    #[account(mut)]
    pub collection_master_edition: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn handler(
    ctx: Context<InitializeCollection>,
    name: String,
    symbol: String,
    uri: String,
    description: String,
    max_supply: u64,
) -> Result<()> {
    ensure_len(&name, crate::state::NAME_MAX)?;
    ensure_len(&symbol, crate::state::SYMBOL_MAX)?;
    ensure_len(&uri, crate::state::URI_MAX)?;
    ensure_len(&description, crate::state::DESCRIPTION_MAX)?;

    let now = now_ts()?;
    let bump = ctx.bumps.collection_config;

    let config = &mut ctx.accounts.collection_config;
    config.authority = ctx.accounts.authority.key();
    config.mint_authority = ctx.accounts.mint_authority.key();
    config.collection_mint = ctx.accounts.collection_mint.key();
    config.collection_metadata = ctx.accounts.collection_metadata.key();
    config.collection_master_edition = ctx.accounts.collection_master_edition.key();
    config.name = name.clone();
    config.symbol = symbol.clone();
    config.uri = uri.clone();
    config.description = description;
    config.total_minted = 0;
    config.max_supply = max_supply;
    config.frozen = false;
    config.bump = bump;
    config.created_at = now;
    config.updated_at = now;

    emit!(CollectionInitialized {
        collection_config: config.key(),
        collection_mint: ctx.accounts.collection_mint.key(),
        authority: ctx.accounts.authority.key(),
        name,
        symbol,
        uri,
        timestamp: now,
    });

    Ok(())
}

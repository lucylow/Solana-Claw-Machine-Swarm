use crate::{
    error::ClawNftError,
    event::NftMinted,
    state::{NftCollectionConfig, NftMintState, NftReceipt, NftType},
    utils::{csv_join, ensure_len, now_ts},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct MintNft<'info> {
    #[account(
        mut,
        seeds = [b"claw-collection"],
        bump = collection_config.bump
    )]
    pub collection_config: Account<'info, NftCollectionConfig>,

    #[account(
        init,
        payer = payer,
        space = NftMintState::space(),
        seeds = [b"claw-nft", collection_config.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub mint_state: Account<'info, NftMintState>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// CHECK: derived PDA
    #[account(
        seeds = [b"claw-mint-authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = owner
    )]
    pub owner_ata: Account<'info, TokenAccount>,

    /// CHECK: owner of the NFT
    pub owner: UncheckedAccount<'info>,

    /// CHECK: metadata PDA
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: master edition PDA
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = NftReceipt::space(),
        seeds = [b"claw-nft-receipt", collection_config.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub receipt: Account<'info, NftReceipt>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn handler(
    ctx: Context<MintNft>,
    name: String,
    symbol: String,
    uri: String,
    description: String,
    nft_type: NftType,
    tags: Vec<String>,
) -> Result<()> {
    ensure_len(&name, crate::state::NAME_MAX)?;
    ensure_len(&symbol, crate::state::SYMBOL_MAX)?;
    ensure_len(&uri, crate::state::URI_MAX)?;
    ensure_len(&description, crate::state::DESCRIPTION_MAX)?;

    let now = now_ts()?;
    let config = &mut ctx.accounts.collection_config;

    require!(!config.frozen, ClawNftError::Unauthorized);
    require!(
        config.total_minted < config.max_supply,
        ClawNftError::InvalidSupply
    );

    let tags_csv = csv_join(&tags);
    ensure_len(&tags_csv, crate::state::TAGS_MAX)?;

    let mint_auth_bump = ctx.bumps.mint_authority;
    let mint_auth_seeds: &[&[u8]] = &[b"claw-mint-authority", &[mint_auth_bump]];
    let signer_seeds = &[mint_auth_seeds];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.owner_ata.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    mint_to(cpi_ctx, 1)?;

    let receipt = &mut ctx.accounts.receipt;
    receipt.authority = ctx.accounts.payer.key();
    receipt.owner = ctx.accounts.owner.key();
    receipt.mint = ctx.accounts.mint.key();
    receipt.collection = config.collection_mint;
    receipt.nft_type = nft_type.clone();
    receipt.name = name.clone();
    receipt.symbol = symbol.clone();
    receipt.uri = uri.clone();
    receipt.description = description.clone();
    receipt.tags_csv = tags_csv;
    receipt.tx_sig = String::new();
    receipt.edition = 0;
    receipt.supply = 1;
    receipt.frozen = false;
    receipt.created_at = now;
    receipt.bump = ctx.bumps.receipt;

    let mint_state = &mut ctx.accounts.mint_state;
    mint_state.collection = config.collection_mint;
    mint_state.mint = ctx.accounts.mint.key();
    mint_state.owner = ctx.accounts.owner.key();
    mint_state.name = name.clone();
    mint_state.uri = uri.clone();
    mint_state.nft_type = nft_type;
    mint_state.minted_at = now;
    mint_state.bump = ctx.bumps.mint_state;

    config.total_minted = config
        .total_minted
        .checked_add(1)
        .ok_or(error!(ClawNftError::InvalidSupply))?;
    config.updated_at = now;

    let nft_type_byte = receipt.nft_type as u8;

    emit!(NftMinted {
        collection: config.collection_mint,
        mint: ctx.accounts.mint.key(),
        owner: ctx.accounts.owner.key(),
        name,
        uri,
        nft_type: nft_type_byte,
        tx_sig: receipt.tx_sig.clone(),
        timestamp: now,
    });

    Ok(())
}

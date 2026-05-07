use crate::{event::CollectionFrozen, state::NftCollectionConfig, utils::now_ts};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct FreezeCollection<'info> {
    #[account(
        mut,
        seeds = [b"claw-collection"],
        bump = collection_config.bump,
        has_one = authority
    )]
    pub collection_config: Account<'info, NftCollectionConfig>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<FreezeCollection>) -> Result<()> {
    let now = now_ts()?;
    let config = &mut ctx.accounts.collection_config;
    config.frozen = true;
    config.updated_at = now;

    emit!(CollectionFrozen {
        collection_config: config.key(),
        authority: ctx.accounts.authority.key(),
        timestamp: now,
    });

    Ok(())
}

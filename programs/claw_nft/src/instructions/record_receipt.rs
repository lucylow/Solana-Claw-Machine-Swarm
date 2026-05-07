use crate::{state::NftReceipt, utils::now_ts};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RecordReceipt<'info> {
    #[account(mut, has_one = authority)]
    pub receipt: Account<'info, NftReceipt>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<RecordReceipt>, tx_sig: String) -> Result<()> {
    let now = now_ts()?;
    let receipt = &mut ctx.accounts.receipt;
    receipt.tx_sig = tx_sig;
    receipt.created_at = now;
    Ok(())
}

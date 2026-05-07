# CLAW MACHINE Solana NFT module

This module adds a Solana NFT collection and minting flow to CLAW MACHINE.

## Contents

- **Anchor program** (`programs/claw_nft`): collection config PDA, per-mint state, receipt accounts, mint via SPL `mint_to` signed by the `claw-mint-authority` PDA.
- **REST API** (`server/nft`): create/list/freeze backed by `data/claw-nft.json` for demos (no chain required).
- **Frontend** (`/nft`): mint panel, gallery, and discovery search; uses the same origin as the dev server for `/api/nft/*`.
- **Client helpers** (`client/src/lib/nft`): Metaplex metadata / master edition PDAs and `ClawNftClient` (use with generated IDL after `anchor build`).

## Metaplex metadata

Solana NFTs are commonly modeled as an SPL mint plus a metadata account from the [Metaplex Token Metadata](https://docs.metaplex.com/) program, with JSON metadata at the URI. This repo’s on-chain program reserves metadata/edition accounts for CPIs you can add later; the demo backend stores mint records locally.

## Program ID

Localnet ID is set in `programs/claw_nft/src/lib.rs` and `Anchor.toml`. Replace with your keypair after deployment.

## Data file

`data/claw-nft.json` is created at runtime. Add `data/` to `.gitignore` locally if you do not want commits.

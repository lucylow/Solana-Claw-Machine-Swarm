# CLAW MACHINE Solana Identity Registry

This repository now models the Solana on-chain identity shape as four PDA-backed account roles:

1. Config PDA (`config`)
2. Wallet profile PDA (`profile`, seeded by wallet)
3. Skill PDA (`skill`, seeded by wallet + slug)
4. Skill version PDA (`skill_version`, seeded by skill + version)

## Why this model

Solana programs are stateless. Mutable state belongs in accounts, so the registry should be account-first and PDA-derived. The updated server/client code follows this shape by:

- normalizing and validating wallet addresses on every API boundary
- deriving deterministic PDA pointers with shared seeds
- attaching account pointers (`configPda`, `profilePda`, `skillPda`, `skillVersionPda`) to challenge/profile/skill/receipt payloads
- tracking skill-level and version-level metadata in a cleaner account-shaped model

## Main implementation points

- `server/solana/pda.ts`: canonical PDA derivation + slug/version validation helpers
- `server/solana/identityService.ts`: strict wallet normalization, chain checks, account pointer hydration
- `server/solana/routes.ts`: route-level account input validation and normalized wallet handling
- `server/solana/identityTypes.ts`: cleaner config/profile/skill/version account model
- `client/src/solana/pda.ts`: frontend PDA helpers aligned with server seeds
- `client/src/solana/identityTypes.ts`: client-facing account pointer and versioned skill types

## Flow

1. User connects wallet.
2. Server issues signed challenge and embeds account pointers.
3. Signature verification binds the wallet profile.
4. Skills and versions are returned with deterministic PDA pointers.
5. Receipts include chain metadata plus account references for downstream indexing/UI.

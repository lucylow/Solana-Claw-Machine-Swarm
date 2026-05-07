# CLAW MACHINE Solana on-chain smart contracts

This package provides a Solana-native on-chain registry and reputation layer for CLAW MACHINE.

Accounts:
- config
- profile
- skill
- skill version
- memory anchor
- planner run
- deployment receipt
- reputation
- discovery row

Why this shape:
- Solana programs are stateless, so mutable state is account-driven.
- PDA addressing keeps account derivation deterministic and indexer-friendly.
- Anchor account constraints remove boilerplate and improve safety.

### Demo flow
1. Initialize config.
2. Connect wallet.
3. Create profile.
4. Publish skill.
5. Publish version.
6. Anchor memory after a failure.
7. Record planner run.
8. Record deployment receipt.
9. Update reputation.
10. Refresh discovery row.

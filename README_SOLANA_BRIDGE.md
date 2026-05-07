# CLAW MACHINE Solana Bridge Architecture

CLAW MACHINE is now structured so the backend orchestrates all Solana lifecycle steps:

1. Read wallet session
2. Build instruction payload
3. Send transaction
4. Confirm and index account updates
5. Mirror indexed state to frontend APIs

## Program Layer (Anchor)

- Anchor program: `programs/claw_machine/src/lib.rs`
- PDA-first account model:
  - `registry`
  - `skill`
  - `skill_version`
  - `plan_receipt`
  - `memory_receipt`
  - `proof_receipt`
- Compact state only: hashes, status, authority, timestamps, counters.
- Events emitted for registry, skill, plan, memory, and proof lifecycle.

## Backend Orchestration Layer

- Bridge service: `server/solana/bridgeService.ts`
  - session reads from `solana_sessions`
  - deterministic PDA/account derivation
  - transaction send/confirm flow
  - explorer URL generation
- Indexer mirror store: `server/solana/indexerStore.ts`
  - mirrored account summaries
  - action history with lifecycle status
- Bridge routes: `server/solana/bridgeRoutes.ts`
  - `GET /api/solana/session`
  - `GET /api/solana/network`
  - `POST /api/solana/transaction/build`
  - `POST /api/solana/transaction/send`
  - `POST /api/solana/transaction/confirm`
  - `GET /api/solana/accounts`
  - `GET /api/solana/accounts/:address`
  - `GET /api/solana/history`
  - `GET /api/solana/health`
  - plus orchestration helpers for skills/plans/memory/reflections/receipts

## Integration Wiring

- Server boot wiring: `server/_core/index.ts`
  - creates bridge first
  - mounts identity with on-chain anchor callback
  - mounts memory with bridge-backed receipt anchoring
  - mounts plans with bridge-backed plan anchoring
  - mounts Solana bridge APIs for frontend mirror consumption

## Frontend Consumption

- TS client wrappers: `client/src/solana/bridgeClient.ts`
- Shared route types: `shared/solanaBridge.ts`

## Runtime Notes

- Backend signer is loaded from:
  - `SOLANA_BACKEND_SIGNER` or `SOLANA_RELAYER_SECRET_KEY`
- RPC / cluster:
  - `SOLANA_RPC_URL` (or `SOLANA_RPC_ENDPOINT`)
  - `SOLANA_CLUSTER`
- Program:
  - `SOLANA_PROGRAM_ID` (or `CLAW_IDENTITY_PROGRAM_ID`)

If no backend signer is configured, send endpoints fail fast with explicit `backend_signer_missing`, while keeping build/index APIs available for debug flows.

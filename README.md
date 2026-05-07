
# Solana Claw Machine Swarm

**Solana Claw Machine Swarm** is a Solana-native autonomous agent platform for discovery, coordination, reputation, and multi-agent orchestration.

It is designed to feel like a command center for agent workflows, not a generic AI dashboard. The core product loop is simple:

**connect wallet → choose a skill → execute a task → create a reflection → store memory → anchor a receipt on Solana**

The system is built to make agent behavior visible, auditable, and memorable. Skills are treated like published capabilities. Reflections become structured memory. Important events become durable receipts. Proof lives on-chain where it can be independently verified.

---

## What this project is

This project is a Solana-first agent framework that combines:

* wallet-based identity
* published skill assets
* task planning and execution
* reflection and memory
* on-chain receipts and proof
* reputation signals
* multi-agent orchestration
* OpenClaw compatibility
* optional 0G-sidecar storage and compute flows

The goal is to make AI agents feel less like chatbots and more like a living system of coordinated capability.

---

## Why it exists

Most agent demos show a prompt and an answer.

This one shows a **full lifecycle**:

1. a user connects a Solana wallet
2. an agent chooses a skill
3. the agent builds a plan
4. the plan executes
5. a result is produced
6. a reflection is created
7. memory is written
8. a receipt is anchored on Solana
9. the next run improves from the prior lesson

That loop is the product.

It makes the agent economy legible through:

* discovery
* coordination
* reputation
* proof of execution
* replayable memory

---

## Repository snapshot

This repository is organized as a TypeScript-heavy application with clearly separated client, server, and shared layers. GitHub shows top-level folders for `client`, `server`, `shared`, `drizzle`, and `patches`, along with project config files such as `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, `drizzle.config.ts`, and supporting README files. The language breakdown shown on GitHub is overwhelmingly TypeScript. ([GitHub][1])

---

## Core product story

The product story should always be visible and easy to understand:

### 1. Connect wallet

The user connects a Solana wallet and the app verifies the session.

### 2. Choose a skill

The user browses a registry of skills with provenance, version history, and reputation.

### 3. Execute a task

The agent selects the best skill or set of skills and runs a plan.

### 4. Reflect

If the run succeeds or fails, the system creates a structured reflection.

### 5. Write memory

The reflection becomes durable memory, searchable and reusable later.

### 6. Anchor a receipt on Solana

The important proof-grade parts are anchored on-chain as receipts and references.

### 7. Improve the next run

The next execution uses the memory and reflection to make a better decision.

---

## What makes it different

This is not just a chatbot wrapper.

It is designed to make the following visible:

* **what the AI chose on its own**
* **what the user chose**
* **what was policy-gated**
* **what was delegated to tools**
* **what was executed automatically**
* **what required human approval**
* **what was anchored on-chain**
* **what memory changed because of it**

That makes the system measurable, auditable, and easier to trust.

---

## Solana-first principles

This project should always feel Solana-native:

* Solana wallet is the front door
* Solana receipts prove important actions
* Solana explorer links are visible everywhere
* account-based state is compact and verifiable
* PDAs are used for durable identity and proofs
* Anchor is the program model
* the backend orchestrates instructions and mirrors state
* the frontend is a command center, not a blockchain terminal

---

## SWARM themes

This repository is built around the SWARM-style agent economy story:

### Discovery

Skills should be searchable, rankable, and readable as published capabilities.

### Coordination

The planner, coordinator, and sub-agents should visibly split work and merge results.

### Reputation

Skills and agents should have trust signals like usage count, success rate, and proof history.

### Multi-agent orchestration

The UI should show the planner, researcher, operator, critic, support, and coordinator as distinct roles.

---

## Features

### Wallet and identity

* Solana wallet connect
* session verification
* cluster-aware state
* balance display
* explorer links
* wallet-driven permissions

### Skills

* published skill assets
* version history
* author wallet
* reputation score
* usage count
* success rate
* active / deprecated state

### Planning and execution

* goal-driven planning
* step breakdown
* execution timeline
* task outcome tracking
* retries and policy gates

### Reflection and memory

* structured root cause analysis
* corrective advice
* next-action injection
* durable memory writes
* memory retrieval and replay

### Receipts and proof

* execution receipts
* memory receipts
* reflection receipts
* plan receipts
* proof anchors on Solana
* explorer-verifiable links

### OpenClaw compatibility

* import OpenClaw-compatible skills
* export CLAW skills to OpenClaw-compatible manifests
* preserve provenance and versioning

### Demo mode

* believable mock data
* replayable story flow
* presentation-ready command center
* failure → reflection → memory → improved next turn

---

## Architecture

The intended architecture is:

```text
Frontend (React)
  → Wallet / Session State
  → API / tRPC
Backend (Express + tRPC + Drizzle)
  → Agent orchestration
  → Skill registry
  → Memory / reflection pipeline
  → Receipt generation
  → Solana instruction building
  → Account indexing
  → OpenClaw bridge
Solana (Anchor program)
  → Skill identity
  → Plan / execution / receipt anchors
  → Compact proofs
Optional sidecar
  → 0G storage / logs / compute
```

### Client

The client is the command center. It shows live execution, receipts, memory, and proof.

### Server

The server is the orchestration layer. It handles wallet session, plan building, execution flow, indexing, and proof mirroring.

### Shared

The shared layer defines the types for skills, receipts, memory, reflections, autonomy, proof, and wallet/session state.

### Chain

The active onchain layer should be Solana-first. Anchor is the main program framework. Compact proofs, hashes, and receipts belong on chain; narrative text belongs off chain.

---

## Project structure

Expected important areas:

* `client/` — React frontend
* `server/` — backend services and routers
* `shared/` — shared types and utilities
* `drizzle/` — database schema and migrations
* `patches/` — compatibility patches or dependency fixes
* `contracts/` — legacy or compatibility-only smart contracts
* `anchor/` or `programs/` — Solana program workspace if present or added later

---

## Quick start

```bash
pnpm install
pnpm db:push
pnpm dev
```

### Build

```bash
pnpm build
```

### Start production

```bash
pnpm start
```

### Typecheck

```bash
pnpm check
```

### Test

```bash
pnpm test
```

### Format

```bash
pnpm format
```

The repo’s package scripts include `dev`, `build`, `start`, `check`, `format`, `test`, and `db:push`. ([GitHub][2])

---

## Environment variables

Create a `.env` file with the values your deployment needs. A typical Solana-first setup may include:

```bash
DATABASE_URL=
SOLANA_RPC_URL=
SOLANA_CLUSTER=devnet
SOLANA_PROGRAM_ID=
SOLANA_EXPLORER_BASE_URL=
SESSION_SECRET=
OPENCLAW_BRIDGE_URL=
ZERO_G_STORAGE_URL=
ZERO_G_API_KEY=
DEMO_MODE=true
```

Use the variables your actual runtime expects. Keep Solana cluster and explorer configuration explicit.

---

## Solana wallet flow

The wallet flow should work like this:

1. user connects a Solana wallet
2. frontend requests a session nonce from backend
3. wallet signs a Solana session message
4. backend verifies the signature
5. backend returns a verified session and permissions
6. frontend shows wallet, balance, cluster, and explorer state

This means the backend becomes the source of trust for session identity, while the frontend remains a visual command center.

---

## Wallet UI principles

The wallet panel should show:

* connected / disconnected state
* wallet name
* public key
* network / cluster
* SOL balance
* session verified badge
* latest transaction signature
* explorer link
* permission summary
* wrong cluster warning
* reconnect / refresh controls

The wallet panel should be the front door to the product, not a hidden utility.

---

## Skill model

Skills should be treated like published assets, not local JSON entries.

A skill should have:

* name
* description
* version
* author wallet
* content hash
* status
* usage count
* success rate
* reputation score
* OpenClaw compatibility
* proof / receipt link if available

Skill cards should make provenance and trust visible at a glance.

---

## Execution model

An execution should tell a story:

* goal received
* plan built
* skills chosen
* policy checked
* task executed
* output produced
* failure or success recorded
* reflection created if needed
* memory stored
* receipt anchored on Solana

Execution should never feel like a black box.

---

## Reflection and memory model

This project is strongest when failure becomes memory.

A reflection should capture:

* what happened
* why it happened
* what should change next time
* what lesson was learned
* what memory was created
* what receipt or proof exists
* how the next turn should improve

Memory should be:

* durable
* searchable
* replayable
* linked to the source turn
* linked to the next turn
* optionally anchored via compact proof

---

## Receipts and proof

Every important event should produce a receipt:

* wallet session receipt
* skill publish receipt
* plan receipt
* execution receipt
* reflection receipt
* memory receipt
* proof receipt
* OpenClaw import/export receipt

A receipt should show:

* subject
* wallet
* hash
* status
* timestamp
* Solana tx signature
* explorer link
* storage reference if relevant

Receipts make the system auditable and demo-friendly.

---

## OpenClaw compatibility

OpenClaw compatibility should be a real bridge, not a label.

The bridge should support:

* import OpenClaw-compatible tool manifest
* export CLAW skill as OpenClaw manifest
* preserve provenance
* preserve versioning
* preserve hashes
* show sync status and receipts

This makes CLAW MACHINE interoperable with other agent systems.

---

## Solana program direction

The onchain layer should be compact and proof-oriented.

Use Anchor and PDA-backed accounts for:

* registry
* skill asset
* skill version
* plan receipt
* execution receipt
* reflection receipt
* memory receipt
* proof receipt
* bridge mapping
* agent profile

Store on chain:

* hashes
* refs
* identity
* status
* timestamps
* proofs

Keep off chain:

* full reflection text
* plan narrative
* long-form execution logs
* rich metadata objects

---

## Backend responsibilities

The backend should:

* verify wallet session
* build Solana instructions
* send and confirm transactions
* fetch account data
* index account changes
* generate receipts
* mirror state to the frontend
* manage OpenClaw import/export
* manage demo/mock flows
* handle degraded states cleanly

---

## Frontend responsibilities

The frontend should:

* show the full loop
* make wallet identity obvious
* make skill discovery easy
* show planning and execution clearly
* visualize reflection and memory
* present receipts and proofs beautifully
* make OpenClaw compatibility visible
* feel like a command center

---

## Demo mode

A good demo should be able to show:

* wallet connect
* skill selection
* plan generation
* execution
* failure
* reflection
* memory write
* receipt anchoring
* explorer verification
* improved next run

The demo mode should work even when real chain access is unavailable, using deterministic mock data.

---

## Roadmap

### Next milestone

* Solana wallet session and explorer-first UI
* Solana-native receipts
* skill registry polish
* memory / reflection timeline

### Next milestone after that

* Anchor program for proofs and receipts
* OpenClaw bridge
* reputation display
* full execution replay UI

### Final milestone

* a command center that feels like a real agent economy operating system

---

## Development notes

This repo is TypeScript-heavy, which is a good fit for a Solana-first frontend and orchestration layer. GitHub currently shows the codebase as overwhelmingly TypeScript, with small amounts of JavaScript, CSS, and HTML. ([GitHub][1])

The current repository layout already supports a clean split between client, server, and shared logic, which is a strong foundation for a Solana command center, receipt layer, and OpenClaw bridge. ([GitHub][1])

---

## What to avoid

* generic dashboard layouts
* Ethereum-first wording
* hidden wallet state
* localStorage as identity truth
* long text stored on chain
* ambiguous receipts
* vague “AI-powered” copy without proof
* weak demo flows
* unclear execution story
* untraceable memory

---

## What success looks like

When this project is working well, a visitor should instantly understand:

* this is a Solana-native agent platform
* wallets matter
* skills are published assets
* planning is visible
* memory is durable
* proof is on chain
* OpenClaw compatibility exists
* the system learns over time

That is the story this repository should tell.

---

## License

MIT

[1]: https://github.com/lucylow/Solana-Claw-Machine-Swarm/tree/main "GitHub - lucylow/Solana-Claw-Machine-Swarm · GitHub"
[2]: https://github.com/lucylow/Solana-Claw-Machine-Swarm/blob/main/package.json "Solana-Claw-Machine-Swarm/package.json at main · lucylow/Solana-Claw-Machine-Swarm · GitHub"

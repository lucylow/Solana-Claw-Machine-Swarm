# SWARM: Multi-Agent Orchestration on Solana

A production-ready Solana-native platform for deploying, coordinating, and monetizing multi-agent networks with on-chain receipt anchoring and OpenClaw interoperability.

## Overview

**SWARM** is built for the Colosseum Frontier & Canteen SWARM Hackathon. It enables developers to:

- Deploy coordinated multi-agent systems with real-time task distribution
- Record all agent actions as immutable receipts on Solana devnet
- Import tools from OpenClaw ecosystem as CLAW skills
- Export skills as OpenClaw-compatible manifests
- Manage agent reputation and performance on-chain

## Architecture

### Core Components

**Frontend (React 19 + Tailwind 4 + Cyberpunk Theme)**

- Landing page with SWARM branding and wallet connection
- Agent orchestration dashboard with real-time activity feed
- On-chain receipt viewer with Solana explorer integration
- CLAW skills registry with OpenClaw bridge UI
- Documentation pages explaining SWARM architecture
- Judge-facing `/submission` route mapping the product to the SWARM rubric

**Backend (Express + tRPC + Drizzle ORM)**

- Solana session management with nonce-based signing
- Agent registry and lifecycle management
- CLAW skills registry with OpenClaw metadata
- On-chain receipt storage and verification
- Activity logging and real-time event streaming

**Database (MySQL)**

- `users`: Manus OAuth user profiles
- `solanaSessions`: Wallet session management
- `agents`: Agent registry with status and metadata
- `clawSkills`: CLAW skills with OpenClaw compatibility
- `onchainReceipts`: Receipt storage (plan, execution, reflection, memory)
- `activityLog`: Real-time event log

### Receipt Types

- **Plan**: Task intent and goals defined by orchestrator
- **Execution**: Actions taken by agent in response to plan
- **Reflection**: Outcome analysis and performance metrics
- **Memory**: Learned patterns and knowledge stored for future use

## Features

### Multi-Agent Orchestration

- Real-time agent status monitoring
- Task queue and distribution
- Agent role-based assignment
- Automatic failover and retry logic

### On-Chain Receipts

- Immutable audit trail on Solana devnet
- Receipt types: plan, execution, reflection, memory
- Transaction hash tracking and explorer integration
- Receipt verification and validation

### OpenClaw Bridge

- Bidirectional skill import/export
- Manifest generation and validation
- Compatibility tracking
- Ecosystem integration

### Cyberpunk Aesthetic

- Dark background with cyan/purple neon accents
- Futuristic technical UI
- Consistent branding across all pages
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL database
- Manus OAuth credentials

### Installation

```bash
# Install dependencies
pnpm install

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

Required environment variables (auto-injected by Manus):

- `DATABASE_URL`: MySQL connection string
- `VITE_APP_ID`: Manus OAuth application ID
- `OAUTH_SERVER_URL`: Manus OAuth backend URL
- `VITE_OAUTH_PORTAL_URL`: Manus login portal URL
- `JWT_SECRET`: Session cookie signing secret
- `BUILT_IN_FORGE_API_URL`: Manus built-in APIs URL
- `BUILT_IN_FORGE_API_KEY`: Manus built-in APIs key

## Pages

### Landing Page (`/`)

- SWARM branding and hero section
- Feature highlights
- Wallet connection CTA
- Call-to-action for getting started

### Dashboard (`/dashboard`)

- Agent statistics and status
- Active agents list with role information
- Real-time activity feed
- Agent creation form

### On-Chain Receipts (`/receipts`)

- Receipt viewer with type filtering
- Receipt creation form (plan, execution, reflection, memory)
- Solana explorer links
- Receipt content display

### CLAW Skills Registry (`/skills`)

- Skills list with compatibility status
- Skill creation form
- OpenClaw bridge status
- Import/export functionality

### How It Works (`/how-it-works`)

- SWARM architecture explanation
- Solana integration details
- OpenClaw bridge documentation
- Key concepts and terminology

## Development

### Adding Features

1. Update database schema in `drizzle/schema.ts`
2. Run `pnpm db:push` to apply migrations
3. Add database helpers in `server/db.ts`
4. Create tRPC procedures in `server/routers.ts`
5. Build UI components in `client/src/pages/` or `client/src/components/`
6. Add routes in `client/src/App.tsx`

### Testing

```bash
# Run tests
pnpm test

# Check TypeScript
pnpm check

# Build for production
pnpm build
```

## Submission Route

Open `/submission` before submitting to Frontier. It summarizes the judge path, SWARM rubric fit, readiness score, demo links, and remaining external assets such as the public GitHub URL and founder pitch video.

## Deployment

The application is deployed on Manus with automatic scaling and SSL certificates.

### Publishing

1. Create a checkpoint via the Management UI
2. Click the "Publish" button to deploy
3. Access the live site at the provided Manus URL

## Roadmap

### Phase 1: Core Platform (Complete)

- ✅ Landing page and wallet integration
- ✅ Agent orchestration dashboard
- ✅ On-chain receipt management
- ✅ CLAW skills registry
- ✅ OpenClaw bridge UI

### Phase 2: Solana Integration

- ✅ Anchor programs for receipt anchoring, DAO coordination, and NFT records
- ✅ Solana devnet transaction surfaces with explorer links and proof-state labels
- ✅ Receipt verification and validation with degraded-state messaging
- ✅ Phantom/Solflare/Backpack wallet adapter integration

### Phase 3: Advanced Features

- ✅ Real-time-style command center for agent coordination and demo replay
- ✅ Reputation-aware skill discovery and agent scoring surfaces
- ✅ OpenClaw-compatible skill marketplace and manifest bridge
- ✅ DAO proposal module for shared governance workflows
- ✅ 0G sidecar route for storage, DA, replay, and proof graph artifacts
- [ ] Production mainnet deployment and live partner traction links

## Contributing

SWARM is built for the Colosseum Frontier hackathon. Contributions and improvements are welcome!

## License

MIT

## Support

For questions or issues, please refer to the documentation or contact the SWARM team.

---

**Built for Colosseum Frontier & Canteen SWARM Hackathon 2026**

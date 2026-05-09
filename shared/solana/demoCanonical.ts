import type {
  AgentOrchestrationPlanReceipt,
  ReflectionRecord,
  SolanaRegistrySkillAsset,
  SolanaTxRecord,
} from "./types";

export const DEMO_WALLET_SNAPSHOT = {
  publicKey: "9q2x8sFz3wJmYcP4VnK7aL1tR6eU2bQ8hJ5mX9pZ",
  walletName: "Phantom",
  cluster: "devnet" as const,
  balanceLamports: "2584938200",
  balanceSol: "2.5849382",
};

export const DEMO_SKILLS: SolanaRegistrySkillAsset[] = [
  {
    id: "skill-support-triage",
    name: "Support Triage",
    description:
      "Classify customer requests, choose a response plan, and escalate when needed.",
    tags: ["support", "triage", "agentic"],
    version: "1.3.0",
    authorWallet: "8Cz7A1kN4bq2TzP3mR5xY8dQ1vL6fH9jK2pS0aW",
    contentHash: "7f3a9eb…c81b19c",
    status: "active",
    usageCount: 142,
    successRate: 93,
    reputationScore: 91,
    lastUsedAt: "2026-05-04T16:22:10.000Z",
    openClawCompatible: true,
    openClawSource: "openclaw://tools/support@v1",
  },
];

export const DEMO_AGENT_PLAN: AgentOrchestrationPlanReceipt = {
  id: "plan-001",
  planId: "goal-support-001",
  taskType: "support",
  goal: "Help the user debug a failed wallet session and complete a successful retry.",
  summary:
    "Break the task into wallet verification, cluster check, session signing, and receipt anchoring.",
  stepCount: 4,
  dependencies: [
    {
      id: "dep-wallet",
      type: "tool",
      ref: "wallet",
      label: "Solana wallet",
      required: true,
    },
    {
      id: "dep-session",
      type: "tool",
      ref: "session-service",
      label: "Session service",
      required: true,
    },
  ],
  chosenSkills: [
    {
      id: "skill-support-triage",
      name: "Support Triage",
      version: "1.3.0",
      hash: "7f3a…b19c",
      active: true,
    },
  ],
  summaryHash: "a1c2e…d9f0ab",
  planHash: "9b7da…e021cf",
  status: "anchored",
  createdAt: "2026-05-04T16:22:00.000Z",
  updatedAt: "2026-05-04T16:22:05.000Z",
  agentId: "agent-planner-01",
  wallet: DEMO_WALLET_SNAPSHOT.publicKey,
  metadata: {},
  solana: {
    txSignature: "5z1D9oN1w2XrJ8fF3VqB6hH4cK7mP0sZ2uY9eK3LqWgR4A1",
    verified: true,
  },
};

export const DEMO_REFLECTION: ReflectionRecord = {
  id: "refl-001",
  agentId: "agent-support-01",
  skillId: "skill-support-triage",
  sourceTurnId: "turn-1042",
  rootCause: "The wallet session expired before the receipt anchor step.",
  correctiveAdvice:
    "Refresh the session immediately after a cluster or balance refresh, then rerun the receipt anchor step.",
  nextAction: "Re-sign the Solana session and re-submit the proof anchor.",
  summary: "Session expiration interrupted the receipt flow.",
  fullText:
    "Detailed reflection text describing retries and telemetry correlation.",
  createdAt: "2026-05-04T16:23:00.000Z",
  updatedAt: "2026-05-04T16:23:05.000Z",
  status: "stored",
};

export const DEMO_CHAIN_RECEIPT: SolanaTxRecord = {
  id: "tx-001",
  type: "proof",
  subjectId: "proof-001",
  wallet: DEMO_WALLET_SNAPSHOT.publicKey,
  cluster: "devnet",
  txSignature: "5z1D9oN1w2XrJ8fF3VqB6hH4cK7mP0sZ2uY9eK3LqWgR4A1",
  account: "8u9FpDAExample111111111111111111111111111111",
  summaryHash: "d4e5…c123af",
  status: "confirmed",
  createdAt: "2026-05-04T16:24:00.000Z",
  explorerUrl:
    "https://explorer.solana.com/tx/5z1D9oN1w2XrJ8fF3VqB6hH4cK7mP0sZ2uY9eK3LqWgR4A1?cluster=devnet",
  proofRef: "proof-001",
};

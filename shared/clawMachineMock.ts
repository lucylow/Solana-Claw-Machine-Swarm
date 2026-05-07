/**
 * Fictional but realistic Solana-native appendix data for CLAW_MACHINE demos, pitches, and UI mocks.
 * Not live chain state — safe for README / deck / product specs.
 */

export interface ClawMachineEcosystemStats {
  walletsConnected: number;
  activeAgents: number;
  skillsRegistered: number;
  skillsActive: number;
  receiptsAnchored: number;
  memoryRecordsStored: number;
  reflectionsGenerated: number;
  avgTxFinalityMs: number;
  avgExecutionTimeSec: number;
  successRatePct: number;
  cluster: string;
  programVersion: string;
  anchorVersion: string;
  rpcProvider: string;
  indexer: string;
  compression: string;
  currentEpoch: number;
  slotHeight: number;
}

export interface ClawDeployedProgram {
  name: string;
  programId: string;
  type: string;
  status: string;
  responsibilities: string;
}

export interface ClawSkillSeed {
  id: string;
  name: string;
  category: string;
  description: string;
  authorWallet: string;
  version: string;
  reputation: number;
  usageCount: number;
  successRate: number;
  proofCount: number;
  tags: string[];
}

export const CLAW_MACHINE_CLUSTER = "mainnet-beta";

export const CLAW_MACHINE_ECOSYSTEM: ClawMachineEcosystemStats = {
  walletsConnected: 18_492,
  activeAgents: 4_218,
  skillsRegistered: 12_640,
  skillsActive: 9_384,
  receiptsAnchored: 2_491_220,
  memoryRecordsStored: 8_771_004,
  reflectionsGenerated: 1_120_554,
  avgTxFinalityMs: 420,
  avgExecutionTimeSec: 2.7,
  successRatePct: 91.8,
  cluster: CLAW_MACHINE_CLUSTER,
  programVersion: "v2.4.18",
  anchorVersion: "0.31.1",
  rpcProvider: "Helius",
  indexer: "Yellowstone gRPC",
  compression: "Light Protocol enabled",
  currentEpoch: 812,
  slotHeight: 317_842_109,
};

export const CLAW_EXECUTIVE_WEEKLY = [
  { day: "Mon", wallets: 2_104, runs: 31_994, receipts: 31_882, failures: 2_112 },
  { day: "Tue", wallets: 2_338, runs: 35_441, receipts: 35_287, failures: 2_398 },
  { day: "Wed", wallets: 2_612, runs: 38_210, receipts: 38_001, failures: 2_441 },
  { day: "Thu", wallets: 2_790, runs: 40_882, receipts: 40_664, failures: 2_702 },
  { day: "Fri", wallets: 3_108, runs: 46_111, receipts: 45_804, failures: 3_001 },
  { day: "Sat", wallets: 2_700, runs: 39_440, receipts: 39_220, failures: 2_615 },
  { day: "Sun", wallets: 2_840, runs: 41_550, receipts: 41_289, failures: 2_733 },
] as const;

export const CLAW_PRODUCT_OUTCOMES = {
  multiStepPlansCompleted: 1_108_220,
  memoryReuseSuccessRatePct: 78.4,
  reflectionToImprovementRatePct: 64.2,
  avgRetriesBeforeSuccess: 1.36,
  topSkillCategory: "research",
  topWalletCohort: "builders",
} as const;

export const CLAW_NARRATIVE = {
  mission: "Wallet-signed agents on Solana with compact receipts, reflection lineage, and verifiable storage pointers",
  targetUser: "Builders shipping policy-gated orchestration with explorer-ready proof",
  differentiator: "Structured receipts, PDAs, and off-chain payloads tied to Solana signatures — not opaque chat logs",
  monetization: "Skill fees, premium orchestration, enterprise nodes",
  expansionPath: "Skill marketplace, reputation signals anchored to receipts, coordination markets",
} as const;

export const CLAW_DEPLOYED_PROGRAMS: ClawDeployedProgram[] = [
  {
    name: "claw_registry",
    programId: "CLAWReg1111111111111111111111111111111111",
    type: "Anchor program",
    status: "Active",
    responsibilities: "Skill registration, versioning, approvals, reputation, ownership transfer",
  },
  {
    name: "claw_orchestrator",
    programId: "CLAWOrch111111111111111111111111111111111",
    type: "Anchor program",
    status: "Active",
    responsibilities: "Task routing, multi-agent execution, CPI coordination",
  },
  {
    name: "claw_memory",
    programId: "CLAWMem11111111111111111111111111111111111",
    type: "Anchor program",
    status: "Active",
    responsibilities: "Memory anchors, recall links, pruning policies, trust scoring",
  },
  {
    name: "claw_receipts",
    programId: "CLAWRec11111111111111111111111111111111111",
    type: "Anchor program",
    status: "Active",
    responsibilities: "Execution receipts, reflection receipts, proof trails",
  },
  {
    name: "claw_governance",
    programId: "CLAWGov1111111111111111111111111111111111",
    type: "Anchor program",
    status: "Active",
    responsibilities: "Curator roles, risk flags, upgrade controls, emergency pause",
  },
];

export const CLAW_PROGRAM_CONFIG = {
  upgradeAuthority: "9hDk...Qm2s",
  authorityWallet: "Phantom multisig",
  deploymentSlot: 317_201_884,
  lastUpgradeUtc: "2026-05-03 14:22 UTC",
  verificationStatus: "Verified build",
} as const;

export const CLAW_PDA_EXAMPLES = [
  { name: "Skill PDA: research.solana-analyzer", address: "7p8R4o...fQ1d", status: "Active" },
  { name: "Skill Version PDA v12", address: "2sWz8m...Gk9a", status: "Active" },
  { name: "Memory PDA: session-8841", address: "Aw3nJk...tM33", status: "Anchored" },
  { name: "Reflection PDA: turn-99213", address: "9Lq2Vh...Xc77", status: "Anchored" },
  { name: "Receipt PDA: run-551882", address: "4Qf7Ms...Rz10", status: "Confirmed" },
] as const;

export const CLAW_WALLET_COHORTS = [
  { cohort: "Builders", wallets: 8_102, sharePct: 43.8, behavior: "Test skills, deploy agents, inspect receipts" },
  { cohort: "Researchers", wallets: 2_944, sharePct: 15.9, behavior: "Run analysis pipelines and memory experiments" },
  { cohort: "Operators", wallets: 1_881, sharePct: 10.2, behavior: "Manage production workloads and reports" },
  { cohort: "Enterprise Pilots", wallets: 1_214, sharePct: 6.6, behavior: "Dedicated agents under policy control" },
  { cohort: "Hackathon Users", wallets: 4_351, sharePct: 23.5, behavior: "Rapid iteration and demo workflows" },
] as const;

export const CLAW_WALLET_METADATA = [
  { label: "lucy-builder", address: "F6P1...aK22", role: "creator", trust: "high" },
  { label: "swarm-coordinator", address: "9Nw2...kQ87", role: "operator", trust: "high" },
  { label: "demo-wallet-01", address: "3Hk8...mT41", role: "demo", trust: "medium" },
  { label: "enterprise-pilot-07", address: "8Qv4...zL12", role: "org", trust: "high" },
  { label: "research-lab-03", address: "2Zm1...rC90", role: "lab", trust: "medium" },
] as const;

export const CLAW_WALLET_ACTIVITY = {
  medianDailyRunsPerWallet: 11,
  medianActiveDaysPerMonth: 14,
  pctUsingMemory: 61.7,
  pctUsingReflectionReceipts: 49.2,
  pctUsingSkillApprovals: 28.4,
} as const;

/** Seeds mapped to `SwarmSkill` in `swarmRuntime` (autonomy/policy filled there). */
export const CLAW_SKILL_SEEDS: ClawSkillSeed[] = [
  {
    id: "skill_0x9a44f2",
    name: "Solana Research Summarizer",
    category: "research",
    description: "Summarizes complex Solana ecosystem data into concise briefs",
    authorWallet: "F6P1aK22ExampleWallet111111111111111111111",
    version: "1.8.3",
    reputation: 96,
    usageCount: 312_540,
    successRate: 96,
    proofCount: 300_214,
    tags: ["solana", "research", "briefs", "ecosystem"],
  },
  {
    id: "skill_tx_risk",
    name: "Transaction Risk Inspector",
    category: "safety",
    description: "Scores Solana transactions and program risk before execution",
    authorWallet: "9Nw2kQ87ExampleWallet222222222222222222222",
    version: "2.1.0",
    reputation: 95,
    usageCount: 201_022,
    successRate: 95,
    proofCount: 190_448,
    tags: ["safety", "transactions", "simulation"],
  },
  {
    id: "skill_multi_planner",
    name: "Multi-Agent Planner",
    category: "orchestration",
    description: "Decomposes goals into CPI-safe multi-step agent plans on Solana",
    authorWallet: "3Hk8mT41ExampleWallet333333333333333333333",
    version: "3.0.1",
    reputation: 94,
    usageCount: 402_118,
    successRate: 94,
    proofCount: 378_611,
    tags: ["orchestration", "agents", "planning"],
  },
  {
    id: "skill_wallet_ops",
    name: "Wallet Ops Assistant",
    category: "finance",
    description: "Helps with SOL/SPL flows, ATA creation, and signer hygiene",
    authorWallet: "8Qv4zL12ExampleWallet444444444444444444444",
    version: "1.4.8",
    reputation: 92,
    usageCount: 142_800,
    successRate: 92,
    proofCount: 131_600,
    tags: ["wallet", "spl", "operations"],
  },
  {
    id: "skill_mem_consolidator",
    name: "Memory Consolidator",
    category: "memory",
    description: "Merges short- and mid-term agent memory into long-term anchors",
    authorWallet: "2Zm1rC90ExampleWallet555555555555555555555",
    version: "2.0.6",
    reputation: 91,
    usageCount: 158_440,
    successRate: 91,
    proofCount: 143_288,
    tags: ["memory", "anchors", "pda"],
  },
  {
    id: "skill_proposal",
    name: "Proposal Drafting Agent",
    category: "business",
    description: "Drafts governance and partnership memos with on-chain citation hooks",
    authorWallet: "G9hnKjk8YvZ2mVx3u6Bm1pqf5xg2SkRtVwVjRk4aA9yx",
    version: "1.2.9",
    reputation: 90,
    usageCount: 98_200,
    successRate: 90,
    proofCount: 88_100,
    tags: ["governance", "drafting", "business"],
  },
  {
    id: "skill_code_review",
    name: "Code Review Copilot",
    category: "devtools",
    description: "Anchor/Rust/TS review with Solana-specific lint rules",
    authorWallet: "3QjyqMdQ9fPkVb3q1Dzvt9yYynow3m4UjGJQWWY7SmTx",
    version: "2.3.2",
    reputation: 94,
    usageCount: 220_400,
    successRate: 94,
    proofCount: 207_300,
    tags: ["anchor", "rust", "review"],
  },
  {
    id: "skill_reflection_gen",
    name: "Reflection Generator",
    category: "reasoning",
    description: "Structured root-cause and retry hints after failed agent runs",
    authorWallet: "8qFwzE9wC2vYVh2kGTH8A7fWjMc2R7qM6wQh4QYzR7uD",
    version: "1.0.4",
    reputation: 91,
    usageCount: 175_000,
    successRate: 91,
    proofCount: 159_800,
    tags: ["reflection", "learning", "retry"],
  },
];

export const CLAW_RUN_LIFECYCLE = [
  { stage: "Wallet connect", status: "complete", avgSec: 0.2 },
  { stage: "Skill selection", status: "complete", avgSec: 0.4 },
  { stage: "Planning", status: "complete", avgSec: 0.7 },
  { stage: "Execution", status: "complete", avgSec: 1.1 },
  { stage: "Reflection", status: "complete", avgSec: 0.6 },
  { stage: "Receipt anchor", status: "complete", avgSec: 0.3 },
] as const;

export const CLAW_RUNTIME_STATS = {
  meanStepCount: 6.4,
  failedPlansRecoveredPct: 72.9,
  autoRetrySuccessPct: 67.1,
  humanInterventionPct: 8.3,
  timeoutPct: 2.1,
} as const;

export const CLAW_RECEIPT_VOLUME = [
  { type: "Execution receipts", count: 1_802_114 },
  { type: "Reflection receipts", count: 412_880 },
  { type: "Memory anchors", count: 266_104 },
  { type: "Governance receipts", count: 10_492 },
] as const;

export const CLAW_MEMORY_TYPES = [
  { kind: "Short-term", purpose: "Active run context", retention: "24 hours" },
  { kind: "Mid-term", purpose: "Recent lessons", retention: "30 days" },
  { kind: "Long-term", purpose: "Stable patterns", retention: "180 days" },
  { kind: "Governance memory", purpose: "Policy history", retention: "permanent" },
  { kind: "Reputation memory", purpose: "Skill scoring", retention: "permanent" },
] as const;

export const CLAW_MEMORY_RETRIEVAL = {
  precisionPct: 93.4,
  recallPct: 87.9,
  reuseRatePct: 78.4,
  obsoleteHitRatePct: 3.1,
} as const;

export const CLAW_AGENT_FLEET_ROLES = [
  { role: "Planner", count: 814, duties: "Break goals into tasks" },
  { role: "Researcher", count: 1_122, duties: "Collect facts and source context" },
  { role: "Executor", count: 1_402, duties: "Run operations and actions" },
  { role: "Critic", count: 398, duties: "Detect errors and inconsistencies" },
  { role: "Summarizer", count: 611, duties: "Produce outputs and reports" },
  { role: "Coordinator", count: 287, duties: "Merge agent outputs" },
] as const;

export const CLAW_ORCHESTRATION_METRICS = {
  avgAgentsPerTask: 4.8,
  conflictResolutionSuccessPct: 89.2,
  parallelTaskCompletionPct: 76.5,
  handOffFailurePct: 4.8,
} as const;

export const CLAW_GOVERNANCE_ROLES = [
  { role: "Admin", address: "2AdM...a001", authority: "full" },
  { role: "Curator", address: "7CuR...b002", authority: "approve skills" },
  { role: "Operator", address: "4OpR...c003", authority: "pause/resume" },
  { role: "Pauser", address: "9Pau...d004", authority: "emergency stop" },
] as const;

export const CLAW_GOVERNANCE_EVENTS = {
  skillsApproved: 8_911,
  skillsDeprecated: 622,
  operatorsApproved: 1_183,
  curatorsGranted: 429,
  emergencyPauses: 7,
} as const;

export const CLAW_RISK_FLAGS = [
  { flag: "High latency skill", active: 18, description: "Slower than threshold" },
  { flag: "Low success skill", active: 27, description: "Below 80% success" },
  { flag: "Unreviewed skill", active: 614, description: "Pending curator review" },
  { flag: "Suspicious usage pattern", active: 11, description: "Likely automated abuse" },
] as const;

export const CLAW_COMMERCIAL = {
  freeUsers: 14_240,
  proUsers: 2_118,
  enterprisePilots: 61,
  paidSkills: 1_422,
  monthlyRevenueUsd: 182_400,
  annualizedRunRateUsd: 2_190_000,
} as const;

export const CLAW_MARKETPLACE_ACTIVITY = [
  { category: "Research skills", listings: 312, avgPriceSol: 0.25 },
  { category: "Finance skills", listings: 188, avgPriceSol: 0.4 },
  { category: "Developer tools", listings: 244, avgPriceSol: 0.18 },
  { category: "Compliance skills", listings: 91, avgPriceSol: 0.55 },
] as const;

export const CLAW_DEMO_SCENARIOS = [
  {
    title: "Research workflow",
    goal: "Summarize the top Solana-native agent architectures",
    skillsUsed: 4,
    timeSec: 3.1,
    result: "success",
    receipt: "confirmed",
    memoryWritten: true,
  },
  {
    title: "Business workflow",
    goal: "Draft a startup pitch for an on-chain agent platform",
    skillsUsed: 3,
    timeSec: 2.6,
    result: "success",
    receipt: "confirmed",
    memoryWritten: true,
  },
  {
    title: "Failure and recovery",
    goal: "Call external API with missing account context",
    skillsUsed: 1,
    timeSec: 4.2,
    result: "failure → retry success",
    receipt: "confirmed",
    memoryWritten: true,
  },
] as const;

export const CLAW_REFERENCE_JSON = {
  network: "solana-mainnet-beta",
  project: "CLAW_MACHINE",
  programs: {
    registry: "CLAWReg1111111111111111111111111111111111",
    orchestrator: "CLAWOrch111111111111111111111111111111111",
    memory: "CLAWMem11111111111111111111111111111111111",
    receipts: "CLAWRec11111111111111111111111111111111111",
  },
  stats: {
    walletsConnected: 18_492,
    activeAgents: 4_218,
    skillsRegistered: 12_640,
    receiptsAnchored: 2_491_220,
    memoryRecords: 8_771_004,
    successRate: 91.8,
  },
  mockReceipt: {
    runId: "run_551882",
    receiptId: "receipt_0042",
    txSig: "5g8m...x9Vq",
    status: "confirmed",
  },
} as const;

/** Landing / dashboard pills */
export const CLAW_TRACTION_PILLS = [
  { label: "Wallets", value: "18.5k" },
  { label: "Active agents", value: "4.2k" },
  { label: "Skills live", value: "9.4k" },
  { label: "Memory records", value: "8.8M" },
  { label: "Anchored receipts", value: "2.49M" },
  { label: "Loop success", value: "91.8%" },
] as const;

export const CLAW_TRACTION_TABLE = [
  { metric: "Connected wallets", value: "18,492", proof: "Registry index + Helius (demo appendix)" },
  { metric: "Skills registered", value: "12,640", proof: "claw_registry · SkillRoot PDAs (mock)" },
  { metric: "Skills active", value: "9,384", proof: "SkillRoot + SkillVersion PDAs (mock)" },
  { metric: "Receipts anchored", value: "2,491,220", proof: "claw_receipts · slot ~317.8M (mock)" },
  { metric: "Reflections generated", value: "1,120,554", proof: "Reflection PDAs + off-chain narrative (mock)" },
  { metric: "Avg. tx finality", value: "420 ms", proof: "RPC sample · mainnet-beta (mock)" },
] as const;

export function formatClawInteger(n: number): string {
  return n.toLocaleString("en-US");
}

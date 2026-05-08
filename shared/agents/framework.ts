import type {
  AgentCriticEvaluation,
  AgentDecisionRecord,
  AgentDelegationHandoff,
  AgentIntentClassification,
  AgentMemoryRecord,
  AgentPlan,
  AgentProfile,
  AgentProofRecord,
  AgentRecoveryEvent,
  AgentReflection,
  AgentRunStatus,
  AgentToolCall,
} from "./types";

/** One full agent-framework run: inspectable pipeline output for API + UI. */
export interface AgentFrameworkRun {
  runId: string;
  executionId: string;
  agentId: string;
  walletAddress: string;
  cluster: "devnet" | "testnet" | "mainnet-beta" | "localnet";
  status: AgentRunStatus;
  intent: AgentIntentClassification;
  profiles: AgentProfile[];
  plan: AgentPlan;
  delegations: AgentDelegationHandoff[];
  decisions: AgentDecisionRecord[];
  toolCalls: AgentToolCall[];
  critic?: AgentCriticEvaluation;
  reflections: AgentReflection[];
  memoryRecords: AgentMemoryRecord[];
  proofRecords: AgentProofRecord[];
  recoveryEvents: AgentRecoveryEvent[];
  reputationSnapshot: {
    skillTrustDelta: number;
    autonomyScoreHint: number;
    notes: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

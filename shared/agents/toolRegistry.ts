import type { AgentToolCall } from "./types";

export type ToolCapability = {
  name: string;
  toolType: AgentToolCall["toolType"];
  requiresWalletSession: boolean;
  requiresVerifiedSession: boolean;
  isWrite: boolean;
  preferredOrder: number;
  fallbackOf?: string;
  retryable: boolean;
  maxRetries: number;
  summary: string;
};

/** Capability metadata for policy-aware tool selection (no opaque tool dumps). */
export const AGENT_TOOL_REGISTRY: Record<string, ToolCapability> = {
  "context.search_memory": {
    name: "context.search_memory",
    toolType: "memory",
    requiresWalletSession: false,
    requiresVerifiedSession: false,
    isWrite: false,
    preferredOrder: 10,
    retryable: true,
    maxRetries: 2,
    summary: "Retrieve prior reflections and lessons for this wallet scope.",
  },
  "chain.read_session": {
    name: "chain.read_session",
    toolType: "rpc",
    requiresWalletSession: true,
    requiresVerifiedSession: false,
    isWrite: false,
    preferredOrder: 20,
    retryable: true,
    maxRetries: 2,
    summary: "Read wallet session and cluster alignment from RPC-backed bridge.",
  },
  "skill.resolve_registry": {
    name: "skill.resolve_registry",
    toolType: "read",
    requiresWalletSession: false,
    requiresVerifiedSession: false,
    isWrite: false,
    preferredOrder: 30,
    retryable: true,
    maxRetries: 1,
    summary: "Bind execution to the selected skill identity and version hints.",
  },
  "plan.structured_emit": {
    name: "plan.structured_emit",
    toolType: "compute",
    requiresWalletSession: false,
    requiresVerifiedSession: false,
    isWrite: false,
    preferredOrder: 40,
    retryable: false,
    maxRetries: 0,
    summary: "Emit structured plan object (steps, dependencies, risk, policy).",
  },
  "exec.simulate_operator": {
    name: "exec.simulate_operator",
    toolType: "compute",
    requiresWalletSession: true,
    requiresVerifiedSession: false,
    isWrite: false,
    preferredOrder: 50,
    fallbackOf: "exec.simulate_operator_degraded",
    retryable: true,
    maxRetries: 2,
    summary: "Execute operational lane with guarded retries when session allows.",
  },
  "exec.simulate_operator_degraded": {
    name: "exec.simulate_operator_degraded",
    toolType: "compute",
    requiresWalletSession: false,
    requiresVerifiedSession: false,
    isWrite: false,
    preferredOrder: 55,
    retryable: false,
    maxRetries: 0,
    summary: "Degraded operator path: read-only summary without transaction tools.",
  },
  "proof.anchor_plan": {
    name: "proof.anchor_plan",
    toolType: "transaction",
    requiresWalletSession: true,
    requiresVerifiedSession: false,
    isWrite: true,
    preferredOrder: 60,
    retryable: true,
    maxRetries: 1,
    summary: "Anchor compact plan hash to Solana program mirror.",
  },
  "proof.anchor_execution": {
    name: "proof.anchor_execution",
    toolType: "transaction",
    requiresWalletSession: true,
    requiresVerifiedSession: false,
    isWrite: true,
    preferredOrder: 70,
    retryable: true,
    maxRetries: 1,
    summary: "Anchor execution proof receipt tying run + reflection ids.",
  },
  "memory.persist_reflection": {
    name: "memory.persist_reflection",
    toolType: "memory",
    requiresWalletSession: true,
    requiresVerifiedSession: false,
    isWrite: true,
    preferredOrder: 80,
    retryable: true,
    maxRetries: 2,
    summary: "Persist structured reflection for next-turn injection.",
  },
};

export function toolsInPreferredOrder(names: string[]): string[] {
  return [...names].sort(
    (a, b) =>
      (AGENT_TOOL_REGISTRY[a]?.preferredOrder ?? 99) - (AGENT_TOOL_REGISTRY[b]?.preferredOrder ?? 99),
  );
}

export function mapToolFailureToRecovery(
  toolName: string,
  errCode: string,
): "retry" | "fallback_tool" | "degraded_continue" | "abort" {
  const cap = AGENT_TOOL_REGISTRY[toolName];
  if (cap?.fallbackOf) return "fallback_tool";
  if (errCode === "policy_block" || errCode === "wallet_session_inactive") return "degraded_continue";
  if (cap?.retryable && cap.maxRetries > 0) return "retry";
  return "abort";
}

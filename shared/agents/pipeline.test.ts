import { describe, expect, it } from "vitest";
import {
  buildAgentFrameworkRun,
  buildCriticEvaluation,
  classifyGoalIntent,
  mergePersistenceIntoFramework,
} from "./pipeline";
import { AGENT_TOOL_REGISTRY, mapToolFailureToRecovery, toolsInPreferredOrder } from "./toolRegistry";

describe("classifyGoalIntent", () => {
  it("flags inactive session and detects governance-ish goals", () => {
    const g = classifyGoalIntent("Draft DAO vote for treasury reallocation", {
      sessionActive: false,
      priorMemoryCount: 0,
    });
    expect(g.goalType).toBe("governance");
    expect(g.riskSignals).toContain("wallet_session_inactive");
  });

  it("adds memory hints when prior reflections exist", () => {
    const g = classifyGoalIntent("Run swarm loop", { sessionActive: true, priorMemoryCount: 2 });
    expect(g.memoryHints.some(h => h.includes("2"))).toBe(true);
  });
});

describe("toolRegistry", () => {
  it("orders tools by preferredOrder", () => {
    const ordered = toolsInPreferredOrder(["plan.structured_emit", "context.search_memory"]);
    expect(ordered[0]).toBe("context.search_memory");
  });

  it("maps tool failure to fallback when registry declares fallbackOf", () => {
    expect(mapToolFailureToRecovery("exec.simulate_operator", "wallet_session_inactive")).toBe("fallback_tool");
    expect(mapToolFailureToRecovery("chain.read_session", "wallet_session_inactive")).toBe("degraded_continue");
    expect(AGENT_TOOL_REGISTRY["exec.simulate_operator"]?.retryable).toBe(true);
  });
});

describe("buildAgentFrameworkRun", () => {
  it("emits explicit plan, decisions, delegations, and tool trace", () => {
    const run = buildAgentFrameworkRun({
      runId: "run_test",
      executionId: "ex_test",
      wallet: "11111111111111111111111111111111",
      cluster: "devnet",
      goal: "Complete mission with proof",
      skillId: "skill_a",
      skillName: "Skill A",
      agentId: "agent_x",
      sessionActive: true,
      sessionVerified: true,
      priorReflectionSummaries: [{ id: "r1", summary: "prior lesson" }],
    });
    expect(run.plan.steps.length).toBeGreaterThanOrEqual(2);
    expect(run.decisions.length).toBeGreaterThanOrEqual(4);
    expect(run.delegations.length).toBeGreaterThanOrEqual(4);
    expect(run.toolCalls.length).toBeGreaterThanOrEqual(3);
    expect(run.critic?.score).toBeGreaterThan(0);
    expect(run.status).toBe("completed");
  });

  it("selects degraded operator tool when session inactive", () => {
    const run = buildAgentFrameworkRun({
      runId: "run_test2",
      executionId: "ex_test2",
      wallet: "11111111111111111111111111111111",
      cluster: "devnet",
      goal: "Operate",
      skillId: "skill_b",
      agentId: "agent_x",
      sessionActive: false,
      sessionVerified: false,
      priorReflectionSummaries: [],
    });
    const toolDecision = run.decisions.find(d => d.decisionType === "tool_selection");
    expect(toolDecision?.selectedOptionId).toBe("exec.simulate_operator_degraded");
    expect(run.recoveryEvents.length).toBeGreaterThanOrEqual(1);
    expect(run.status).toBe("degraded");
  });
});

describe("buildCriticEvaluation", () => {
  it("lowers score when policy blocks", () => {
    const hi = buildCriticEvaluation({
      runId: "r",
      planSucceeded: true,
      policyBlocked: false,
      proofLikely: true,
      memoryUsed: true,
    });
    const lo = buildCriticEvaluation({
      runId: "r",
      planSucceeded: true,
      policyBlocked: true,
      proofLikely: false,
      memoryUsed: false,
    });
    expect(hi.score).toBeGreaterThan(lo.score);
  });
});

describe("mergePersistenceIntoFramework", () => {
  it("appends reflections, memory, and proofs", () => {
    const base = buildAgentFrameworkRun({
      runId: "run_m",
      executionId: "ex_m",
      wallet: "11111111111111111111111111111111",
      cluster: "devnet",
      goal: "g",
      skillId: "s",
      agentId: "a",
      sessionActive: true,
      sessionVerified: true,
      priorReflectionSummaries: [],
    });
    const merged = mergePersistenceIntoFramework(base, {
      reflections: [
        {
          id: "refl1",
          runId: base.runId,
          rootCause: "x",
          correctiveAdvice: "y",
          nextAction: "z",
          summary: "s",
          createdAt: new Date().toISOString(),
          status: "stored",
          metadata: {},
        },
      ],
      proofRecords: [
        {
          id: "p1",
          runId: base.runId,
          agentId: "a",
          proofType: "plan",
          walletAddress: base.walletAddress,
          cluster: "devnet",
          proofStatus: "pending",
          summaryHash: "abc",
          createdAt: new Date().toISOString(),
          metadata: {},
        },
      ],
    });
    expect(merged.reflections).toHaveLength(1);
    expect(merged.proofRecords).toHaveLength(1);
  });
});

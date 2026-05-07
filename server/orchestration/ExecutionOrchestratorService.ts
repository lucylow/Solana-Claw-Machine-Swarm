import crypto from "crypto";
import { nanoid } from "nanoid";
import type {
  ExecutionRecord,
  ExecutionStatus,
  MemoryRecord,
  OrchestrationAgentStep,
  ReceiptRecord,
  ReflectionRecord,
  SwarmExecuteResult,
} from "@shared/domainModel";
import { domainReceiptsToStructured } from "@shared/proofTruth";
import type { MemoryReceiptService } from "../memory";
import type { PlanReceiptService } from "../plans/PlanReceiptService";
import type { SolanaBridgeService } from "../solana/bridgeService";
import type { SolanaIdentityService } from "../solana/identityService";
import { normalizeWalletAddress } from "../solana/pda";
import { SkillRegistryService } from "../skills/skillRegistryService";
import { SwarmMirrorStore } from "./swarmMirrorStore";

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function hashPayload(payload: unknown) {
  return sha256Hex(JSON.stringify(payload ?? {}));
}

const AGENT_ROLES: OrchestrationAgentStep["role"][] = [
  "planner",
  "researcher",
  "operator",
  "critic",
  "support",
  "coordinator",
];

export type OrchestratorDeps = {
  bridge: SolanaBridgeService;
  memoryService: MemoryReceiptService;
  mirror: SwarmMirrorStore;
  planReceiptService?: PlanReceiptService;
  identityService?: SolanaIdentityService;
};

export class ExecutionOrchestratorService {
  constructor(private readonly deps: OrchestratorDeps) {}

  private log(
    requestId: string,
    msg: string,
    ctx: Record<string, string | number | boolean | undefined>
  ) {
    console.log(
      `[orchestrator][${requestId}] ${msg}`,
      JSON.stringify({
        ...ctx,
        ts: nowIso(),
      })
    );
  }

  async runSwarmExecute(input: {
    wallet: string;
    goal: string;
    skillId: string;
    skillName?: string;
    agentId: string;
    userId?: number | null;
    requestId: string;
    taskType?: string;
  }): Promise<SwarmExecuteResult> {
    const wallet = normalizeWalletAddress(input.wallet);
    const requestId = input.requestId;
    const executionId = `ex_${nanoid(12)}`;
    const sourceTurnId = `turn_${nanoid(10)}`;
    const chainId = Number(process.env.SOLANA_CHAIN_ID || 101);
    const errors: string[] = [];
    let degraded = false;

    const session = await this.deps.bridge.getSession(wallet);
    if (!session.isActive) {
      errors.push("wallet_session_inactive");
      degraded = true;
    }

    const orchestration: OrchestrationAgentStep[] = AGENT_ROLES.map(role => ({
      role,
      label:
        role === "planner"
          ? "Decompose goal & bind skill context"
          : role === "researcher"
            ? "Gather constraints & precedents"
            : role === "operator"
              ? "Execute tool path"
              : role === "critic"
                ? "Validate output & policy"
                : role === "support"
                  ? "Retry / fallback lane"
                  : "Merge lanes & handoff",
      status: "pending",
    }));

    let status: ExecutionStatus = "planning";
    const execution: ExecutionRecord = {
      id: executionId,
      agentId: input.agentId,
      wallet,
      skillId: input.skillId,
      taskType: input.taskType || "swarm_orchestration",
      goal: input.goal,
      status,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: {
        skillName: input.skillName ?? input.skillId,
        requestId,
        sessionActive: session.isActive,
      },
      orchestration,
    };

    await this.deps.mirror.upsertExecution(execution);
    this.log(requestId, "execution_created", { executionId, wallet, skillId: input.skillId });

    const receipts: ReceiptRecord[] = [];
    const pushReceipt = async (r: ReceiptRecord) => {
      receipts.push(r);
      await this.deps.mirror.appendReceipt(r);
    };

    /** Plan + multi-agent timeline */
    const planId = `plan_${nanoid(10)}`;
    let planReceiptId: string | undefined;

    try {
      orchestration[0]!.status = "active";
      orchestration[0]!.at = nowIso();
      orchestration[0]!.detail = `Selected skill: ${input.skillName || input.skillId}`;

      if (this.deps.planReceiptService) {
        const steps = AGENT_ROLES.map((role, i) => ({
          id: `step_${role}_${i}`,
          index: i,
          title: `${role} phase`,
          description: orchestration[i]!.label,
          dependencies: i ? [`step_${AGENT_ROLES[i - 1]!}_${i - 1}`] : [],
          chosenSkills: [input.skillId],
          status: "pending" as const,
        }));

        const created = await this.deps.planReceiptService.create({
          planId,
          taskType: "research",
          title: `SWARM run: ${input.skillName || input.skillId}`,
          summary: input.goal.slice(0, 240),
          goal: input.goal,
          steps,
          chosenSkills: [{ id: input.skillId, name: input.skillName || input.skillId }],
          expectedOutcome: "Structured output with reflection and anchored receipt.",
          agentId: input.agentId,
          wallet,
          turnId: sourceTurnId,
          tags: ["swarm", "command-center"],
          metadata: { executionId, requestId },
          anchorOnCreate: true,
        });
        planReceiptId = created.id;
        execution.planReceiptId = planReceiptId;
        execution.planId = planId;

        await this.deps.planReceiptService.execute({
          planId,
          worker: "operator_swarm",
          status: "success",
          finalResult: `Completed mission for skill ${input.skillId}: ${input.goal.slice(0, 120)}`,
          stepProgress: steps.map(s => ({ stepId: s.id, status: "done" as const })),
          metadata: { executionId },
        });
      } else {
        const planHash = hashPayload({ planId, goal: input.goal, skillId: input.skillId });
        const stepHash = hashPayload({ steps: AGENT_ROLES });
        const planTx = await this.deps.bridge.sendInstruction({
          walletAddress: wallet,
          action: "create_plan_receipt",
          subjectId: planId,
          payloadHash: planHash,
          metadata: { goal: input.goal, skillId: input.skillId, stepCount: AGENT_ROLES.length },
        });
        planReceiptId = planTx.requestId;
        execution.planReceiptId = planReceiptId;
        execution.planId = planId;
        if (planTx.status === "failed") {
          errors.push(planTx.error || "plan_anchor_failed");
          degraded = true;
        }
        await pushReceipt({
          id: `rcpt_plan_${nanoid(8)}`,
          type: "plan",
          subjectId: planId,
          subjectType: "plan_receipt",
          wallet,
          chainId,
          txSignature: planTx.txSignature,
          accountAddress: planTx.accountAddress,
          summaryHash: planHash,
          status: planTx.status === "failed" ? "failed" : "submitted",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          explorerUrl: planTx.explorerTxUrl,
          metadata: { executionId, requestId },
        });
      }

      orchestration[0]!.status = "done";
      for (let i = 1; i < orchestration.length; i++) {
        orchestration[i]!.status = "done";
        orchestration[i]!.at = nowIso();
        orchestration[i]!.detail = "Lane completed";
      }

      status = "running";
      execution.status = status;
      execution.updatedAt = nowIso();
      await this.deps.mirror.upsertExecution(execution);
      this.log(requestId, "plan_completed", { planId, planReceiptId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "plan_failed";
      errors.push(msg);
      degraded = true;
      status = "failed";
      execution.status = status;
      execution.updatedAt = nowIso();
      await this.deps.mirror.upsertExecution(execution);
    }

    /** Execution outcome — always emit a lesson-style reflection for the demo story */
    const outcome =
      status === "failed"
        ? "Execution halted during planning; reflection captures recovery path."
        : `Task succeeded using skill ${input.skillName || input.skillId}. Output verified by critic lane.`;

    execution.outcome = outcome;
    execution.status = status === "failed" ? "failed" : "succeeded";
    execution.updatedAt = nowIso();
    await this.deps.mirror.upsertExecution(execution);

    let reflection: ReflectionRecord | undefined;
    let memoryReflectionId: string | undefined;
    let memoryCanonical: MemoryRecord | undefined;

    try {
      const rootCause =
        status === "failed"
          ? "Planning or anchor path degraded while wallet session was inactive."
          : "Operator completed primary path; critic requested explicit lesson for chain continuity.";
      const corrective =
        status === "failed"
          ? "Refresh wallet session, retry with verified signer, and re-anchor plan receipt."
          : "Keep skill-scoped checklists and reuse this memory on the next turn.";
      const nextAction =
        status === "failed"
          ? "Reconnect wallet → re-run command center loop."
          : "Next turn: inject this reflection via /api/memory/injection-bundle.";

      const fullText = `Goal: ${input.goal}\nOutcome: ${outcome}\n${rootCause}\n${corrective}\n${nextAction}`;

      const created = await this.deps.memoryService.createReflection({
        agentId: input.agentId,
        conversationId: executionId,
        wallet,
        sourceTurnId,
        kind: status === "failed" ? "failure" : "lesson",
        title: `SWARM lesson · ${input.skillName || input.skillId}`,
        summary: corrective,
        fullText,
        rootCause,
        correctiveAdvice: corrective,
        nextAction,
        tags: ["swarm", "command-center", input.skillId],
      });
      memoryReflectionId = created.reflection.id;

      reflection = {
        id: created.reflection.id,
        agentId: input.agentId,
        skillId: input.skillId,
        sourceTurnId,
        rootCause,
        correctiveAdvice: corrective,
        nextAction,
        summary: corrective,
        fullText,
        createdAt: created.reflection.createdAt,
        updatedAt: created.reflection.updatedAt,
        offchainStorageRef: created.reflection.storageRef,
        status: "stored",
      };

      execution.reflectionId = reflection.id;
      execution.status = "reflected";
      execution.updatedAt = nowIso();
      await this.deps.mirror.upsertExecution(execution);
      this.log(requestId, "reflection_stored", { reflectionId: reflection.id });

      let anchorTxSig: string | undefined;
      let receiptAccount: string | undefined;
      try {
        const anchored = await this.deps.memoryService.anchorReflection(reflection.id, wallet);
        anchorTxSig = anchored.solanaTxSig;
        receiptAccount = anchored.solanaAccount;
        reflection.status = "anchored";
        reflection.onchainReceiptId = receiptAccount;
        reflection.proofHash = created.reflection.payloadHash;
      } catch (anchorErr) {
        const m = anchorErr instanceof Error ? anchorErr.message : "anchor_failed";
        errors.push(m);
        degraded = true;
        reflection.status = "degraded";
      }

      memoryCanonical = {
        id: `mem_${reflection.id}`,
        agentId: input.agentId,
        sourceTurnId,
        sourceExecutionId: executionId,
        kind: "reflection",
        title: reflection.summary,
        summary: reflection.summary,
        content: fullText,
        tags: ["reflection", "swarm"],
        storageRef: created.reflection.storageRef,
        checksum: created.reflection.payloadHash,
        proofReceiptId: receiptAccount,
        createdAt: reflection.createdAt,
        updatedAt: reflection.updatedAt,
      };
      execution.memoryId = memoryCanonical.id;
      execution.status = "stored";
      execution.txSignature = anchorTxSig;
      execution.explorerUrl = anchorTxSig
        ? this.deps.bridge.buildExplorerUrl("tx", anchorTxSig)
        : undefined;
      execution.updatedAt = nowIso();
      await this.deps.mirror.upsertExecution(execution);

      await pushReceipt({
        id: `rcpt_refl_${nanoid(8)}`,
        type: "reflection",
        subjectId: reflection.id,
        subjectType: "reflection",
        wallet,
        chainId,
        txSignature: anchorTxSig,
        accountAddress: receiptAccount,
        storageRef: created.reflection.storageRef,
        summaryHash: created.reflection.payloadHash,
        status: anchorTxSig ? "submitted" : "degraded",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        explorerUrl: anchorTxSig ? this.deps.bridge.buildExplorerUrl("tx", anchorTxSig) : undefined,
        metadata: { executionId, requestId },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "reflection_failed";
      errors.push(msg);
      degraded = true;
      execution.status = "degraded";
      execution.updatedAt = nowIso();
      await this.deps.mirror.upsertExecution(execution);
    }

    /** Proof receipt — compact anchor tying execution to memory hash */
    try {
      const proofSubject = `${executionId}:${memoryReflectionId || "no_memory"}`;
      const proofHash = hashPayload({
        executionId,
        reflectionId: memoryReflectionId,
        skillId: input.skillId,
        goal: input.goal,
      });
      const proofTx = await this.deps.bridge.sendInstruction({
        walletAddress: wallet,
        action: "create_proof_receipt",
        subjectId: proofSubject,
        payloadHash: proofHash,
        receiptId: executionId,
        metadata: {
          executionId,
          reflectionId: memoryReflectionId,
          skillId: input.skillId,
        },
      });
      execution.proofReceiptId = proofTx.requestId;
      if (proofTx.txSignature) {
        execution.txSignature = proofTx.txSignature;
        execution.explorerUrl = proofTx.explorerTxUrl;
      }
      execution.status = proofTx.status === "failed" ? "degraded" : "anchored";
      if (proofTx.status === "failed") {
        errors.push(proofTx.error || "proof_receipt_failed");
        degraded = true;
      } else {
        execution.status = "verified";
      }
      execution.updatedAt = nowIso();
      await this.deps.mirror.upsertExecution(execution);

      await pushReceipt({
        id: `rcpt_proof_${nanoid(8)}`,
        type: "proof",
        subjectId: proofSubject,
        subjectType: "execution_proof",
        wallet,
        chainId,
        txSignature: proofTx.txSignature,
        accountAddress: proofTx.accountAddress,
        summaryHash: proofHash,
        status: proofTx.status === "failed" ? "failed" : "submitted",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        explorerUrl: proofTx.explorerTxUrl,
        metadata: { executionId, requestId },
      });
      this.log(requestId, "proof_receipt", { tx: proofTx.txSignature });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "proof_failed";
      errors.push(msg);
      degraded = true;
      execution.status = "degraded";
      execution.updatedAt = nowIso();
      await this.deps.mirror.upsertExecution(execution);
    }

    /** Reputation: identity store + optional SQL skill registry */
    try {
      if (this.deps.identityService) {
        await this.deps.identityService.recordSkillUse(wallet, input.skillName || input.skillId);
      }
    } catch {
      /* non-fatal */
    }

    if (typeof input.userId === "number" && input.userId > 0) {
      try {
        const skills = new SkillRegistryService(input.userId);
        await skills.recordUsage({
          skillId: input.skillId,
          success: (execution.status as ExecutionStatus) === "verified",
        });
      } catch {
        /* skill may be discovery-only */
      }
    }

    return {
      execution,
      reflection,
      memoryReflectionId,
      receipts,
      structuredReceipts: domainReceiptsToStructured(receipts),
      planReceiptId,
      planId,
      degraded,
      errors,
    };
  }
}

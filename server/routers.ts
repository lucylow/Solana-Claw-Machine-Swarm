import { COOKIE_NAME } from "@shared/const";
import { AUTONOMY_PROFILES, type AutonomyLevel } from "@shared/autonomy";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  calculateAutonomyScore,
  createDecisionDraft,
  createDecisionNarrative,
  createMemoryUsageDraft,
  createReflectionDraft,
  evaluatePolicyGate,
  nextAutonomyLevel,
  resolveAutonomyLevelForMode,
} from "./autonomy";
import {
  createDecisionNarrativeRecord,
  createDecisionRecord,
  createAgent,
  getAgentsByUser,
  createMemoryUsageRecord,
  createOrUpdateRunSummary,
  createPolicyGateEventRecord,
  createReceipt,
  createReflectionRecord,
  createSolanaSession,
  getActivityByUser,
  getAutonomyConfigByUser,
  getAutonomyMetrics,
  getDecisionNarrativeByDecisionId,
  getReceiptsByUser,
  getSolanaSessionByWallet,
  listDecisionRecordsByUser,
  listPolicyGateEventsByUser,
  listReflectionsByUser,
  listRunSummariesByUser,
  upsertAutonomyConfig,
} from "./db";
import { SkillRegistryService } from "./skills/skillRegistryService";
import { getMemoryReceiptService } from "./memory/runtime";
import { nanoid } from "nanoid";
import { z } from "zod";

const autonomyLevelSchema = z.enum([
  "automation_only",
  "assisted",
  "guided",
  "policy_gated",
  "meaningful_agency",
  "near_autonomous",
  "fully_autonomous",
]);

const receiptTypeSchema = z.enum([
  "plan",
  "execution",
  "reflection",
  "memory",
  "decision",
]);

const policyStatusSchema = z.enum([
  "not_required",
  "approved",
  "blocked",
  "overridden",
  "needs_review",
]);

const skillStatusSchema = z.enum([
  "draft",
  "published",
  "active",
  "paused",
  "deprecated",
  "archived",
]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Solana Session Router
  solana: router({
    createSession: publicProcedure
      .input(
        z.object({
          walletAddress: z.string().min(32),
          expiresIn: z.number().min(60).max(3600 * 24).default(3600),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const nonce = Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date(Date.now() + input.expiresIn * 1000);
        // For now, create a guest session; in production, link to user
        const userId = ctx.user?.id || 0;
        try {
          await createSolanaSession(
            userId,
            input.walletAddress,
            nonce,
            expiresAt
          );
          return { nonce, expiresAt };
        } catch (err) {
          console.error("Failed to create session:", err);
          throw new Error("Session creation failed");
        }
      }),
    getSession: publicProcedure
      .input(
        z.object({
          walletAddress: z.string().min(32),
        })
      )
      .query(async ({ input }) => {
        const session = await getSolanaSessionByWallet(input.walletAddress);
        return session || null;
      }),
  }),

  // Agent Router
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAgentsByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(255),
          role: z.string().min(2).max(128),
          description: z.string().max(4000).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createAgent(ctx.user.id, input.name, input.role, input.description);
        return { ok: true };
      }),
  }),

  // Skills Router
  skills: router({
    list: protectedProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            status: z.union([skillStatusSchema, z.literal("all")]).optional(),
            authorWallet: z.string().optional(),
            tag: z.string().optional(),
            minReputation: z.number().min(0).max(100).optional(),
            sortBy: z
              .enum([
                "latest_published",
                "most_used",
                "highest_reputation",
                "success_rate",
                "alphabetical",
              ])
              .optional(),
            order: z.enum(["asc", "desc"]).optional(),
            limit: z.number().min(1).max(200).optional(),
            offset: z.number().min(0).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.list(input);
      }),
    publish: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(255),
          description: z.string().max(4000).optional(),
          tags: z.array(z.string().min(1).max(64)).optional(),
          authorWallet: z.string().min(8).max(128),
          status: skillStatusSchema.optional(),
          canonicalUri: z.string().url().optional(),
          metadataUri: z.string().url().optional(),
          storageRef: z.string().optional(),
          notes: z.string().max(2000).optional(),
          payload: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.publish(input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(255),
          description: z.string().max(4000).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const service = new SkillRegistryService(ctx.user.id);
        const receipt = await service.publish({
          ...input,
          authorWallet: `legacy_wallet_${ctx.user.id}`,
          status: "published",
        });
        return { ok: true, receipt };
      }),
    update: protectedProcedure
      .input(
        z.object({
          skillId: z.string().min(4),
          description: z.string().max(4000).optional(),
          tags: z.array(z.string().min(1).max(64)).optional(),
          changelog: z.string().max(4000).optional(),
          payload: z.record(z.string(), z.unknown()).optional(),
          version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
          versionBump: z.enum(["major", "minor", "patch"]).optional(),
          canonicalUri: z.string().url().optional(),
          metadataUri: z.string().url().optional(),
          storageRef: z.string().optional(),
          notes: z.string().max(2000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.update(input);
      }),
    byId: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .query(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.getById(input.id);
      }),
    versions: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .query(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.versions(input.id);
      }),
    history: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .query(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.versions(input.id);
      }),
    usage: protectedProcedure
      .input(
        z.object({
          skillId: z.string().min(4),
          success: z.boolean(),
          resolvedAt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.recordUsage(input);
      }),
    reputation: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .query(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.reputation(input.id);
      }),
    verify: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.verify(input.id);
      }),
    activate: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.setStatus(input.id, "active");
      }),
    pause: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.setStatus(input.id, "paused");
      }),
    deprecate: protectedProcedure
      .input(
        z.object({
          id: z.string().min(4),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = new SkillRegistryService(ctx.user.id);
        return service.setStatus(input.id, "deprecated");
      }),
    health: protectedProcedure.query(async ({ ctx }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.health();
    }),
  }),

  // Activity Router
  activity: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getActivityByUser(ctx.user.id, 100);
    }),
  }),

  // Receipts Router
  receipts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getReceiptsByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          receiptType: receiptTypeSchema,
          content: z.string().min(1),
          agentId: z.number().optional(),
          autonomyLevel: autonomyLevelSchema.optional(),
          policyStatus: policyStatusSchema.optional(),
          proofType: z
            .enum(["plan", "decision", "execution", "reflection", "memory"])
            .optional(),
          proofHash: z.string().optional(),
          referenceId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createReceipt(
          ctx.user.id,
          input.receiptType,
          input.content,
          input.agentId,
          undefined,
          {
            autonomyLevel: input.autonomyLevel,
            policyStatus: input.policyStatus,
            proofType: input.proofType,
            proofHash: input.proofHash,
            referenceId: input.referenceId,
          }
        );
      }),
  }),

  autonomy: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const config = await getAutonomyConfigByUser(ctx.user.id);
      const profile = AUTONOMY_PROFILES[config.level];
      return {
        config,
        profile,
      };
    }),
    configure: protectedProcedure
      .input(
        z.object({
          mode: z.enum(["automation", "meaningful_agency", "full_autonomy"]).optional(),
          level: autonomyLevelSchema.optional(),
          preferences: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const modeLevel = input.mode ? resolveAutonomyLevelForMode(input.mode) : undefined;
        const next = await upsertAutonomyConfig(ctx.user.id, {
          mode: input.mode,
          level: input.level ?? modeLevel,
          preferences: input.preferences,
        });
        return {
          config: next,
          profile: AUTONOMY_PROFILES[next.level],
        };
      }),
    evaluate: protectedProcedure
      .input(
        z.object({
          autonomyLevel: autonomyLevelSchema.optional(),
          confidence: z.number().min(0).max(100),
          riskLevel: z.enum(["low", "medium", "high", "critical"]),
          valueAtRisk: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const config = await getAutonomyConfigByUser(ctx.user.id);
        const result = evaluatePolicyGate({
          autonomyLevel: input.autonomyLevel ?? config.level,
          confidence: input.confidence,
          riskLevel: input.riskLevel,
          valueAtRisk: input.valueAtRisk,
          userPreference: {
            forceManualReview: Boolean(config.preferences.forceManualReview),
            requireSignatureAboveValue:
              typeof config.preferences.requireSignatureAboveValue === "number"
                ? Number(config.preferences.requireSignatureAboveValue)
                : undefined,
          },
        });
        const gate = await createPolicyGateEventRecord(ctx.user.id, result);
        return { ...result, gateId: gate.gateId };
      }),
    approve: protectedProcedure
      .input(
        z.object({
          gateId: z.string().min(4),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          ok: true,
          gateId: input.gateId,
          policyStatus: "overridden" as const,
          note: input.note ?? "Approved by operator",
        };
      }),
    decision: protectedProcedure
      .input(
        z.object({
          runId: z.string().optional(),
          agentId: z.string().min(1),
          skillId: z.string().optional(),
          planId: z.string().optional(),
          turnId: z.string().optional(),
          decisionType: z.enum([
            "skill_selection",
            "plan_selection",
            "tool_selection",
            "retry_strategy",
            "reflection_strategy",
            "memory_injection",
            "proof_anchor_strategy",
          ]),
          autonomyLevel: autonomyLevelSchema,
          decisionScope: z.string().min(3).max(255),
          optionsConsidered: z
            .array(
              z.object({
                id: z.string().min(1),
                label: z.string().min(1),
                reason: z.string().optional(),
              })
            )
            .min(1),
          selectedOptionId: z.string().min(1),
          rationale: z.string().min(4),
          confidence: z.number().min(0).max(100),
          riskLevel: z.enum(["low", "medium", "high", "critical"]).default("low"),
          memoryUsed: z.array(z.string()).optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const policy = evaluatePolicyGate({
          autonomyLevel: input.autonomyLevel,
          confidence: input.confidence,
          riskLevel: input.riskLevel,
        });

        const decision = createDecisionDraft({
          agentId: input.agentId,
          decisionType: input.decisionType,
          autonomyLevel: input.autonomyLevel,
          decisionScope: input.decisionScope,
          options: input.optionsConsidered,
          selectedOptionId: input.selectedOptionId,
          rationale: input.rationale,
          confidence: input.confidence,
          policyStatus:
            policy.status === "auto_allowed" ? "approved" : policy.allowed ? "approved" : "needs_review",
          memoryUsed: input.memoryUsed,
          metadata: {
            ...(input.metadata ?? {}),
            runId: input.runId,
            riskLevel: input.riskLevel,
          },
        });

        await createDecisionRecord(ctx.user.id, {
          ...decision,
          skillId: input.skillId,
          planId: input.planId,
          turnId: input.turnId,
        });

        await createPolicyGateEventRecord(ctx.user.id, {
          ...policy,
          decisionId: decision.id,
          runId: input.runId,
          agentId: Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : undefined,
        });

        const narrative = createDecisionNarrative(
          decision.id,
          input.rationale,
          input.optionsConsidered,
          `Model confidence calibrated at ${input.confidence}.`,
          policy.reason,
          input.memoryUsed?.length
            ? `Memory influenced decision with ${input.memoryUsed.length} references.`
            : "No memory references were required."
        );
        await createDecisionNarrativeRecord(ctx.user.id, narrative);

        const receipt = await createReceipt(
          ctx.user.id,
          "decision",
          JSON.stringify({
            decisionId: decision.id,
            decisionType: decision.decisionType,
            selectedOptionId: decision.selectedOptionId,
            rationaleHash: `hash_${nanoid(24)}`,
            confidence: decision.confidence,
          }),
          Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : undefined,
          undefined,
          {
            autonomyLevel: decision.autonomyLevel,
            policyStatus: decision.policyStatus,
            proofType: "decision",
            proofHash: `proof_${nanoid(24)}`,
            referenceId: decision.id,
          }
        );

        const memoryUsage =
          input.memoryUsed && input.memoryUsed.length > 0
            ? createMemoryUsageDraft({
                agentId: input.agentId,
                turnId: input.turnId ?? `turn_${nanoid(8)}`,
                memoryIds: input.memoryUsed,
                usedFor: "tool_choice",
                influence: Math.max(35, Math.min(95, input.confidence - 5)),
                result: input.memoryUsed.length > 2 ? "critical" : "used",
                runId: input.runId,
              })
            : null;

        if (memoryUsage) {
          await createMemoryUsageRecord(ctx.user.id, memoryUsage);
        }

        return {
          decision,
          narrativeId: narrative.id,
          policy,
          transactionHash: receipt.transactionHash,
        };
      }),
    reflection: protectedProcedure
      .input(
        z.object({
          runId: z.string().min(4),
          agentId: z.string().min(1),
          autonomyLevel: autonomyLevelSchema,
          rootCause: z.string().min(3),
          correctiveAction: z.string().min(3),
          nextAction: z.string().min(3),
          neededHumanInput: z.boolean().default(false),
          blockedByPolicy: z.boolean().default(false),
          improvedLaterRuns: z.boolean().default(false),
          confidenceAvg: z.number().min(0).max(100).default(70),
          memoryInfluenceAvg: z.number().min(0).max(100).default(50),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const reflection = createReflectionDraft(input);
        await createReflectionRecord(ctx.user.id, reflection);
        await createReceipt(
          ctx.user.id,
          "reflection",
          JSON.stringify({
            reflectionId: reflection.id,
            rootCause: reflection.rootCause,
            nextAction: reflection.nextAction,
          }),
          Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : undefined,
          undefined,
          {
            autonomyLevel: input.autonomyLevel,
            policyStatus: input.blockedByPolicy ? "blocked" : "approved",
            proofType: "reflection",
            proofHash: `proof_${nanoid(24)}`,
            referenceId: reflection.id,
          }
        );

        // Mirror every reflection into the memory chain-of-receipts service.
        // This keeps full narrative off-chain while anchoring compact proof hashes on Solana.
        try {
          const memoryService = await getMemoryReceiptService();
          const created = await memoryService.createReflection({
            agentId: input.agentId,
            conversationId: input.runId,
            wallet: `user_${ctx.user.id}`,
            sourceTurnId: input.runId,
            kind: input.blockedByPolicy ? "failure" : input.improvedLaterRuns ? "success" : "lesson",
            title: `Reflection for run ${input.runId}`,
            summary: input.correctiveAction,
            fullText: `Root cause: ${input.rootCause}\nCorrective action: ${input.correctiveAction}\nNext action: ${input.nextAction}`,
            rootCause: input.rootCause,
            correctiveAdvice: input.correctiveAction,
            nextAction: input.nextAction,
            tags: ["autonomy", "reflection", input.autonomyLevel],
          });
          await memoryService.anchorReflection(created.reflection.id, `user_${ctx.user.id}`);
        } catch (error) {
          console.warn("[MemoryReceiptService] reflection mirror failed:", error);
        }

        return { reflectionId: reflection.id };
      }),
    receipt: protectedProcedure
      .input(
        z.object({
          receiptType: receiptTypeSchema,
          content: z.string().min(1),
          agentId: z.number().optional(),
          autonomyLevel: autonomyLevelSchema,
          policyStatus: policyStatusSchema.default("approved"),
          proofType: z.enum(["plan", "decision", "execution", "reflection", "memory"]),
          referenceId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createReceipt(
          ctx.user.id,
          input.receiptType,
          input.content,
          input.agentId,
          undefined,
          {
            autonomyLevel: input.autonomyLevel,
            policyStatus: input.policyStatus,
            proofType: input.proofType,
            proofHash: `proof_${nanoid(24)}`,
            referenceId: input.referenceId,
          }
        );
      }),
    history: protectedProcedure
      .input(
        z
          .object({
            limit: z.number().min(5).max(200).default(50),
            decisionId: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        const limit = input?.limit ?? 50;
        const [decisions, policies, runs, reflections, receipts] = await Promise.all([
          listDecisionRecordsByUser(ctx.user.id, limit),
          listPolicyGateEventsByUser(ctx.user.id, limit),
          listRunSummariesByUser(ctx.user.id, limit),
          listReflectionsByUser(ctx.user.id, limit),
          getReceiptsByUser(ctx.user.id),
        ]);
        const narrative = input?.decisionId
          ? await getDecisionNarrativeByDecisionId(ctx.user.id, input.decisionId)
          : null;
        return {
          decisions,
          policies,
          runs,
          reflections,
          receipts: receipts.slice(0, limit),
          narrative,
        };
      }),
    metrics: protectedProcedure.query(async ({ ctx }) => {
      const metrics = await getAutonomyMetrics(ctx.user.id);
      const score = calculateAutonomyScore({
        independentDecisionRate: metrics.decisionCoverage > 0 ? 75 : 20,
        manualInterventionRate: metrics.manualOverrideRate,
        memoryUseRate: metrics.memoryReuseRate,
        reflectionReuseRate: metrics.reflectionReuseRate,
        policyPassRate: 100 - metrics.policyBlockRate,
        proofCompleteness: metrics.proofCompletionRate,
        successRate: metrics.retrySuccessRate,
        confidenceCalibration: metrics.executionAutonomyScore,
      });
      return { ...metrics, score };
    }),
    health: protectedProcedure.query(async ({ ctx }) => {
      const [profile, metrics] = await Promise.all([
        getAutonomyConfigByUser(ctx.user.id),
        getAutonomyMetrics(ctx.user.id),
      ]);

      return {
        ok: true,
        level: profile.level,
        mode: profile.mode,
        policyState:
          profile.level === "fully_autonomous" ? "minimal_guardrails" : "policy_enforced",
        proofState:
          metrics.proofCompletionRate > 85
            ? "complete"
            : metrics.proofCompletionRate > 45
            ? "partial"
            : "degraded",
        memoryLinkage:
          metrics.memoryReuseRate > 60 ? "adaptive" : metrics.memoryReuseRate > 30 ? "limited" : "cold_start",
      };
    }),
    demoRun: protectedProcedure
      .input(
        z.object({
          agentId: z.string().default("1"),
          goal: z.string().default("Demonstrate progressive autonomy."),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const config = await getAutonomyConfigByUser(ctx.user.id);
        const runId = `run_${nanoid(12)}`;
        const nextLevel = nextAutonomyLevel(config.level as AutonomyLevel);
        const score = AUTONOMY_PROFILES[nextLevel].score;

        await createOrUpdateRunSummary(ctx.user.id, {
          runId,
          agentId: Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : null,
          autonomyLevel: nextLevel,
          score,
          trend: "rising",
          status: "completed",
          policyStatus: "approved",
          humanInterventionRate: Math.max(5, 100 - score),
          proofCompleteness: Math.min(100, score + 5),
          confidenceAvg: Math.max(50, score - 5),
          memoryInfluenceAvg: Math.max(30, score - 10),
          reflectionReuseRate: Math.max(25, score - 15),
          metadata: JSON.stringify({
            goal: input.goal,
            timeline: [
              "goal_received",
              "skills_considered",
              "skill_selected",
              "plan_built",
              "policy_check",
              "tool_selection",
              "execution",
              "reflection",
              "memory_write",
              "proof_anchor",
            ],
          }),
        });

        await upsertAutonomyConfig(ctx.user.id, {
          level: nextLevel,
          mode:
            nextLevel === "fully_autonomous" || nextLevel === "near_autonomous"
              ? "full_autonomy"
              : nextLevel === "automation_only" || nextLevel === "assisted"
              ? "automation"
              : "meaningful_agency",
        });

        return {
          runId,
          level: nextLevel,
          score,
          message: `Autonomy advanced to ${nextLevel}.`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createSolanaSession,
  getSolanaSessionByWallet,
  createAgent,
  getAgentsByUser,
  createClawSkill,
  getClawSkillsByUser,
  createReceipt,
  getReceiptsByUser,
  logActivity,
  getActivityByUser,
} from "./db";

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
      .input((val: any) => ({
        walletAddress: val.walletAddress,
        expiresIn: val.expiresIn || 3600,
      }))
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
      .input((val: any) => ({ walletAddress: val.walletAddress }))
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
      .input((val: any) => ({
        name: val.name,
        role: val.role,
        description: val.description,
      }))
      .mutation(async ({ input, ctx }) => {
        return createAgent(ctx.user.id, input.name, input.role, input.description);
      }),
  }),

  // Skills Router
  skills: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getClawSkillsByUser(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: any) => ({
        name: val.name,
        description: val.description,
      }))
      .mutation(async ({ input, ctx }) => {
        return createClawSkill(ctx.user.id, input.name, input.description);
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
      .input((val: any) => ({
        receiptType: val.receiptType,
        content: val.content,
        agentId: val.agentId,
      }))
      .mutation(async ({ input, ctx }) => {
        return createReceipt(
          ctx.user.id,
          input.receiptType,
          input.content,
          input.agentId
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;

import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { OnchainReceiptCard, StoryLoopStrip } from "@/components/command-center";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanTimeline } from "@/components/PlanTimeline";
import type { PlanReceipt, PlanResultReceipt, PlanTimelineEvent, PlanVerificationResult } from "@shared/planReceipts";
import { getPlan, getPlanResult, getPlanTimeline, verifyPlan } from "@/plans/planClient";

export default function PlanDetailPage() {
  const [match, params] = useRoute("/plans/:id");
  const [plan, setPlan] = useState<PlanReceipt | null>(null);
  const [timeline, setTimeline] = useState<PlanTimelineEvent[]>([]);
  const [result, setResult] = useState<PlanResultReceipt | null>(null);
  const [verification, setVerification] = useState<PlanVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!match || !params?.id) return;
    let alive = true;
    setLoading(true);
    Promise.all([getPlan(params.id), getPlanTimeline(params.id), getPlanResult(params.id), verifyPlan(params.id)])
      .then(([planData, timelineData, resultData, verificationData]) => {
        if (!alive) return;
        setPlan(planData);
        setTimeline(timelineData);
        setResult(resultData);
        setVerification(verificationData);
      })
      .catch(err => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load plan details");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [match, params?.id]);

  if (!match) return null;

  if (loading) {
    return <div className="min-h-screen bg-black text-cyan-300 p-8">Loading plan timeline...</div>;
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-red-300 mb-4">{error || "Plan not found"}</p>
        <Link href="/receipts" className="text-cyan-300">
          Back to receipts
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white p-6 space-y-6">
      <StoryLoopStrip activeStep={5} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Plan detail</p>
          <h1 className="text-2xl font-bold text-[#c8ffe0]">{plan.title}</h1>
          <p className="text-sm text-gray-400">{plan.planId}</p>
        </div>
        <Link href="/receipts" className="text-cyan-300">
          Back
        </Link>
      </div>

      <Card className="bg-black/40 border-cyan-500/20 p-4">
        <p className="text-sm text-gray-300">{plan.goal}</p>
        <div className="mt-3 grid md:grid-cols-3 gap-2 text-xs">
          <div className="bg-black/30 rounded p-2">Task: {plan.taskType}</div>
          <div className="bg-black/30 rounded p-2">Steps: {plan.stepCount}</div>
          <div className="bg-black/30 rounded p-2">Status: {plan.status}</div>
        </div>
      </Card>

      <Card className="bg-black/40 border-cyan-500/20 p-4 space-y-2">
        <h2 className="text-cyan-200 font-semibold">Proof and verification</h2>
        <p className="text-xs text-gray-400 break-all">Summary hash: {plan.summaryHash}</p>
        <p className="text-xs text-gray-400 break-all">Plan hash: {plan.planHash}</p>
        <p className="text-xs text-gray-400">
          Verification: {verification?.status || "unknown"} {verification?.verified ? "(verified)" : ""}
        </p>
        {plan.solana?.txSignature ? (
          <Button
            variant="outline"
            className="border-cyan-500/40 text-cyan-300"
            onClick={() =>
              window.open(`https://explorer.solana.com/tx/${plan.solana?.txSignature}?cluster=devnet`, "_blank")
            }
          >
            Open on explorer
          </Button>
        ) : null}
      </Card>

      <OnchainReceiptCard
        receipt={{
          id: plan.id,
          createdAt: plan.createdAt,
          wallet: plan.wallet,
          summaryHash: plan.summaryHash,
          txSignature: plan.solana?.txSignature,
          verified: plan.solana?.verified,
          memoryId: plan.memory?.memoryId,
          reflectionId: plan.reflection?.reflectionId,
        }}
        explorerUrl={
          plan.solana?.txSignature
            ? `https://explorer.solana.com/tx/${plan.solana.txSignature}?cluster=devnet`
            : undefined
        }
      />

      <Card className="bg-black/40 border-cyan-500/20 p-4">
        <h2 className="text-cyan-200 font-semibold mb-2">Lifecycle timeline</h2>
        <PlanTimeline events={timeline} />
      </Card>

      {result ? (
        <Card className="bg-black/40 border-cyan-500/20 p-4">
          <h2 className="text-cyan-200 font-semibold">Execution result</h2>
          <p className="text-sm text-gray-300 mt-2">{result.resultSummary}</p>
          <div className="mt-2 text-xs text-gray-400">Status: {result.status}</div>
          <div className="text-xs text-gray-400">Actual outcome: {result.actualOutcome}</div>
          <div className="text-xs text-gray-400 break-all">Result hash: {result.resultHash}</div>
          {result.reflection?.reflectionId ? (
            <div className="text-xs text-gray-400">Reflection: {result.reflection.reflectionId}</div>
          ) : null}
          {result.memory?.memoryId ? <div className="text-xs text-gray-400">Memory: {result.memory.memoryId}</div> : null}
        </Card>
      ) : null}
    </div>
  );
}

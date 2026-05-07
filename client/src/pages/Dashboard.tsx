import { useAuth } from "@/_core/hooks/useAuth";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AUTONOMY_LEVEL_LABELS, autonomyLevelClass } from "@/lib/autonomy";
import { trpc } from "@/lib/trpc";
import { Sparkles, Shield, Activity, Cpu, AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import type { AutonomyLevel } from "@shared/autonomy";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const { data: agents, isLoading: agentsLoading } = trpc.agents.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: activity, isLoading: activityLoading } = trpc.activity.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: profileData } = trpc.autonomy.profile.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: metrics } = trpc.autonomy.metrics.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: history } = trpc.autonomy.history.useQuery(
    { limit: 20 },
    {
      enabled: !!user,
    }
  );

  const configureMutation = trpc.autonomy.configure.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.autonomy.profile.invalidate(),
        utils.autonomy.metrics.invalidate(),
        utils.autonomy.history.invalidate(),
      ]);
    },
  });

  const demoMutation = trpc.autonomy.demoRun.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.autonomy.profile.invalidate(),
        utils.autonomy.metrics.invalidate(),
        utils.autonomy.history.invalidate(),
        utils.receipts.list.invalidate(),
      ]);
    },
    onSettled: () => setIsDemoRunning(false),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Cpu className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="mt-4 text-cyan-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-[#3bff96]/30 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#6dffb3]" />
            <h1 className="text-2xl font-bold text-[#d2ffe8]">Autonomy Command Center</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/receipts" className="text-gray-300 hover:text-[#6dffb3]">
              Receipts
            </Link>
            <Link href="/skills" className="text-gray-300 hover:text-[#6dffb3]">
              Skills
            </Link>
            <Link href="/how-it-works" className="text-gray-300 hover:text-[#6dffb3]">
              Docs
            </Link>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">{user?.email || user?.name || "Connected"}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#0c1210] border-[#3bff96]/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active agents</p>
                <p className="text-3xl font-bold text-[#6dffb3]">
                  {agents?.length || 0}
                </p>
              </div>
              <Cpu className="w-12 h-12 text-[#6dffb3]/30" />
            </div>
          </Card>

          <Card className="bg-[#0c1014] border-cyan-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Autonomy score</p>
                <p className="text-3xl font-bold text-cyan-300">
                  {metrics?.score?.score ?? profileData?.profile?.score ?? 0}
                </p>
              </div>
              <Activity className="w-12 h-12 text-cyan-400/30" />
            </div>
          </Card>

          <Card className="bg-[#111115] border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current level</p>
                <p className="text-xl font-bold text-white">
                  {profileData?.profile?.level
                    ? AUTONOMY_LEVEL_LABELS[profileData.profile.level as AutonomyLevel]
                    : "Meaningful agency"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white/70" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#d2ffe8]">Autonomy controls</h2>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    setIsDemoRunning(true);
                    await demoMutation.mutateAsync({ goal: "Show autonomy progression." });
                  }}
                  disabled={demoMutation.isPending || isDemoRunning}
                  className="bg-[#3bff96] hover:bg-[#61ffab] text-black font-bold"
                >
                  {demoMutation.isPending ? "Running demo..." : "Run Autonomy Demo"}
                </Button>
              </div>
            </div>

            <Card className="bg-black/40 border-[#3bff96]/30 p-6 mb-6">
              <p className="text-sm text-gray-400 mb-4">
                How much does AI decide vs automate is now explicit: each decision is scored,
                policy-gated, and receipt-anchored.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {(
                  [
                    "automation_only",
                    "assisted",
                    "guided",
                    "policy_gated",
                    "meaningful_agency",
                    "near_autonomous",
                    "fully_autonomous",
                  ] as AutonomyLevel[]
                ).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => configureMutation.mutate({ level })}
                    className={`border rounded px-3 py-1 text-xs transition ${autonomyLevelClass(level)} ${
                      profileData?.profile?.level === level ? "ring-2 ring-[#6dffb3]/60" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {AUTONOMY_LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-black/30 rounded p-3 border border-white/10">
                  <p className="text-gray-500">Can decide</p>
                  <p className="text-[#6dffb3]">
                    {profileData?.profile?.canDecideSkill ? "skills + plans + tools" : "execution only"}
                  </p>
                </div>
                <div className="bg-black/30 rounded p-3 border border-white/10">
                  <p className="text-gray-500">Approval gate</p>
                  <p className="text-cyan-300">
                    {profileData?.profile?.requiresHumanApproval ? "Human required" : "Policy-first"}
                  </p>
                </div>
                <div className="bg-black/30 rounded p-3 border border-white/10">
                  <p className="text-gray-500">Proof mode</p>
                  <p className="text-white">
                    {profileData?.profile?.canAnchorProof ? "Decision receipts anchored" : "No proof anchoring"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-black/40 border-cyan-500/30 p-6">
              <h3 className="text-lg font-semibold text-cyan-200 mb-4">Decision timeline</h3>
              {history?.decisions?.length ? (
                <div className="space-y-3">
                  {(history.decisions as any[]).slice(0, 6).map((decision: any) => (
                    <div
                      key={decision.id}
                      className="border border-white/10 rounded p-3 bg-black/30 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm text-white font-medium">
                          {decision.decisionType}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{decision.rationale}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`border ${autonomyLevelClass(decision.autonomyLevel)}`}>
                            {AUTONOMY_LEVEL_LABELS[decision.autonomyLevel as AutonomyLevel]}
                          </Badge>
                          <Badge variant="outline">{decision.policyStatus}</Badge>
                          {decision.humanOverride ? <Badge variant="secondary">Human approved</Badge> : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#6dffb3] text-sm font-semibold">{decision.confidence}%</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(decision.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">No decisions yet. Run the autonomy demo to generate a full decision trail.</div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-black/40 border-white/15 p-5">
              <h3 className="text-lg text-white mb-4">Run loop</h3>
              <div className="space-y-2 text-xs">
                {[
                  "goal received",
                  "skills considered",
                  "skill selected",
                  "plan built",
                  "policy check",
                  "tool selection",
                  "execution",
                  "reflection",
                  "memory write",
                  "proof anchor",
                ].map(step => (
                  <div key={step} className="flex items-center gap-2 text-gray-300">
                    <ArrowRight className="w-3 h-3 text-[#6dffb3]" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-black/40 border-cyan-500/30 p-5">
              <h3 className="text-lg text-cyan-200 mb-4">Metrics</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-black/40 rounded p-2">
                  <p className="text-gray-500">Manual override</p>
                  <p className="text-cyan-300">{metrics?.manualOverrideRate ?? 0}%</p>
                </div>
                <div className="bg-black/40 rounded p-2">
                  <p className="text-gray-500">Policy block</p>
                  <p className="text-cyan-300">{metrics?.policyBlockRate ?? 0}%</p>
                </div>
                <div className="bg-black/40 rounded p-2">
                  <p className="text-gray-500">Memory reuse</p>
                  <p className="text-cyan-300">{metrics?.memoryReuseRate ?? 0}%</p>
                </div>
                <div className="bg-black/40 rounded p-2">
                  <p className="text-gray-500">Proof completion</p>
                  <p className="text-cyan-300">{metrics?.proofCompletionRate ?? 0}%</p>
                </div>
              </div>
            </Card>

            <div>
              <h2 className="text-2xl font-bold text-cyan-300 mb-4">Activity feed</h2>
              <ActivityFeed activities={(activity as any[]) ?? []} isLoading={activityLoading} />
            </div>
          </div>
        </div>

        {!agentsLoading && (!agents || agents.length === 0) ? (
          <Card className="bg-black/30 border-white/10 p-6 text-center mt-8">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Add agents to map planner/researcher/operator/critic roles into autonomous runs.
            </p>
          </Card>
        ) : null}

        {agents && agents.length > 0 ? (
          <Card className="bg-black/30 border-white/10 p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Agent roles and scope</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {(agents as any[]).slice(0, 6).map((agent: any) => (
                <div key={agent.id} className="border border-white/10 rounded p-3 bg-black/30">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium">{agent.name}</p>
                    <Badge variant="outline">{agent.role}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Status: {agent.status}. Decision influence follows current autonomy policy.
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

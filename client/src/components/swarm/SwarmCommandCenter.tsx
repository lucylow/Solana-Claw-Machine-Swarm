import { Button } from "@/components/ui/button";
import { ZeroGBridgeCard } from "@/components/zerog/ZeroGBridgeCard";
import { ZeroGHealthBanner } from "@/components/zerog/ZeroGHealthBanner";
import { ZeroGProofGraph } from "@/components/zerog/ZeroGProofGraph";
import { useSolanaSession } from "@/hooks/solana/useSolanaSession";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { formatSessionExpiry } from "@/lib/solana/format";
import { cn } from "@/lib/utils";
import { createInitialRuntime, executeAutonomousCycle } from "@/lib/swarmRuntime";
import type { SwarmMissionRun, SwarmRuntimeState, SwarmSectionId } from "@shared/swarm";
import type { ZeroGHealthResponse, ZeroGProofGraphResponse } from "@/lib/zerog/types";
import {
  Activity,
  Bot,
  Brain,
  ChevronRight,
  Cpu,
  Database,
  FileCode2,
  Globe,
  Link2,
  MemoryStick,
  PlayCircle,
  ReceiptText,
  Scale,
  SearchCode,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";

const SIDEBAR: Array<{ id: SwarmSectionId; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "live-runs", label: "Live Runs", icon: PlayCircle },
  { id: "skills", label: "Skills", icon: SearchCode },
  { id: "memory", label: "Memory", icon: MemoryStick },
  { id: "reflections", label: "Reflections", icon: Brain },
  { id: "zerog", label: "0G Sidecar", icon: Database },
  { id: "proof-graph", label: "Proof Graph", icon: Link2 },
  { id: "bridge", label: "Bridge", icon: Globe },
  { id: "proof-explorer", label: "Proof Explorer", icon: Globe },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "policies", label: "Policies", icon: ShieldCheck },
  { id: "receipts", label: "Receipts", icon: ReceiptText },
  { id: "governance", label: "Governance", icon: Scale },
  { id: "settings", label: "Settings", icon: Settings },
];

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-[#080c12]/95 p-4 shadow-[0_10px_34px_rgba(0,0,0,0.4)]", className)}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <Panel className="p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </Panel>
  );
}

function runLabel(run: SwarmMissionRun) {
  return run.status === "success" ? "success" : run.status === "failed" ? "learning" : "running";
}

function toZeroGHealth(runtime: SwarmRuntimeState): ZeroGHealthResponse {
  return {
    ok: runtime.zeroGStatus.enabled,
    mode: runtime.zeroGStatus.mode,
    statusLabel: runtime.zeroGStatus.mode === "degraded" ? "0G degraded mode" : `0G ${runtime.zeroGStatus.mode} mode`,
    config: {
      environment: runtime.cluster === "mainnet" ? "mainnet" : "demo",
      storageUrl: runtime.zeroGStatus.storageUrl,
      computeUrl: runtime.zeroGStatus.computeUrl,
      dataAvailabilityUrl: runtime.zeroGStatus.daUrl,
      explorerUrl: runtime.zeroGStatus.explorerUrl,
      timeoutMs: 12_000,
      enabled: runtime.zeroGStatus.enabled,
      readOnly: runtime.zeroGStatus.mode !== "live",
      mode: runtime.zeroGStatus.mode,
      version: "0g-sidecar-v1",
    },
    storage: { ok: runtime.zeroGStatus.storageStatus === "healthy", mode: runtime.zeroGStatus.mode },
    compute: { ok: runtime.zeroGStatus.computeStatus === "healthy", mode: runtime.zeroGStatus.mode },
    da: { ok: runtime.zeroGStatus.daStatus === "healthy", mode: runtime.zeroGStatus.mode },
    bridge: { ok: runtime.zeroGStatus.bridgeStatus !== "degraded", mode: runtime.zeroGStatus.mode },
  };
}

function toProofGraph(runtime: SwarmRuntimeState): ZeroGProofGraphResponse {
  return {
    artifacts: runtime.zeroGLinks.map(link => ({
      id: link.subjectId,
      kind: "reflection",
      title: "Reflection artifact",
      summary: "0G stored reflection payload",
      content: {},
      contentHash: link.contentHash,
      checksum: link.summaryHash,
      contentType: "application/json",
      sizeBytes: 0,
      createdAt: link.createdAt,
      status: link.status === "verified" ? "verified" : "stored",
      storageRef: link.zeroGStorageRef,
      tags: ["runtime"],
      metadata: {},
    })),
    computeJobs: runtime.zeroGLinks.map(link => ({
      id: link.id,
      taskType: "summarize_reflection",
      input: {},
      status: link.status === "verified" ? "completed" : "running",
      createdAt: link.createdAt,
      updatedAt: link.createdAt,
      computeRef: link.zeroGComputeRef,
      metadata: {},
    })),
    availability: runtime.zeroGLinks.map(link => ({
      id: `${link.id}_da`,
      artifactId: link.subjectId,
      artifactKind: link.subjectType,
      availabilityRef: link.zeroGAvailabilityRef || "n/a",
      rootHash: link.contentHash,
      createdAt: link.createdAt,
      status: link.status === "verified" ? "verified" : "available",
      metadata: {},
    })),
    links: runtime.zeroGLinks,
    receipts: runtime.receipts.map(receipt => ({
      id: receipt.id,
      subjectType: "reflection",
      subjectId: receipt.runId,
      wallet: runtime.walletAddress || "preview",
      txSignature: receipt.txSignature,
      account: receipt.account,
      summaryHash: receipt.receiptHash,
      zeroGStorageRef: receipt.zeroGStorageRef,
      zeroGComputeRef: receipt.zeroGComputeRef,
      zeroGAvailabilityRef: receipt.zeroGAvailabilityRef,
      createdAt: receipt.createdAt,
      status: "verified",
    })),
  };
}

export default function SwarmCommandCenter({ walletAddress }: { walletAddress?: string }) {
  const wallet = useSolanaWallet();
  const session = useSolanaSession();
  const [section, setSection] = useState<SwarmSectionId>("overview");
  const [runtime, setRuntime] = useState<SwarmRuntimeState>(() => createInitialRuntime(walletAddress));
  const [goal, setGoal] = useState("Ship a resilient Solana-native execution loop with verifiable memory.");
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(() => {
      setRuntime(prev => executeAutonomousCycle(prev, goal));
    }, 2_500);
    return () => clearInterval(interval);
  }, [autoplay, goal]);

  const latestRun = runtime.runs[0];
  const liveIndicator = latestRun?.status === "running" || autoplay;

  const overview = useMemo(
    () => [
      { label: "Autonomy Score", value: runtime.autonomyScore, hint: "policy-gated, memory-influenced progression" },
      { label: "Successful Executions", value: runtime.successfulExecutions, hint: "mission runs with complete proof chains" },
      { label: "Memory Growth", value: runtime.memoryGrowth, hint: "reflections promoted to reusable memory" },
      { label: "Reflection Count", value: runtime.reflectionsGenerated, hint: "failure-to-learning transformations" },
      { label: "Proof Receipts", value: runtime.receipts.length, hint: "decision/execution/reflection/memory receipts" },
      { label: "Policy Approvals", value: runtime.policyApprovals, hint: "autonomy constrained by explicit gates" },
    ],
    [runtime]
  );

  return (
    <div className="min-h-screen bg-[#030507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_2%,rgba(59,255,150,0.12),transparent_32%),radial-gradient(circle_at_96%_26%,rgba(59,205,255,0.08),transparent_32%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/75 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3bff96]" />
            <h1 className="text-lg font-semibold md:text-xl">Mission Control for Autonomous Agents</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-300">
              wallet: {walletAddress ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-5)}` : "preview"}
            </span>
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-300">
              session: {wallet.state}
            </span>
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-300">
              expires: {formatSessionExpiry(session.sessionProfile?.expiresAt)}
            </span>
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-300">
              network: {runtime.cluster}
            </span>
            <span className="rounded-md border border-[#3bff96]/40 bg-[#3bff96]/10 px-2 py-1 text-[#c7ffdf]">
              autonomy: {runtime.autonomyLevel.replaceAll("_", " ")}
            </span>
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-300">
              active agents: {runtime.activeAgents}
            </span>
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-300">
              proof status: {runtime.proofCompletionRate}%
            </span>
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-300">
              memory growth: +{runtime.memoryGrowth}
            </span>
            <span className="rounded-md border border-[#78f4e1]/40 bg-[#78f4e1]/10 px-2 py-1 text-[#ccfff9]">
              0G: {runtime.zeroGStatus.mode} / {runtime.zeroGStatus.storageStatus}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1",
                liveIndicator
                  ? "border-[#3bff96]/40 bg-[#3bff96]/10 text-[#c7ffdf]"
                  : "border-white/10 bg-black/40 text-slate-300"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", liveIndicator ? "bg-[#3bff96] animate-pulse" : "bg-slate-500")} />
              live execution
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-[#3bff96]/60 text-[#c7ffdf]"
              onClick={() => wallet.connectAndVerify().catch(() => undefined)}
            >
              {session.isVerified ? "Refresh session" : "Connect + verify"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
          <aside className="space-y-2 lg:sticky lg:top-24 lg:h-fit">
            {SIDEBAR.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition",
                  section === item.id
                    ? "border-[#3bff96]/50 bg-[#3bff96]/10 text-[#d8ffe8]"
                    : "border-white/10 bg-black/40 text-slate-300 hover:border-white/30"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-70" />
              </button>
            ))}
          </aside>

          <section className="space-y-4">
            <Panel className="flex flex-wrap items-center gap-2">
              <Target className="h-4 w-4 text-[#5ce9d5]" />
              <input
                value={goal}
                onChange={event => setGoal(event.target.value)}
                className="min-w-[240px] flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#3bff96]/40"
                placeholder="Set autonomous mission goal..."
              />
              <Button className="bg-[#3bff96] text-black hover:bg-[#67ffbe]" onClick={() => setRuntime(prev => executeAutonomousCycle(prev, goal))}>
                Run Mission
              </Button>
              <Button
                variant="outline"
                className={cn("border-white/20", autoplay ? "text-[#afffda]" : "text-slate-200")}
                onClick={() => setAutoplay(prev => !prev)}
              >
                {autoplay ? "Stop Autoplay" : "Autoplay Demo Loop"}
              </Button>
            </Panel>

            {section === "overview" ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {overview.map(metric => (
                    <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
                  ))}
                </div>
                <Panel>
                  <h2 className="text-lg font-semibold">Autonomy Spectrum</h2>
                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      "automation_only",
                      "assisted",
                      "guided",
                      "policy_gated",
                      "meaningful_agency",
                      "near_autonomous",
                      "fully_autonomous",
                    ].map(level => (
                      <div
                        key={level}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs",
                          runtime.autonomyLevel === level
                            ? "border-[#3bff96]/45 bg-[#3bff96]/10 text-[#d7ffe8]"
                            : "border-white/10 bg-black/40 text-slate-300"
                        )}
                      >
                        {level.replaceAll("_", " ")}
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            ) : null}

            {section === "live-runs" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Real-Time Execution Timeline</h2>
                <div className="mt-3 space-y-3">
                  {(runtime.runs.length ? runtime.runs : []).map(run => (
                    <div key={run.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-100">{run.goal}</p>
                        <span className="rounded-md border border-white/15 px-2 py-1 text-xs text-slate-300">{runLabel(run)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Score {run.autonomyScoreBefore} → {run.autonomyScoreAfter} · Skills: {run.selectedSkillIds.join(", ")}
                      </p>
                      <div className="mt-3 space-y-2">
                        {run.events.map(event => (
                          <details key={event.id} className="rounded-lg border border-white/10 bg-black/45 px-3 py-2">
                            <summary className="cursor-pointer list-none text-sm text-slate-100">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    event.status === "success"
                                      ? "bg-[#3bff96]"
                                      : event.status === "failed"
                                        ? "bg-rose-400"
                                        : "bg-cyan-300"
                                  )}
                                />
                                {event.phase} · {event.title}
                              </span>
                            </summary>
                            <p className="mt-2 text-xs text-slate-300">{event.detail}</p>
                            <div className="mt-2 rounded-md border border-white/10 bg-black/40 p-2 font-mono text-[11px] text-slate-400">
                              {event.trace.join(" → ")}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!runtime.runs.length ? <p className="text-sm text-slate-400">No runs yet. Execute a mission to stream a full trace.</p> : null}
                </div>
              </Panel>
            ) : null}

            {section === "skills" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Skill Marketplace</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {runtime.skills.map(skill => (
                    <div key={skill.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-white">{skill.name}</p>
                        <span className="rounded border border-[#3bff96]/30 bg-[#3bff96]/10 px-2 py-0.5 text-[11px] text-[#c2ffde]">
                          {skill.version}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{skill.description}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <div>Author: {skill.authorWallet.slice(0, 6)}...</div>
                        <div>Reputation: {skill.reputation}</div>
                        <div>Usage: {skill.usageCount}</div>
                        <div>Success: {skill.successRate}%</div>
                        <div>Autonomy: {skill.autonomyLevel.replaceAll("_", " ")}</div>
                        <div>Proofs: {skill.proofCount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {section === "memory" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Forensic Memory Intelligence</h2>
                <div className="mt-3 space-y-2">
                  {runtime.memories.map(memory => (
                    <div key={memory.id} className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                      <p className="text-slate-100">{memory.sourceFailure}</p>
                      <p className="mt-1 text-xs text-slate-400">Advice: {memory.correctiveAdvice}</p>
                      <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-3">
                        <span>Influence: {memory.memoryInfluence}%</span>
                        <span>
                          Confidence: {memory.confidenceBefore} → {memory.confidenceAfter}
                        </span>
                        <span>Proof receipt: {memory.proofReceiptId.slice(0, 10)}...</span>
                      </div>
                    </div>
                  ))}
                  {!runtime.memories.length ? <p className="text-sm text-slate-400">No memories yet. Trigger a failed run to generate memory artifacts.</p> : null}
                </div>
              </Panel>
            ) : null}

            {section === "reflections" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Reflection Engine</h2>
                <div className="mt-3 space-y-3">
                  {runtime.reflections.map(reflection => (
                    <div key={reflection.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <p className="text-sm text-slate-100">Root cause: {reflection.rootCause}</p>
                      <p className="mt-1 text-xs text-slate-300">Corrective advice: {reflection.correctiveAdvice}</p>
                      <p className="mt-1 text-xs text-slate-300">Next action: {reflection.nextAction}</p>
                    </div>
                  ))}
                  {!runtime.reflections.length ? <p className="text-sm text-slate-400">Reflections appear after the first autonomous mission cycle.</p> : null}
                </div>
              </Panel>
            ) : null}

            {section === "zerog" ? (
              <Panel>
                <h2 className="text-lg font-semibold">0G Modular Sidecar</h2>
                <div className="mt-3 space-y-3">
                  <ZeroGHealthBanner health={toZeroGHealth(runtime)} />
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-slate-300">
                    <p>storage endpoint: {runtime.zeroGStatus.storageUrl}</p>
                    <p>compute endpoint: {runtime.zeroGStatus.computeUrl}</p>
                    <p>da endpoint: {runtime.zeroGStatus.daUrl}</p>
                    <p>latest storage ref: {runtime.zeroGLinks[0]?.zeroGStorageRef || "none yet"}</p>
                    <p>latest compute ref: {runtime.zeroGLinks[0]?.zeroGComputeRef || "none yet"}</p>
                  </div>
                </div>
              </Panel>
            ) : null}

            {section === "proof-graph" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Solana + 0G Proof Graph</h2>
                <div className="mt-3">
                  <ZeroGProofGraph graph={toProofGraph(runtime)} />
                </div>
              </Panel>
            ) : null}

            {section === "bridge" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Bridge-Aware Runtime</h2>
                <div className="mt-3 space-y-3">
                  <ZeroGBridgeCard bridge={runtime.zeroGBridge} />
                  <p className="text-xs text-slate-400">
                    Bridge state is optional and explicit. Solana remains canonical for wallet identity and proof.
                  </p>
                </div>
              </Panel>
            ) : null}

            {section === "proof-explorer" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Solana Proof Explorer</h2>
                <div className="mt-3 space-y-2">
                  {runtime.receipts.map(receipt => (
                    <div key={receipt.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-slate-100">{receipt.label}</p>
                        <a
                          href={receipt.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#78f4e1] underline-offset-4 hover:underline"
                        >
                          open in explorer
                        </a>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
                        <span>tx: {receipt.txSignature.slice(0, 20)}...</span>
                        <span>hash: {receipt.receiptHash.slice(0, 20)}...</span>
                        <span>account: {receipt.account}</span>
                        <span>links: {receipt.linkedReceiptIds.length}</span>
                        <span>0G storage: {receipt.zeroGStorageRef || "none"}</span>
                        <span>0G compute: {receipt.zeroGComputeRef || "none"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {section === "agents" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Multi-Agent Orchestration</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {runtime.agents.map(agent => (
                    <div key={agent.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{agent.name}</p>
                        <span className="text-xs text-slate-400">{agent.status}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-300">
                        <p>Role: {agent.role}</p>
                        <p>Memory: {agent.memoryCount}</p>
                        <p>Reputation: {agent.reputation}</p>
                        <p>Proof count: {agent.proofCount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {section === "policies" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Policy Engine</h2>
                <div className="mt-3 space-y-2">
                  {runtime.policyEvents.map(policy => (
                    <div key={policy.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>{policy.label}</span>
                        <span className="text-slate-300">{policy.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Risk: {policy.riskLevel} · Action: {policy.requiredAction}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{policy.reason}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {section === "receipts" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Receipt Registry</h2>
                <div className="mt-3 space-y-2 text-sm">
                  {runtime.receipts.map(receipt => (
                    <div key={receipt.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                      <span>{receipt.kind}</span>
                      <span className="text-xs text-slate-400">{receipt.receiptHash.slice(0, 22)}...</span>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {section === "governance" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Governance Surface</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Proposal hooks for policy sets, autonomy ceilings, and signer quorum controls are ready for onchain governance wiring.
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {[
                    { icon: Scale, label: "Policy proposals" },
                    { icon: FileCode2, label: "Runtime upgrades" },
                    { icon: Link2, label: "Receipt attestations" },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                      <item.icon className="mb-1 h-4 w-4 text-[#60ebd8]" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {section === "settings" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Runtime Settings</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                    <p className="text-slate-100">Autonomy mode</p>
                    <p className="mt-1 text-xs text-slate-400">Current: {runtime.autonomyLevel.replaceAll("_", " ")}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                    <p className="text-slate-100">Cluster</p>
                    <p className="mt-1 text-xs text-slate-400">{runtime.cluster}</p>
                  </div>
                </div>
              </Panel>
            ) : null}
          </section>
        </div>
      </div>

      <footer className="border-t border-white/10 bg-black/70">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-[#68ead8]" />
            Solana identity
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-[#68ead8]" />
            policy-gated orchestration
          </span>
          <span className="inline-flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-[#68ead8]" />
            0G sidecar storage + compute
          </span>
          <span className="inline-flex items-center gap-1">
            <ReceiptText className="h-3.5 w-3.5 text-[#68ead8]" />
            proof-anchored receipts
          </span>
        </div>
      </footer>
    </div>
  );
}

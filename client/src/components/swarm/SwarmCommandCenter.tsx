import { StoryLoopRail } from "@/components/command-center/StoryLoopRail";
import { Button } from "@/components/ui/button";
import { ZeroGBridgeCard } from "@/components/zerog/ZeroGBridgeCard";
import { ZeroGHealthBanner } from "@/components/zerog/ZeroGHealthBanner";
import { ZeroGProofGraph } from "@/components/zerog/ZeroGProofGraph";
import { useSolanaSession } from "@/hooks/solana/useSolanaSession";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { getClientZeroGConfig } from "@/lib/zerog/config";
import {
  STORY_LOOP_LABELS,
  executeSwarm,
  fetchSkillsList,
  fetchSolanaStatus,
  selectSkill,
} from "@/lib/swarmApi";
import { formatSessionExpiry } from "@/lib/solana/format";
import { cn } from "@/lib/utils";
import { createInitialRuntime, executeAutonomousCycle } from "@/lib/swarmRuntime";
import {
  CLAW_AGENT_FLEET_ROLES,
  CLAW_COMMERCIAL,
  CLAW_DEPLOYED_PROGRAMS,
  CLAW_GOVERNANCE_EVENTS,
  CLAW_GOVERNANCE_ROLES,
  CLAW_NARRATIVE,
  CLAW_ORCHESTRATION_METRICS,
  CLAW_PDA_EXAMPLES,
  CLAW_PRODUCT_OUTCOMES,
  CLAW_PROGRAM_CONFIG,
  CLAW_RECEIPT_VOLUME,
  CLAW_RISK_FLAGS,
  CLAW_RUN_LIFECYCLE,
  formatClawInteger,
} from "@shared/clawMachineMock";
import type { SkillIdentity, SwarmExecuteResult } from "@shared/domainModel";
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
  Orbit,
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
  { id: "product-loop", label: "Solana loop", icon: Orbit },
  { id: "overview", label: "Overview", icon: Activity },
  { id: "live-runs", label: "Live runs", icon: PlayCircle },
  { id: "skills", label: "Skill PDAs", icon: SearchCode },
  { id: "memory", label: "Memory chain", icon: MemoryStick },
  { id: "reflections", label: "Reflections", icon: Brain },
  { id: "zerog", label: "DA sidecar (0G)", icon: Database },
  { id: "proof-graph", label: "Proof graph", icon: Link2 },
  { id: "bridge", label: "Bridge", icon: Globe },
  { id: "proof-explorer", label: "Solana receipts", icon: Globe },
  { id: "agents", label: "Agent lanes", icon: Bot },
  { id: "policies", label: "Policies", icon: ShieldCheck },
  { id: "receipts", label: "Receipt registry", icon: ReceiptText },
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
      environment: runtime.cluster === "mainnet" || runtime.cluster === "mainnet-beta" ? "mainnet" : "demo",
      storageUrl: runtime.zeroGStatus.storageUrl,
      computeUrl: runtime.zeroGStatus.computeUrl,
      dataAvailabilityUrl: runtime.zeroGStatus.daUrl,
      explorerUrl: runtime.zeroGStatus.explorerUrl,
      ogChainId: getClientZeroGConfig().ogChainId,
      bridgeProvider: getClientZeroGConfig().bridgeProvider,
      tokenMetadataDisclaimer: getClientZeroGConfig().tokenMetadataDisclaimer,
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
      summary: "Off-chain reflection payload (0G DA path)",
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

async function fetchJson<T>(path: string): Promise<T | null> {
  const response = await fetch(path);
  if (!response.ok) return null;
  const body = (await response.json()) as { ok: boolean; data: T };
  return body.data;
}

export default function SwarmCommandCenter({ walletAddress }: { walletAddress?: string }) {
  const wallet = useSolanaWallet();
  const session = useSolanaSession();
  const [section, setSection] = useState<SwarmSectionId>("product-loop");
  const [runtime, setRuntime] = useState<SwarmRuntimeState>(() => createInitialRuntime(walletAddress));
  const [goal, setGoal] = useState(
    "Demo SWARM: discover a high-reputation skill, run planner→researcher→critic, recover from failure, anchor the receipt on Solana."
  );
  const [autoplay, setAutoplay] = useState(false);
  const [liveZeroGHealth, setLiveZeroGHealth] = useState<ZeroGHealthResponse | null>(null);
  const [liveProofGraph, setLiveProofGraph] = useState<ZeroGProofGraphResponse | null>(null);

  const [chainSkills, setChainSkills] = useState<SkillIdentity[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [loopStep, setLoopStep] = useState(0);
  const [chainStatus, setChainStatus] = useState<Awaited<ReturnType<typeof fetchSolanaStatus>> | null>(null);
  const [lastResult, setLastResult] = useState<SwarmExecuteResult | null>(null);
  const [loopBusy, setLoopBusy] = useState(false);
  const [loopError, setLoopError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [st, sk] = await Promise.all([fetchSolanaStatus(), fetchSkillsList({ sort: "success_rate" })]);
        setChainStatus(st);
        setChainSkills(sk.skills);
        setSelectedSkillId(prev => prev ?? sk.skills[0]?.id ?? null);
      } catch {
        /* registry may be empty before first wallet verify */
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const sk = await fetchSkillsList({ sort: "success_rate" });
        setChainSkills(sk.skills);
      } catch {
        /* ignore */
      }
    })();
  }, [lastResult]);

  useEffect(() => {
    void (async () => {
      const [h, g] = await Promise.all([
        fetchJson<ZeroGHealthResponse>("/api/zerog/health"),
        fetchJson<ZeroGProofGraphResponse>("/api/zerog/proof-graph"),
      ]);
      setLiveZeroGHealth(h);
      setLiveProofGraph(g);
    })();
  }, [runtime.runs.length]);

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
      { label: "Autonomy score", value: runtime.autonomyScore, hint: "Agentic sophistication — climbs when memory + receipts compound" },
      { label: "Successful executions", value: runtime.successfulExecutions, hint: "Runs that closed with a verified receipt chain" },
      { label: "Memory growth", value: runtime.memoryGrowth, hint: "Reflections promoted into reusable context" },
      { label: "Reflection count", value: runtime.reflectionsGenerated, hint: "Structured failures turned into guidance" },
      { label: "Solana receipts", value: runtime.receipts.length, hint: "Innovation proof — every phase hashes on-ledger" },
      { label: "Policy approvals", value: runtime.policyApprovals, hint: "Explicit gates before autonomy expands" },
      {
        label: "Network reflections (mock)",
        value: formatClawInteger(runtime.ecosystem.reflectionsGenerated),
        hint: "Appendix-scale counter for decks — not your wallet session",
      },
      {
        label: "Anchored receipts (mock)",
        value: formatClawInteger(runtime.ecosystem.receiptsAnchored),
        hint: "Fictional mainnet-beta volume for CLAW_MACHINE pitch data",
      },
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
            <div>
              <h1 className="text-lg font-semibold md:text-xl">Solana agent command center</h1>
              <p className="text-[11px] text-slate-500">
                Backend orchestration · Solana proof layer · off-chain narrative — wallet → skill → run → reflection → memory → receipt
              </p>
            </div>
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
              network: {runtime.cluster} · epoch {runtime.ecosystem.currentEpoch}
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
              0G: {liveZeroGHealth?.statusLabel || `${runtime.zeroGStatus.mode} / ${runtime.zeroGStatus.storageStatus}`}
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
              Live execution
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
            {section === "product-loop" ? (
              <>
                <StoryLoopRail activeIndex={loopStep} labels={STORY_LOOP_LABELS} />
                <Panel className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">End-to-end Solana agent loop</h2>
                      <p className="mt-1 max-w-2xl text-xs text-slate-400">
                        The backend orchestrates planning, memory, and receipts. Solana holds compact proofs (memo program + mirrored PDAs). Off-chain
                        storage keeps the full narrative.
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      <p>Cluster: {chainStatus?.cluster ?? "…"}</p>
                      <p className="font-mono text-[10px] text-slate-600">Program: {chainStatus?.programId?.slice(0, 12)}…</p>
                      <p>Relayer: {chainStatus?.relayerConfigured ? "ready" : "not configured"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-3">
                      <label className="text-xs uppercase tracking-wide text-slate-500">Mission goal</label>
                      <textarea
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-white/12 bg-black/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#3bff96]/35"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="bg-[#3bff96] text-black hover:bg-[#6bffbc]"
                          disabled={loopBusy || !walletAddress}
                          onClick={async () => {
                            if (!walletAddress || !selectedSkillId) return;
                            setLoopError(null);
                            setLoopBusy(true);
                            setLoopStep(0);
                            try {
                              setLoopStep(1);
                              await selectSkill(selectedSkillId, walletAddress);
                              setLoopStep(2);
                              const skill = chainSkills.find(s => s.id === selectedSkillId);
                              const result = await executeSwarm({
                                walletAddress,
                                goal,
                                skillId: selectedSkillId,
                                skillName: skill?.name,
                              });
                              setLastResult(result);
                              setLoopStep(result.execution.status === "verified" ? 5 : 4);
                            } catch (e) {
                              setLoopError(e instanceof Error ? e.message : "loop_failed");
                              setLoopStep(0);
                            } finally {
                              setLoopBusy(false);
                            }
                          }}
                        >
                          {loopBusy ? "Orchestrating…" : "Run linked loop"}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-[#38d7d0]/40 text-[#b5fff8]"
                          disabled={loopBusy}
                          type="button"
                          onClick={() => wallet.connectAndVerify().catch(() => undefined)}
                        >
                          Connect wallet
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/15 text-slate-200"
                          disabled={loopBusy}
                          type="button"
                          onClick={() => {
                            setLoopStep(5);
                            setLoopError(null);
                          }}
                        >
                          Mark demo complete
                        </Button>
                      </div>
                      {!walletAddress ? (
                        <p className="text-xs text-amber-200/90">Connect a wallet to bind the session and anchor receipts to your address.</p>
                      ) : null}
                      {loopError ? <p className="text-xs text-rose-300">{loopError}</p> : null}
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Published skills</p>
                      <div className="mt-2 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                        {chainSkills.length ? (
                          chainSkills.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedSkillId(s.id)}
                              className={cn(
                                "w-full rounded-lg border px-2 py-2 text-left text-xs transition",
                                selectedSkillId === s.id
                                  ? "border-[#3bff96]/50 bg-[#3bff96]/10 text-[#d8ffe8]"
                                  : "border-white/10 bg-black/30 text-slate-300 hover:border-white/25"
                              )}
                            >
                              <span className="font-medium text-white">{s.name}</span>
                              <span className="mt-1 block text-[10px] text-slate-500">
                                rep {s.reputationScore.toFixed(1)} · success {s.successRate}% · {s.usageCount} uses
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">
                            No discovery rows yet. Verify a wallet on the Solana identity flow to seed the registry, or run against devnet with demo
                            data.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {lastResult ? (
                    <div className="rounded-xl border border-[#3bff96]/20 bg-[#0a1512]/80 p-4 text-xs text-slate-300">
                      <p className="font-medium text-[#b8ffd9]">Last execution · {lastResult.execution.id}</p>
                      <p className="mt-2 text-slate-400">Status: {lastResult.execution.status}</p>
                      {lastResult.execution.orchestration?.length ? (
                        <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                          {lastResult.execution.orchestration.map(step => (
                            <div key={step.role} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5">
                              <span className="text-[#7de8c8]">{step.role}</span>
                              <span className="block text-[10px] text-slate-500">{step.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {lastResult.reflection ? (
                        <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-2">
                          <p className="text-[#9df5d4]">Reflection</p>
                          <p className="mt-1 text-slate-400">{lastResult.reflection.summary}</p>
                          <p className="mt-1 text-[10px] text-slate-600">Next: {lastResult.reflection.nextAction}</p>
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {lastResult.execution.explorerUrl ? (
                          <a
                            href={lastResult.execution.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#78f4e1] underline-offset-4 hover:underline"
                          >
                            Open explorer
                          </a>
                        ) : null}
                        {lastResult.degraded || lastResult.execution.status !== "verified" ? (
                          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                            {lastResult.degraded ? "Degraded path" : "Pending verification"}
                          </span>
                        ) : (
                          <span className="rounded border border-[#3bff96]/30 bg-[#3bff96]/10 px-2 py-0.5 text-[#c4ffe2]">
                            Verified on Solana
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </Panel>
              </>
            ) : null}

            <Panel className="flex flex-wrap items-center gap-2">
              <Target className="h-4 w-4 text-[#5ce9d5]" />
              <input
                value={goal}
                onChange={event => setGoal(event.target.value)}
                className="min-w-[240px] flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#3bff96]/40"
                placeholder="Describe the mission for the swarm (judges read this)..."
              />
              <Button className="bg-[#3bff96] text-black hover:bg-[#67ffbe]" onClick={() => setRuntime(prev => executeAutonomousCycle(prev, goal))}>
                Run one loop
              </Button>
              <Button
                variant="outline"
                className={cn("border-white/20", autoplay ? "text-[#afffda]" : "text-slate-200")}
                onClick={() => setAutoplay(prev => !prev)}
              >
                {autoplay ? "Stop autoplay" : "Autoplay demo loop"}
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
                  <h2 className="text-lg font-semibold">Autonomy spectrum</h2>
                  <p className="mt-1 text-xs text-slate-400">Shows how much agency the fleet earns; promotions require receipts, not prompts.</p>
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
                <div className="grid gap-3 lg:grid-cols-2">
                  <Panel>
                    <h2 className="text-lg font-semibold">Solana appendix · network &amp; programs</h2>
                    <p className="mt-1 text-xs text-slate-400">{CLAW_NARRATIVE.mission}</p>
                    <dl className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">RPC</dt>
                        <dd>{runtime.ecosystem.rpcProvider}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Indexer</dt>
                        <dd>{runtime.ecosystem.indexer}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Program</dt>
                        <dd>{runtime.ecosystem.programVersion}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Anchor</dt>
                        <dd>{runtime.ecosystem.anchorVersion}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Compression</dt>
                        <dd>{runtime.ecosystem.compression}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Slot height</dt>
                        <dd>{formatClawInteger(runtime.ecosystem.slotHeight)}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
                      <table className="w-full min-w-[480px] text-left text-xs">
                        <thead className="border-b border-white/10 bg-black/50 text-slate-500">
                          <tr>
                            <th className="px-2 py-2">Program</th>
                            <th className="px-2 py-2">Program ID</th>
                            <th className="px-2 py-2">Role</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          {CLAW_DEPLOYED_PROGRAMS.map(p => (
                            <tr key={p.name} className="border-b border-white/5">
                              <td className="px-2 py-1.5 font-mono text-[#9df5d4]">{p.name}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px]">{p.programId}</td>
                              <td className="px-2 py-1.5 text-slate-400">{p.responsibilities.slice(0, 48)}…</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Upgrade auth {CLAW_PROGRAM_CONFIG.upgradeAuthority} · {CLAW_PROGRAM_CONFIG.lastUpgradeUtc} · {CLAW_PROGRAM_CONFIG.verificationStatus}
                    </p>
                  </Panel>
                  <Panel>
                    <h2 className="text-lg font-semibold">Product outcomes &amp; run lifecycle</h2>
                    <ul className="mt-2 space-y-1 text-xs text-slate-300">
                      <li>Multi-step plans: {formatClawInteger(CLAW_PRODUCT_OUTCOMES.multiStepPlansCompleted)}</li>
                      <li>Memory reuse: {CLAW_PRODUCT_OUTCOMES.memoryReuseSuccessRatePct}%</li>
                      <li>Reflection → improvement: {CLAW_PRODUCT_OUTCOMES.reflectionToImprovementRatePct}%</li>
                      <li>
                        Top category: {CLAW_PRODUCT_OUTCOMES.topSkillCategory} · cohort: {CLAW_PRODUCT_OUTCOMES.topWalletCohort}
                      </li>
                    </ul>
                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      {CLAW_RUN_LIFECYCLE.map(row => (
                        <div key={row.stage} className="flex justify-between rounded-md border border-white/5 bg-black/30 px-2 py-1">
                          <span>{row.stage}</span>
                          <span>
                            {row.avgSec}s avg · {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
                <Panel>
                  <h2 className="text-lg font-semibold">Example PDAs (deterministic seeds)</h2>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[400px] text-left text-xs">
                      <thead className="border-b border-white/10 text-slate-500">
                        <tr>
                          <th className="py-2 pr-2">Account</th>
                          <th className="py-2 pr-2">Address</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        {CLAW_PDA_EXAMPLES.map(row => (
                          <tr key={row.name} className="border-b border-white/5">
                            <td className="py-1.5 pr-2">{row.name}</td>
                            <td className="py-1.5 pr-2 font-mono">{row.address}</td>
                            <td className="py-1.5">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </>
            ) : null}

            {section === "live-runs" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Real-time execution timeline</h2>
                <p className="mt-1 text-xs text-slate-400">Planner, worker, and critic phases stream here—expand any row for traces.</p>
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
                  {!runtime.runs.length ? (
                    <p className="text-sm text-slate-400">No runs yet. Hit “Run one loop” or enable autoplay to stream a SWARM-grade trace.</p>
                  ) : null}
                </div>
              </Panel>
            ) : null}

            {section === "skills" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Skill marketplace (discovery + reputation)</h2>
                <p className="mt-1 text-xs text-slate-400">Sort/filter by success rate in a live build; mock data illustrates PDA-ready fields.</p>
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
                <h2 className="text-lg font-semibold">Memory intelligence</h2>
                <p className="mt-1 text-xs text-slate-400">Each card ties a failure to advice, confidence delta, and the receipt that anchored it.</p>
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
                  {!runtime.memories.length ? (
                    <p className="text-sm text-slate-400">No memories yet. Fail a step in the loop—reflection promotes durable memory automatically.</p>
                  ) : null}
                </div>
              </Panel>
            ) : null}

            {section === "reflections" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Reflection engine</h2>
                <p className="mt-1 text-xs text-slate-400">Root cause, corrective advice, and next action feed the memory writer and receipt builder.</p>
                <div className="mt-3 space-y-3">
                  {runtime.reflections.map(reflection => (
                    <div key={reflection.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <p className="text-sm text-slate-100">Root cause: {reflection.rootCause}</p>
                      <p className="mt-1 text-xs text-slate-300">Corrective advice: {reflection.correctiveAdvice}</p>
                      <p className="mt-1 text-xs text-slate-300">Next action: {reflection.nextAction}</p>
                    </div>
                  ))}
                  {!runtime.reflections.length ? (
                    <p className="text-sm text-slate-400">Reflections appear after the first mission cycle completes (success or recoverable failure).</p>
                  ) : null}
                </div>
              </Panel>
            ) : null}

            {section === "zerog" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Durability sidecar (0G)</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Solana remains the receipt layer; 0G holds bulky artifacts when the adapter is live. Below mirrors server health—client runtime
                  still simulates missions if the sidecar is idle.
                </p>
                <div className="mt-3 space-y-3">
                  <ZeroGHealthBanner health={liveZeroGHealth ?? toZeroGHealth(runtime)} />
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-slate-300">
                    <p>0G chain id (bridge target): {liveZeroGHealth?.config.ogChainId ?? getClientZeroGConfig().ogChainId}</p>
                    <p>bridge provider: {liveZeroGHealth?.config.bridgeProvider ?? getClientZeroGConfig().bridgeProvider}</p>
                    <p>storage endpoint: {liveZeroGHealth?.config.storageUrl ?? runtime.zeroGStatus.storageUrl}</p>
                    <p>compute endpoint: {liveZeroGHealth?.config.computeUrl ?? runtime.zeroGStatus.computeUrl}</p>
                    <p>da endpoint: {liveZeroGHealth?.config.dataAvailabilityUrl ?? runtime.zeroGStatus.daUrl}</p>
                    <p>latest storage ref (server): {liveProofGraph?.artifacts[0]?.storageRef || runtime.zeroGLinks[0]?.zeroGStorageRef || "none yet"}</p>
                    <p>latest compute ref (server): {liveProofGraph?.computeJobs[0]?.computeRef || runtime.zeroGLinks[0]?.zeroGComputeRef || "none yet"}</p>
                  </div>
                </div>
              </Panel>
            ) : null}

            {section === "proof-graph" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Proof graph · Solana receipts + DA refs</h2>
                <div className="mt-3">
                  <ZeroGProofGraph graph={liveProofGraph && liveProofGraph.links.length ? liveProofGraph : toProofGraph(runtime)} />
                </div>
              </Panel>
            ) : null}

            {section === "bridge" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Bridge-aware runtime</h2>
                <div className="mt-3 space-y-3">
                  <ZeroGBridgeCard bridge={runtime.zeroGBridge} tokenDisclaimer={getClientZeroGConfig().tokenMetadataDisclaimer} />
                  <p className="text-xs text-slate-400">
                    Bridging flows follow upstream docs. This surface never treats secondary-market labels as verified—only configured endpoints and
                    receipts you anchor yourself.
                  </p>
                </div>
              </Panel>
            ) : null}

            {section === "proof-explorer" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Solana proof explorer</h2>
                <p className="mt-1 text-xs text-slate-400">Receipt cards deep-link to explorers; swap RPC/cluster in settings for Frontier demos.</p>
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
                          Open in Solana explorer
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
                <h2 className="text-lg font-semibold">Multi-agent orchestration</h2>
                <p className="mt-1 text-xs text-slate-400">Each lane tracks status, memory depth, and reputation—SWARM’s coordination story at a glance.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
                  {CLAW_AGENT_FLEET_ROLES.map(r => (
                    <div key={r.role} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-300">
                      <p className="font-medium text-[#9df5d4]">{r.role}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{formatClawInteger(r.count)} agents</p>
                      <p className="mt-1 text-[11px] text-slate-400">{r.duties}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Avg {CLAW_ORCHESTRATION_METRICS.avgAgentsPerTask} agents/run · conflict resolve {CLAW_ORCHESTRATION_METRICS.conflictResolutionSuccessPct}% · parallel{" "}
                  {CLAW_ORCHESTRATION_METRICS.parallelTaskCompletionPct}% · hand-off fail {CLAW_ORCHESTRATION_METRICS.handOffFailurePct}%
                </p>
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
                <h2 className="text-lg font-semibold">Policy engine</h2>
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
                <h2 className="text-lg font-semibold">Receipt registry</h2>
                <p className="mt-1 text-xs text-slate-400">Compact hashes and kinds for quick scanning; expand in Solana receipts for full detail.</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  {CLAW_RECEIPT_VOLUME.map(row => (
                    <div key={row.type} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs">
                      <p className="text-slate-500">{row.type}</p>
                      <p className="mt-1 font-medium text-[#9df5d4]">{formatClawInteger(row.count)}</p>
                    </div>
                  ))}
                </div>
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
                <h2 className="text-lg font-semibold">Governance surface</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Hooks for policy sets, autonomy ceilings, and signer quorums—wire to your governance program when you leave hackathon mode.
                </p>
                <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="border-b border-white/10 bg-black/50 text-slate-500">
                      <tr>
                        <th className="px-2 py-2">Role</th>
                        <th className="px-2 py-2">Address</th>
                        <th className="px-2 py-2">Authority</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {CLAW_GOVERNANCE_ROLES.map(row => (
                        <tr key={row.role} className="border-b border-white/5">
                          <td className="px-2 py-1.5">{row.role}</td>
                          <td className="px-2 py-1.5 font-mono">{row.address}</td>
                          <td className="px-2 py-1.5 text-slate-400">{row.authority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
                    Skills approved: {formatClawInteger(CLAW_GOVERNANCE_EVENTS.skillsApproved)}
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
                    Skills deprecated: {formatClawInteger(CLAW_GOVERNANCE_EVENTS.skillsDeprecated)}
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
                    Emergency pauses: {CLAW_GOVERNANCE_EVENTS.emergencyPauses}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Risk flags (mock)</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {CLAW_RISK_FLAGS.map(f => (
                      <div key={f.flag} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-2 text-xs text-slate-300">
                        <span className="text-amber-200/90">{f.flag}</span> · {f.active} active — {f.description}
                      </div>
                    ))}
                  </div>
                </div>
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
                <p className="mt-3 text-[11px] text-slate-500">
                  Commercial appendix: {formatClawInteger(CLAW_COMMERCIAL.proUsers)} Pro users · {CLAW_COMMERCIAL.enterprisePilots} enterprise pilots ·{" "}
                  {formatClawInteger(CLAW_COMMERCIAL.paidSkills)} paid skills · ${formatClawInteger(CLAW_COMMERCIAL.monthlyRevenueUsd)} MRR (mock)
                </p>
              </Panel>
            ) : null}

            {section === "settings" ? (
              <Panel>
                <h2 className="text-lg font-semibold">Runtime settings</h2>
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
            Solana-first identity
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-[#68ead8]" />
            Policy-gated orchestration
          </span>
          <span className="inline-flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-[#68ead8]" />
            Optional 0G DA + compute
          </span>
          <span className="inline-flex items-center gap-1">
            <ReceiptText className="h-3.5 w-3.5 text-[#68ead8]" />
            Receipts anchored on Solana
          </span>
        </div>
      </footer>
    </div>
  );
}

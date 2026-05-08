import {
  CommandTopRail,
  CommandCenterShell,
  StatusChip,
} from "@/components/command-center/CommandCenterShell";
import {
  AgentsOrchestrationGrid,
  buildDemoBundle,
  CommandRightRail,
  DemoModeCommandPanel,
  DemoModeToggle,
  DegradedStateBanner,
  LiveRunsBoard,
  MemoryLineageColumn,
  OpenClawBridgeBoard,
  OverviewMissionBlock,
  ProofExplorerList,
  ProofGraphPanel,
  ReceiptVault,
  ReflectionStack,
  ReputationAutonomyBoard,
  SettingsDeck,
  SkillsAssetGallery,
  ZerogSidecarPanel,
} from "@/components/swarm/CommandCenterPanels";
import { Button } from "@/components/ui/button";
import { useSolanaSession } from "@/hooks/solana/useSolanaSession";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { getClientZeroGConfig } from "@/lib/zerog/config";
import type {
  ZeroGHealthResponse,
  ZeroGProofGraphResponse,
} from "@/lib/zerog/types";
import { formatSessionExpiry } from "@/lib/solana/format";
import {
  DemoModeNotice,
  ExecutionErrorPanel,
} from "@/errors/ErrorUiKit";
import { SwarmApiError } from "@/errors/SwarmApiError";
import { useErrorSurface } from "@/errors/ErrorSurfaceContext";
import {
  executeSwarm,
  fetchSkillsList,
  fetchSolanaStatus,
  selectSkill,
} from "@/lib/swarmApi";
import { txExplorerUrl } from "@/lib/solana/explorer";
import { normalizeError } from "@shared/normalizeError";
import { deriveCommandUX } from "@shared/uxState";
import {
  createInitialRuntime,
  executeAutonomousCycle,
} from "@/lib/swarmRuntime";
import {
  buildCommandTimelineSafe,
  isStructuredReflectionControl,
} from "@shared/commandCenterTimeline";
import { commandEventsToUXTimeline } from "@shared/storyUXTimeline";
import { DEMO_SKILLS } from "@shared/demoFixtures";
import { SOLANA_COPY, STORY_LOOP_LABELS } from "@shared/copy";
import type { SkillIdentity, SwarmExecuteResult } from "@shared/domainModel";
import type { AppError } from "@shared/errorTypes";
import type { OpenClawBridgeStatus } from "@shared/openclaw/types";
import {
  isSwarmSectionId,
  type SwarmRuntimeState,
  type SwarmSectionId,
} from "@shared/swarm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "wouter";

async function fetchJson<T>(path: string): Promise<T | null> {
  const response = await fetch(path);
  if (!response.ok) return null;
  const body = (await response.json()) as { ok: boolean; data: T };
  return body.data;
}

function toZeroGHealth(runtime: SwarmRuntimeState): ZeroGHealthResponse {
  return {
    ok: runtime.zeroGStatus.enabled,
    mode: runtime.zeroGStatus.mode,
    statusLabel:
      runtime.zeroGStatus.mode === "degraded"
        ? "0G degraded mode"
        : `0G ${runtime.zeroGStatus.mode} mode`,
    config: {
      environment:
        runtime.cluster === "mainnet" || runtime.cluster === "mainnet-beta"
          ? "mainnet"
          : "demo",
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
    storage: {
      ok: runtime.zeroGStatus.storageStatus === "healthy",
      mode: runtime.zeroGStatus.mode,
    },
    compute: {
      ok: runtime.zeroGStatus.computeStatus === "healthy",
      mode: runtime.zeroGStatus.mode,
    },
    da: {
      ok: runtime.zeroGStatus.daStatus === "healthy",
      mode: runtime.zeroGStatus.mode,
    },
    bridge: {
      ok: runtime.zeroGStatus.bridgeStatus !== "degraded",
      mode: runtime.zeroGStatus.mode,
    },
  };
}

function toProofGraph(runtime: SwarmRuntimeState): ZeroGProofGraphResponse {
  return {
    artifacts: runtime.zeroGLinks.map((link) => ({
      id: link.subjectId,
      kind: "reflection",
      title: `Off-chain artifact · ${link.subjectId}`,
      summary: `0G storage ref: ${link.zeroGStorageRef || "n/a"} · DA root: ${link.zeroGAvailabilityRef || "n/a"} · checksum ${link.summaryHash?.slice(0, 12) || "n/a"}…`,
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
    computeJobs: runtime.zeroGLinks.map((link) => ({
      id: link.id,
      taskType: "summarize_reflection",
      input: {},
      status: link.status === "verified" ? "completed" : "running",
      createdAt: link.createdAt,
      updatedAt: link.createdAt,
      computeRef: link.zeroGComputeRef,
      metadata: {},
    })),
    availability: runtime.zeroGLinks.map((link) => ({
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
    receipts: runtime.receipts.map((receipt) => ({
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
      status: receipt.txSignature ? "submitted" : "draft",
    })),
  };
}

function demoSkillRows() {
  return DEMO_SKILLS.slice(0, 9).map((s) => ({
    id: s.id,
    name: s.name,
    version: s.version,
    authorWallet: s.authorWallet,
    reputationScore: s.reputationScore,
    successRate: s.successRate,
    usageCount: s.usageCount,
  }));
}

function skillRowsFromChain(skills: SkillIdentity[]) {
  return skills.map((s) => ({
    id: s.id,
    name: s.name,
    version: s.version,
    authorWallet: s.authorWallet,
    reputationScore: s.reputationScore,
    successRate: s.successRate,
    usageCount: s.usageCount,
  }));
}

export default function SwarmCommandCenter({
  walletAddress,
}: {
  walletAddress?: string;
}) {
  const errorSurface = useErrorSurface();
  const errorSurfaceRef = useRef(errorSurface);
  errorSurfaceRef.current = errorSurface;
  const wallet = useSolanaWallet();
  const session = useSolanaSession();
  const [searchParams] = useSearchParams();
  const section: SwarmSectionId = useMemo(() => {
    const raw = searchParams.get("section");
    return raw && isSwarmSectionId(raw) ? raw : "overview";
  }, [searchParams]);
  const [demoMode, setDemoMode] = useState(false);
  const [runtime, setRuntime] = useState<SwarmRuntimeState>(() =>
    createInitialRuntime(walletAddress),
  );
  const [goal, setGoal] = useState(
    "Bind wallet → choose skill → planner emits steps → operator executes → critic reflects → memory writes → receipt anchors on Solana.",
  );
  const [autoplay, setAutoplay] = useState(false);
  const [liveZeroGHealth, setLiveZeroGHealth] =
    useState<ZeroGHealthResponse | null>(null);
  const [liveProofGraph, setLiveProofGraph] =
    useState<ZeroGProofGraphResponse | null>(null);
  const [chainSkills, setChainSkills] = useState<SkillIdentity[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [loopStep, setLoopStep] = useState(0);
  const [chainStatus, setChainStatus] = useState<Awaited<
    ReturnType<typeof fetchSolanaStatus>
  > | null>(null);
  const [lastResult, setLastResult] = useState<SwarmExecuteResult | null>(null);
  const [loopBusy, setLoopBusy] = useState(false);
  const [loopError, setLoopError] = useState<string | null>(null);
  const [registryError, setRegistryError] = useState<AppError | null>(null);

  const demoBundle = useMemo(
    () => (demoMode ? buildDemoBundle(selectedSkillId) : null),
    [demoMode, selectedSkillId],
  );

  const effectiveWallet =
    walletAddress ?? (demoMode ? demoBundle?.wallet.address : undefined);
  const skillRows = useMemo(() => {
    if (chainSkills.length) return skillRowsFromChain(chainSkills);
    if (demoMode) return demoSkillRows();
    return [];
  }, [chainSkills, demoMode]);

  const activeSkillMeta = useMemo(() => {
    const fromChain = chainSkills.find((s) => s.id === selectedSkillId);
    if (fromChain) return fromChain;
    return demoBundle?.skill ?? null;
  }, [chainSkills, selectedSkillId, demoBundle?.skill]);

  const activeSkillName = useMemo(
    () => activeSkillMeta?.name,
    [activeSkillMeta?.name],
  );

  const wrongCluster = wallet.walletState.connectionStatus === "wrong_cluster";
  const walletConnected = Boolean(wallet.walletAddress ?? effectiveWallet);

  const commandUx = useMemo(
    () =>
      deriveCommandUX({
        demoMode,
        walletConnected,
        wrongCluster,
        sessionVerified: session.isVerified,
        selectedSkillId,
        hasRegistrySkills: skillRows.length > 0,
        loopBusy,
        loopError,
        lastResult,
        registryDegraded: Boolean(registryError && !chainSkills.length && !demoMode),
        autonomyLevel: runtime.autonomyLevel,
        autonomyScore: runtime.autonomyScore,
      }),
    [
      demoMode,
      walletConnected,
      wrongCluster,
      session.isVerified,
      selectedSkillId,
      skillRows.length,
      loopBusy,
      loopError,
      lastResult,
      registryError,
      chainSkills.length,
      runtime.autonomyLevel,
      runtime.autonomyScore,
    ],
  );

  useEffect(() => {
    void (async () => {
      try {
        const [st, sk] = await Promise.all([
          fetchSolanaStatus(),
          fetchSkillsList({ sort: "success_rate" }),
        ]);
        setChainStatus(st);
        setChainSkills(sk.skills);
        setSelectedSkillId((prev) => prev ?? sk.skills[0]?.id ?? null);
        setRegistryError(null);
        errorSurfaceRef.current?.markSuccess();
      } catch (e) {
        const appErr = normalizeError(e, {
          source: "command_center_bootstrap",
          fallback: { code: "INDEXER_SYNC_FAILED" },
        });
        setRegistryError(appErr);
        errorSurfaceRef.current?.pushError(appErr);
        errorSurfaceRef.current?.markDegraded(true);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const sk = await fetchSkillsList({ sort: "success_rate" });
        setChainSkills(sk.skills);
        setRegistryError(null);
      } catch (e) {
        const appErr = normalizeError(e, {
          source: "command_center_skills_refresh",
          fallback: { code: "INDEXER_SYNC_FAILED" },
        });
        setRegistryError(appErr);
        errorSurfaceRef.current?.pushError(appErr);
      }
    })();
  }, [lastResult]);

  useEffect(() => {
    if (selectedSkillId) return;
    const first = skillRows[0]?.id;
    if (first) setSelectedSkillId(first);
  }, [selectedSkillId, skillRows]);

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
      setRuntime((prev) => executeAutonomousCycle(prev, goal));
    }, 2_500);
    return () => clearInterval(interval);
  }, [autoplay, goal]);

  const latestRun = runtime.runs[0];
  const liveIndicator = latestRun?.status === "running" || autoplay || loopBusy;

  const openClawStatus: OpenClawBridgeStatus = useMemo(
    () => ({
      connected: session.isVerified || demoMode,
      mode: demoMode ? "sync" : "idle",
      lastSyncAt: demoMode ? "2026-05-07T09:24:00.000Z" : undefined,
      lastError: demoMode ? undefined : undefined,
      importedCount: demoMode ? 14 : 3,
      exportedCount: demoMode ? 6 : 1,
    }),
    [session.isVerified, demoMode],
  );

  const openClawReceipts = useMemo(
    () => [
      {
        id: "oc-br-01",
        label: "Skill manifest hash export",
        direction: "export",
      },
      { id: "oc-br-02", label: "Tool schema import", direction: "import" },
      { id: "oc-br-03", label: "Receipt mirror", direction: "export" },
    ],
    [],
  );

  const memorySnippet = useMemo(() => {
    if (runtime.memories[0]?.correctiveAdvice)
      return runtime.memories[0]!.correctiveAdvice;
    if (demoBundle?.memory?.summary) return demoBundle.memory.summary;
    if (lastResult?.reflection?.summary) return lastResult.reflection.summary;
    return undefined;
  }, [runtime.memories, demoBundle?.memory, lastResult?.reflection]);

  const receiptPreview = useMemo(() => {
    const tx = wallet.latestSignature ?? lastResult?.receipts?.[0]?.txSignature;
    if (tx) return tx;
    const demoTx =
      demoBundle?.receipts?.[demoBundle.receipts.length - 1]?.txSignature;
    return demoTx;
  }, [wallet.latestSignature, lastResult?.receipts, demoBundle?.receipts]);

  const receiptTxPreview = useMemo(() => {
    if (!receiptPreview || receiptPreview.length < 8) return undefined;
    return receiptPreview.length > 14
      ? `${receiptPreview.slice(0, 10)}…`
      : receiptPreview;
  }, [receiptPreview]);

  const explorerForRail = useMemo(() => {
    const direct = lastResult?.execution.explorerUrl;
    if (direct) return direct;
    const tx = lastResult?.receipts?.[0]?.txSignature ?? receiptPreview;
    if (!tx || tx.length < 32) return null;
    return txExplorerUrl(tx);
  }, [lastResult, receiptPreview]);

  const degradedMessages = useMemo(() => {
    const m: string[] = [];
    if (loopError) m.push(loopError);
    if (lastResult?.degraded)
      m.push("Last run used a degraded verification path.");
    if (!effectiveWallet && !demoMode)
      m.push("Wallet disconnected — proof scope not bound.");
    if (effectiveWallet && !session.isVerified && !demoMode)
      m.push("Session not verified — anchoring may be blocked.");
    return m;
  }, [
    loopError,
    lastResult?.degraded,
    effectiveWallet,
    session.isVerified,
    demoMode,
  ]);

  const recoverHints = useMemo(() => {
    const h: string[] = [];
    if (!effectiveWallet && !demoMode) h.push("Connect + verify wallet");
    if (!session.isVerified && !demoMode) h.push("Complete session signature");
    if (demoMode) h.push("Demo mode fills gaps for presentation");
    return h;
  }, [effectiveWallet, session.isVerified, demoMode]);

  const storyFinalIdx = STORY_LOOP_LABELS.length - 1;

  const timelineInput = useMemo(
    () => ({
      walletConnected: Boolean(effectiveWallet),
      sessionVerified: session.isVerified || demoMode,
      activeSkillName,
      skillVersion: activeSkillMeta?.version,
      skillContentHashPreview: activeSkillMeta?.contentHash?.slice(0, 14),
      goalSummary: goal,
      loopStep,
      loopBusy,
      lastExecutionStatus: lastResult?.execution.status,
      hasReflection: Boolean(lastResult?.reflection ?? demoBundle?.reflection),
      structuredReflection:
        isStructuredReflectionControl(lastResult?.reflection) ||
        isStructuredReflectionControl(
          demoBundle?.reflection
            ? {
                rootCause: demoBundle.reflection.rootCause,
                correctiveAdvice: demoBundle.reflection.correctiveAdvice,
                nextAction: demoBundle.reflection.nextAction,
              }
            : undefined,
        ),
      hasMemory: Boolean(lastResult?.memoryReflectionId ?? demoBundle?.memory),
      planReceiptId:
        lastResult?.planReceiptId ??
        demoBundle?.plan?.receiptRef ??
        demoBundle?.plan?.id ??
        undefined,
      receiptTxPreview,
      zerogStored: Boolean(
        demoBundle ||
          lastResult?.reflection?.offchainStorageRef ||
          liveProofGraph?.artifacts?.length,
      ),
      zerogDaCommitted: Boolean(
        demoBundle ||
          lastResult?.execution.status === "anchored" ||
          lastResult?.execution.status === "verified" ||
          liveProofGraph?.availability?.length,
      ),
      receiptAnchored:
        lastResult?.execution.status === "verified" ||
        lastResult?.execution.status === "anchored" ||
        Boolean(demoBundle?.receipts.some((r) => r.kind === "proof_anchor")),
      degraded: Boolean(lastResult?.degraded) || degradedMessages.length > 0,
    }),
    [
      effectiveWallet,
      session.isVerified,
      demoMode,
      activeSkillName,
      activeSkillMeta?.version,
      activeSkillMeta?.contentHash,
      goal,
      loopStep,
      loopBusy,
      lastResult?.execution.status,
      lastResult?.reflection,
      lastResult?.planReceiptId,
      lastResult?.memoryReflectionId,
      lastResult?.degraded,
      demoBundle?.reflection,
      demoBundle?.memory,
      demoBundle?.plan?.receiptRef,
      demoBundle?.plan?.id,
      demoBundle?.receipts,
      receiptTxPreview,
      degradedMessages.length,
      liveProofGraph?.artifacts?.length,
      liveProofGraph?.availability?.length,
      demoBundle,
    ],
  );

  const storyUxItems = useMemo(() => {
    const { events } = buildCommandTimelineSafe(timelineInput);
    return commandEventsToUXTimeline(events);
  }, [timelineInput]);

  const runLinkedLoop = useCallback(async () => {
    if (!effectiveWallet || !selectedSkillId) return;
    setLoopError(null);
    setLoopBusy(true);
    setLoopStep(0);
    try {
      setLoopStep(1);
      await selectSkill(selectedSkillId, effectiveWallet);
      setLoopStep(2);
      const skill = chainSkills.find((s) => s.id === selectedSkillId);
      const result = await executeSwarm({
        walletAddress: effectiveWallet,
        goal,
        skillId: selectedSkillId,
        skillName: skill?.name ?? demoBundle?.skill.name,
      });
      setLastResult(result);
      const st = result.execution.status;
      if (st === "verified" || st === "anchored") setLoopStep(storyFinalIdx);
      else if (st === "failed") setLoopStep(Math.min(6, storyFinalIdx));
      else setLoopStep(Math.min(5, storyFinalIdx));
    } catch (e) {
      const appErr =
        e instanceof SwarmApiError ? e.appError : normalizeError(e, { source: "runLinkedLoop" });
      setLoopError(appErr.message);
      errorSurfaceRef.current?.pushError(appErr);
      errorSurfaceRef.current?.markDegraded(true);
      setLoopStep(0);
    } finally {
      setLoopBusy(false);
    }
  }, [
    effectiveWallet,
    selectedSkillId,
    chainSkills,
    goal,
    demoBundle?.skill.name,
    storyFinalIdx,
  ]);

  const top = (
    <CommandTopRail
      title="Solana Autonomous Agent Command Center"
      subtitle={SOLANA_COPY.dashboard.topSubtitle}
      chips={
        <>
          <StatusChip
            tone="live"
            label={`stage · ${commandUx.uxState.replaceAll("_", " ")}`}
            title="Derived from wallet, session, registry, and last run"
            className="!max-w-[200px] !normal-case !tracking-normal"
          />
          <StatusChip
            tone="neutral"
            label={`cluster · ${chainStatus?.cluster ?? runtime.cluster}`}
          />
          <StatusChip
            tone={wrongCluster ? "warn" : effectiveWallet ? "proof" : "warn"}
            label={
              wrongCluster
                ? SOLANA_COPY.wallet.wrongCluster
                : effectiveWallet
                  ? `${effectiveWallet.slice(0, 4)}…${effectiveWallet.slice(-4)}`
                  : SOLANA_COPY.wallet.offlineChip
            }
            title={wrongCluster ? "Wallet RPC cluster does not match verified session cluster" : undefined}
          />
          {wallet.walletName ? (
            <StatusChip
              tone="neutral"
              label={wallet.walletName}
              title="Connected wallet adapter"
              className="!max-w-[140px] !normal-case !tracking-normal"
            />
          ) : null}
          <StatusChip
            tone={activeSkillName ? "proof" : "warn"}
            label={activeSkillName ? `skill · ${activeSkillName}` : "skill · none selected"}
            title="Active capability for this mission"
            className="!max-w-[220px] !normal-case !tracking-normal"
          />
          <StatusChip
            tone={session.isVerified || demoMode ? "proof" : "warn"}
            label={
              session.isVerified || demoMode
                ? SOLANA_COPY.session.verifiedSession
                : SOLANA_COPY.session.sessionOpen
            }
          />
          <StatusChip
            tone="neutral"
            label={`epoch · ${runtime.ecosystem.currentEpoch}`}
          />
          <StatusChip
            tone="live"
            pulse={liveIndicator}
            label={liveIndicator ? "live execution" : "standby"}
          />
          <StatusChip tone="proof" label={`memory +${runtime.memoryGrowth}`} />
          <StatusChip
            tone="proof"
            label={`receipts · ${runtime.receipts.length}`}
          />
          <StatusChip
            tone="neutral"
            label={commandUx.autonomyBandLabel}
            className="!max-w-[200px] !normal-case !tracking-normal"
            title="Autonomy band from runtime profile"
          />
          {typeof activeSkillMeta?.reputationScore === "number" ? (
            <StatusChip
              tone="neutral"
              label={`skill rep · ${activeSkillMeta.reputationScore.toFixed(0)}`}
              className="!normal-case !tracking-normal"
            />
          ) : null}
          <StatusChip
            tone="neutral"
            label={`0G · ${liveZeroGHealth?.statusLabel ?? runtime.zeroGStatus.mode}`}
          />
          <StatusChip
            label={`expiry · ${formatSessionExpiry(session.sessionProfile?.expiresAt)}`}
          />
          <Button
            size="sm"
            variant="outline"
            className="ml-auto shrink-0 border-[#14f195]/50 text-[11px] text-[#b8ffd9]"
            onClick={() => wallet.connectAndVerify().catch(() => undefined)}
          >
            {session.isVerified
              ? SOLANA_COPY.wallet.refreshSession
              : SOLANA_COPY.wallet.connectVerify}
          </Button>
        </>
      }
    />
  );

  const right = (
    <CommandRightRail
      demoMode={demoMode}
      sessionVerified={session.isVerified || demoMode}
      autonomyScore={runtime.autonomyScore}
      autonomyBandLabel={commandUx.autonomyBandLabel}
      proofRate={runtime.proofCompletionRate}
      activeSkillName={activeSkillName}
      skillReputation={activeSkillMeta?.reputationScore}
      lastTx={receiptPreview}
      memorySnippet={memorySnippet}
      receiptPreview={receiptPreview}
      proofChannel={commandUx.proofChannel}
      proofChannelExplanation={commandUx.proofChannelExplanation}
      explorerUrl={explorerForRail}
      openClawCompact={`${openClawStatus.connected ? "Bridge live" : "Idle"} · ${openClawStatus.importedCount} imports / ${openClawStatus.exportedCount} exports · OpenClaw compatible manifests.`}
      demoReflection={demoMode ? (demoBundle?.reflection ?? null) : null}
      storyUxItems={storyUxItems}
    />
  );

  const main = (
    <div className="mx-auto max-w-4xl xl:max-w-none">
      <DemoModeToggle enabled={demoMode} onChange={setDemoMode} />
      <DemoModeNotice active={demoMode} />
      <DegradedStateBanner
        messages={degradedMessages}
        recoverHints={recoverHints}
      />
      {registryError && !chainSkills.length ? (
        <div className="mb-3">
          <ExecutionErrorPanel
            errors={[registryError]}
            onRetry={() => {
              setRegistryError(null);
              void (async () => {
                try {
                  const sk = await fetchSkillsList({ sort: "success_rate" });
                  setChainSkills(sk.skills);
                  setRegistryError(null);
                } catch (e) {
                  const appErr = normalizeError(e, {
                    source: "skills_retry",
                    fallback: { code: "INDEXER_SYNC_FAILED" },
                  });
                  setRegistryError(appErr);
                  errorSurfaceRef.current?.pushError(appErr);
                }
              })();
            }}
          />
        </div>
      ) : null}
      {lastResult?.appErrors?.length ? (
        <div className="mb-3">
          <ExecutionErrorPanel
            errors={lastResult.appErrors}
            onRetry={() => void runLinkedLoop()}
          />
        </div>
      ) : null}

      {section === "overview" ? (
        <OverviewMissionBlock
          goal={goal}
          onGoalChange={setGoal}
          loopStep={loopStep}
          loopBusy={loopBusy}
          loopError={loopError}
          walletAddress={effectiveWallet}
          onConnect={() => wallet.connectAndVerify().catch(() => undefined)}
          onRunLoop={() => void runLinkedLoop()}
          onDemoComplete={() => {
            setLoopStep(storyFinalIdx);
            setLoopError(null);
          }}
          selectedSkillId={selectedSkillId}
          onSelectSkill={setSelectedSkillId}
          skillRows={skillRows}
          lastResult={lastResult}
          demoSteps={demoMode ? (demoBundle?.steps ?? null) : null}
          demoMode={demoMode}
          demoExecutionRun={
            demoMode ? (demoBundle?.executionRun ?? null) : null
          }
          commandUx={commandUx}
          explorerUrl={lastResult?.execution.explorerUrl ?? null}
        />
      ) : null}

      {section === "demo-mode" ? (
        <DemoModeCommandPanel demoMode={demoMode} onDemoMode={setDemoMode} />
      ) : null}

      {section === "live-run" ? <LiveRunsBoard runs={runtime.runs} /> : null}
      {section === "skills" ? (
        <SkillsAssetGallery skills={runtime.skills} />
      ) : null}
      {section === "memory" ? (
        <MemoryLineageColumn
          memories={runtime.memories}
          demoTimeline={demoMode ? (demoBundle?.memoryTimeline ?? null) : null}
          demoTraceable={
            demoMode ? (demoBundle?.traceableMemory ?? null) : null
          }
        />
      ) : null}
      {section === "reflections" ? (
        <ReflectionStack reflections={runtime.reflections} />
      ) : null}
      {section === "receipts" || section === "proof-explorer" ? (
        <ProofExplorerList receipts={runtime.receipts} />
      ) : null}
      {section === "agents" ? (
        <AgentsOrchestrationGrid agents={runtime.agents} />
      ) : null}
      {section === "reputation" ? (
        <ReputationAutonomyBoard runtime={runtime} />
      ) : null}
      {section === "openclaw-bridge" ? (
        <OpenClawBridgeBoard
          status={openClawStatus}
          receipts={openClawReceipts}
        />
      ) : null}
      {section === "settings" ? (
        <SettingsDeck
          runtime={runtime}
          autoplay={autoplay}
          onAutoplay={() => setAutoplay((p) => !p)}
          onRunOnce={() => setRuntime((p) => executeAutonomousCycle(p, goal))}
        />
      ) : null}
      {section === "zerog-sidecar" ? (
        <ZerogSidecarPanel
          health={liveZeroGHealth ?? toZeroGHealth(runtime)}
          runtimeSnippet={
            <>
              <p>
                0G chain id:{" "}
                {liveZeroGHealth?.config.ogChainId ??
                  getClientZeroGConfig().ogChainId}
              </p>
              <p>
                Storage:{" "}
                {liveZeroGHealth?.config.storageUrl ??
                  runtime.zeroGStatus.storageUrl}
              </p>
              <p>
                Compute:{" "}
                {liveZeroGHealth?.config.computeUrl ??
                  runtime.zeroGStatus.computeUrl}
              </p>
              <p>
                Latest DA ref:{" "}
                {liveProofGraph?.artifacts[0]?.storageRef ??
                  runtime.zeroGLinks[0]?.zeroGStorageRef ??
                  "—"}
              </p>
            </>
          }
        />
      ) : null}
      {section === "proof-graph" ? (
        <ProofGraphPanel
          graph={
            liveProofGraph && liveProofGraph.links.length
              ? liveProofGraph
              : toProofGraph(runtime)
          }
        />
      ) : null}
    </div>
  );

  return (
    <CommandCenterShell
      top={top}
      right={right}
      timelineInput={timelineInput}
      section={section}
    >
      {main}
    </CommandCenterShell>
  );
}

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { SkillAsset, SkillVersionRecord } from "@shared/skills";
import type {
  MemoryLifecycleEvent,
  MemoryReceiptOnChain,
  ReflectionRecordOffchain,
} from "@shared/memoryReceipts";
import type {
  DemoStoryStepPayload,
  ExplorerPayload,
  ReflectionState,
  TaskExecutionState,
  VerificationState,
  WalletCommandState,
} from "@shared/commandCenter";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Copy,
  ExternalLink,
  Loader2,
  LucideIcon,
  MemoryStick,
  Network,
  PlayCircle,
  Radar,
  ReceiptText,
  Sparkles,
  Wallet,
  Wrench,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SOLANA_CLUSTER } from "@/solana/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STORY_LOOP_LABELS } from "@shared/copy";

function short(value?: string | null, left = 6, right = 6) {
  if (!value) return "n/a";
  if (value.length <= left + right + 2) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function formatTs(value?: string | number) {
  if (!value) return "Pending";
  const ts = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ts)) return "Pending";
  return new Date(ts).toLocaleString();
}

function toSol(value?: number) {
  if (value === undefined) return "--";
  return `${value.toFixed(4)} SOL`;
}

export function SolanaStatusBadge({
  label,
  active = false,
  subtle = false,
}: {
  label: string;
  active?: boolean;
  subtle?: boolean;
}) {
  return (
    <Badge
      className={cn(
        "border",
        active
          ? "border-[#3bff96]/60 bg-[#3bff96]/10 text-[#b8ffd8]"
          : subtle
            ? "border-slate-700 bg-slate-900/70 text-slate-300"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
      )}
    >
      {label}
    </Badge>
  );
}

export function ProofVerificationBadge({
  verification,
}: {
  verification: VerificationState;
}) {
  if (verification.status === "verified") {
    return (
      <Badge className="border-[#3bff96]/60 bg-[#3bff96]/10 text-[#b8ffd8]">
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        {verification.label}
      </Badge>
    );
  }
  if (verification.status === "failed") {
    return (
      <Badge className="border-red-500/50 bg-red-500/10 text-red-200">
        <XCircle className="mr-1 h-3.5 w-3.5" />
        {verification.label}
      </Badge>
    );
  }
  if (verification.status === "degraded") {
    return (
      <Badge className="border-amber-500/50 bg-amber-500/10 text-amber-200">
        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
        {verification.label}
      </Badge>
    );
  }
  return (
    <Badge className="border-slate-600 bg-slate-900 text-slate-200">
      <CircleDashed className="mr-1 h-3.5 w-3.5" />
      {verification.label}
    </Badge>
  );
}

export function ExplorerLinkButton({ payload }: { payload: ExplorerPayload }) {
  if (!payload.url) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-slate-700 text-slate-400"
        disabled
      >
        Explorer unavailable (Solana)
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-cyan-500/40 text-cyan-200"
      onClick={() => window.open(payload.url, "_blank")}
    >
      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
      {payload.label}
    </Button>
  );
}

export function StoryLoopStrip({ activeStep }: { activeStep?: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-black/50 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
        {STORY_LOOP_LABELS.map((step, idx) => (
          <div key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1",
                activeStep === idx
                  ? "border-[#3bff96]/70 bg-[#3bff96]/10 text-[#b8ffd8]"
                  : "border-slate-700 bg-slate-950 text-slate-300",
              )}
            >
              {step}
            </span>
            {idx < STORY_LOOP_LABELS.length - 1 ? (
              <span className="text-slate-500">→</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommandCenterPanel({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-800 bg-[#070b10] p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white md:text-lg">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-400 md:text-sm">{subtitle}</p>
          ) : null}
        </div>
        {Icon ? <Icon className="h-5 w-5 text-cyan-300" /> : null}
      </div>
      {children}
    </Card>
  );
}

export function LiveStateBanner({
  state,
  message,
}: {
  state: "ready" | "running" | "read-only" | "error";
  message: string;
}) {
  const style =
    state === "ready"
      ? "border-[#3bff96]/40 bg-[#3bff96]/10 text-[#b8ffd8]"
      : state === "running"
        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
        : state === "error"
          ? "border-red-500/40 bg-red-500/10 text-red-200"
          : "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return (
    <div className={cn("rounded-xl border px-3 py-2 text-sm", style)}>
      {message}
    </div>
  );
}

export function SolanaWalletCard({
  state,
  onConnectVerify,
}: {
  state: WalletCommandState;
  onConnectVerify?: () => void;
}) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [balanceSol, setBalanceSol] = useState<number | undefined>(
    state.balanceSol,
  );

  useEffect(() => {
    let cancelled = false;
    const loadBalance = async () => {
      if (!wallet.publicKey) {
        setBalanceSol(undefined);
        return;
      }
      try {
        const lamports = await connection.getBalance(wallet.publicKey);
        if (!cancelled) {
          setBalanceSol(lamports / 1_000_000_000);
        }
      } catch {
        if (!cancelled) {
          setBalanceSol(undefined);
        }
      }
    };
    loadBalance().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [connection, wallet.publicKey]);

  return (
    <CommandCenterPanel
      title="Wallet Command Surface"
      subtitle="Connection is required to publish skills, run tasks, and anchor receipts."
      icon={Wallet}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <WalletMultiButton />
          {onConnectVerify ? (
            <Button
              className="bg-[#3bff96] text-black hover:bg-[#62ffb4]"
              onClick={onConnectVerify}
              disabled={!wallet.publicKey}
            >
              Sign & verify
            </Button>
          ) : null}
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5">
            <p className="text-xs text-slate-500">Connection</p>
            <p className="mt-1 text-white">
              {state.connected ? "Connected" : "Disconnected"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5">
            <p className="text-xs text-slate-500">Cluster</p>
            <p className="mt-1 text-white">{SOLANA_CLUSTER}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5">
            <p className="text-xs text-slate-500">Wallet</p>
            <div className="mt-1 flex items-center gap-2 text-white">
              <span>
                {short(
                  state.walletAddress || wallet.publicKey?.toBase58(),
                  8,
                  8,
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-300"
                onClick={() =>
                  navigator.clipboard.writeText(
                    state.walletAddress || wallet.publicKey?.toBase58() || "",
                  )
                }
                disabled={!state.walletAddress && !wallet.publicKey}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-black/40 p-2.5">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="mt-1 text-white">{toSol(balanceSol)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SolanaStatusBadge
            label={state.canPublish ? "Can publish" : "Publish locked"}
            active={state.canPublish}
          />
          <SolanaStatusBadge
            label={state.canRun ? "Can run" : "Run locked"}
            active={state.canRun}
          />
          <SolanaStatusBadge
            label={state.canAnchor ? "Can anchor" : "Anchor locked"}
            active={state.canAnchor}
          />
          {state.signing ? (
            <SolanaStatusBadge label="Signing..." active />
          ) : null}
        </div>
        {state.readOnlyReason ? (
          <LiveStateBanner state="read-only" message={state.readOnlyReason} />
        ) : null}
      </div>
    </CommandCenterPanel>
  );
}

export function SkillAssetCard({
  skill,
  onRun,
  onVerify,
  onPublish,
}: {
  skill: SkillAsset;
  onRun?: (skill: SkillAsset) => void;
  onVerify?: (skill: SkillAsset) => void;
  onPublish?: (skill: SkillAsset) => void;
}) {
  const statusVerified = Boolean(skill.explorerTxHash || skill.explorerUrl);
  return (
    <Card className="border-slate-800 bg-black/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-semibold text-white">{skill.name}</h4>
          <p className="mt-1 text-xs text-slate-400">
            {skill.description || "No description."}
          </p>
        </div>
        <ProofVerificationBadge
          verification={{
            status: statusVerified ? "verified" : "pending",
            label: statusVerified
              ? "Published on Solana"
              : "Awaiting publication",
          }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
          Version {skill.currentVersion}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
          {skill.status}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
          Success {skill.successRate}%
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
          Usage {skill.usageCount}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
          Reputation {skill.reputationScore}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
          Last used{" "}
          {skill.lastUsedAt
            ? new Date(skill.lastUsedAt).toLocaleDateString()
            : "Never"}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {skill.tags.slice(0, 4).map((tag) => (
          <SolanaStatusBadge key={tag} label={tag} subtle />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-cyan-500/40 text-cyan-200"
          onClick={() => onRun?.(skill)}
        >
          Run
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-200"
          onClick={() => onPublish?.(skill)}
        >
          Publish
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-200"
          onClick={() => onVerify?.(skill)}
        >
          Verify
        </Button>
        <ExplorerLinkButton
          payload={{ label: "Open explorer", url: skill.explorerUrl }}
        />
      </div>
    </Card>
  );
}

export function SkillAssetTimeline({
  versions,
}: {
  versions: SkillVersionRecord[];
}) {
  if (!versions.length)
    return (
      <EmptyState
        title="No versions yet"
        message="Publish the first version to start lineage."
      />
    );
  return (
    <div className="space-y-2">
      {versions.map((version) => (
        <div
          key={version.id}
          className="rounded-lg border border-slate-800 bg-black/40 p-3 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">v{version.version}</span>
            <span className="text-slate-400">
              {new Date(version.publishedAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-slate-300">
            {version.changelog || version.description || "No changelog."}
          </p>
          <p className="mt-1 font-mono text-slate-400">
            {short(version.hash, 12, 10)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function TaskExecutionRail({
  execution,
}: {
  execution: TaskExecutionState;
}) {
  const stages: Array<{
    id: TaskExecutionState["phase"];
    label: string;
    icon: LucideIcon;
  }> = [
    { id: "start", label: "Start", icon: PlayCircle },
    { id: "plan", label: "Plan", icon: Radar },
    { id: "execute", label: "Execute", icon: Wrench },
    { id: "observe", label: "Observe", icon: Network },
    { id: "reflect", label: "Reflect", icon: Sparkles },
    { id: "store", label: "Store", icon: MemoryStick },
    { id: "receipt", label: "Receipt", icon: ReceiptText },
  ];
  const activeIndex = stages.findIndex((x) => x.id === execution.phase);
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-7">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const active = idx <= activeIndex;
          return (
            <div
              key={stage.id}
              className={cn(
                "rounded-lg border p-2 text-xs",
                active
                  ? "border-[#3bff96]/40 bg-[#3bff96]/10 text-[#d7ffe9]"
                  : "border-slate-800 bg-black/40 text-slate-400",
              )}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span>{stage.label}</span>
              </div>
              <p>
                {idx === activeIndex
                  ? execution.stepLabel || "Current stage"
                  : "Waiting"}
              </p>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border border-slate-800 bg-black/50 p-3 text-sm text-slate-200">
        <p className="font-medium text-white">{execution.goal}</p>
        <p className="mt-1 text-xs text-slate-400">
          Skill: {execution.skillName || "Not selected"}
        </p>
        {execution.toolCallSummary ? (
          <p className="mt-1 text-xs text-slate-300">
            {execution.toolCallSummary}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ReflectionCard({
  reflection,
  record,
  receipt,
}: {
  reflection: ReflectionState;
  record?: ReflectionRecordOffchain;
  receipt?: MemoryReceiptOnChain | null;
}) {
  return (
    <Card className="border-slate-800 bg-black/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-white">
          Reflection artifact
        </h4>
        <ProofVerificationBadge
          verification={{
            status: reflection.anchored ? "verified" : "pending",
            label: reflection.anchored
              ? "Receipt anchored on Solana"
              : "Not anchored yet",
          }}
        />
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2.5">
          <p className="text-xs text-slate-500">Source turn</p>
          <p className="mt-1 text-slate-200">{reflection.sourceTurnId}</p>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2.5">
          <p className="text-xs text-slate-500">Outcome</p>
          <p className="mt-1 text-slate-200">{reflection.outcome}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <p className="text-slate-300">
          <span className="text-slate-500">Root cause:</span>{" "}
          {reflection.rootCause}
        </p>
        <p className="text-slate-300">
          <span className="text-slate-500">Corrective advice:</span>{" "}
          {reflection.correctiveAdvice}
        </p>
        <p className="text-slate-300">
          <span className="text-slate-500">Next action:</span>{" "}
          {reflection.nextAction}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <SolanaStatusBadge
          label={
            reflection.storedAsMemory ? "Stored as memory" : "Memory pending"
          }
          active={reflection.storedAsMemory}
        />
        <SolanaStatusBadge
          label={
            reflection.injectedNextTurn
              ? "Injected into next turn"
              : "Not injected"
          }
          active={reflection.injectedNextTurn}
        />
      </div>
      {record?.storageRef ? (
        <p className="mt-3 text-xs text-slate-500">
          Storage ref: {record.storageRef}
        </p>
      ) : null}
      {receipt?.id ? (
        <p className="mt-1 text-xs text-slate-500">Receipt ID: {receipt.id}</p>
      ) : null}
    </Card>
  );
}

export function MemoryArtifactCard({
  memory,
  timeline,
}: {
  memory: {
    id: string;
    summary: string;
    kind: string;
    createdAt?: string | number;
    sourceTurnId?: string;
    correctiveAdvice?: string;
  };
  timeline?: MemoryLifecycleEvent[];
}) {
  return (
    <Card className="border-slate-800 bg-black/40 p-4">
      <h4 className="text-base font-semibold text-white">Memory artifact</h4>
      <p className="mt-2 text-sm text-slate-300">{memory.summary}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
          {memory.kind}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
          {formatTs(memory.createdAt)}
        </div>
      </div>
      {memory.correctiveAdvice ? (
        <p className="mt-2 text-xs text-slate-400">
          Lesson: {memory.correctiveAdvice}
        </p>
      ) : null}
      {timeline?.length ? (
        <div className="mt-3 space-y-1.5">
          {timeline.slice(0, 4).map((event) => (
            <div
              key={event.id}
              className="rounded border border-slate-800 bg-black/60 p-2 text-xs text-slate-300"
            >
              <span className="text-slate-500">
                {event.kind.replaceAll("_", " ")}
              </span>{" "}
              · {event.message}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export function OnchainReceiptCard({
  receipt,
  explorerUrl,
}: {
  receipt: {
    id?: string;
    title?: string;
    createdAt?: string | number;
    wallet?: string;
    summaryHash?: string;
    txSignature?: string;
    verified?: boolean;
    storageRef?: string;
    memoryId?: string;
    reflectionId?: string;
  };
  explorerUrl?: string;
}) {
  const verification: VerificationState = receipt.verified
    ? { status: "verified", label: "Verified on Solana" }
    : { status: "pending", label: "Verification pending" };
  return (
    <Card className="border-slate-800 bg-black/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-white">On-chain receipt</h4>
        <ProofVerificationBadge verification={verification} />
      </div>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
          Receipt {short(receipt.id, 12, 8)}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
          Wallet {short(receipt.wallet, 8, 8)}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
          TX {short(receipt.txSignature, 12, 10)}
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
          {formatTs(receipt.createdAt)}
        </div>
      </div>
      {receipt.summaryHash ? (
        <p className="mt-2 font-mono text-xs text-slate-400">
          Summary hash {short(receipt.summaryHash, 14, 12)}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ExplorerLinkButton
          payload={{
            label: "Open explorer",
            signature: receipt.txSignature,
            url: explorerUrl,
          }}
        />
        {receipt.id ? (
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-200"
            onClick={() => navigator.clipboard.writeText(receipt.id || "")}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy receipt ID
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export function DemoStoryStepper({ steps }: { steps: DemoStoryStepPayload[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, idx) => (
        <div
          key={step.id}
          className="flex items-start gap-2 rounded-lg border border-slate-800 bg-black/40 p-2.5"
        >
          <div
            className={cn(
              "mt-0.5 h-5 w-5 rounded-full border text-center text-[10px] leading-5",
              step.status === "completed"
                ? "border-[#3bff96]/60 bg-[#3bff96]/15 text-[#b8ffd8]"
                : step.status === "active"
                  ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 bg-slate-950 text-slate-400",
            )}
          >
            {idx + 1}
          </div>
          <div>
            <p className="text-sm text-white">{step.title}</p>
            <p className="text-xs text-slate-400">{step.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-slate-800 bg-black/40 p-5 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </Card>
  );
}

export function LoadingSkeleton({
  label = "Loading command center state...",
}: {
  label?: string;
}) {
  return (
    <Card className="border-slate-800 bg-black/40 p-5">
      <div className="flex items-center gap-2 text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    </Card>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-red-500/30 bg-red-500/10 p-5">
      <p className="text-sm font-medium text-red-100">{title}</p>
      <p className="mt-1 text-xs text-red-200/80">{message}</p>
      {onRetry ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 border-red-400/50 text-red-100"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </Card>
  );
}

export function buildExplorerTxUrl(
  txSignature?: string,
  cluster = SOLANA_CLUSTER,
) {
  if (!txSignature) return undefined;
  return `https://explorer.solana.com/tx/${txSignature}?cluster=${cluster}`;
}

export function resolveLoopStep(execution: TaskExecutionState): number {
  const map: Record<TaskExecutionState["phase"], number> = {
    start: 0,
    plan: 2,
    execute: 3,
    observe: 3,
    reflect: 4,
    store: 6,
    receipt: 7,
    done: STORY_LOOP_LABELS.length - 1,
  };
  return map[execution.phase];
}

export function buildDemoSteps(): DemoStoryStepPayload[] {
  return [
    {
      id: "wallet",
      title: STORY_LOOP_LABELS[0],
      detail:
        "Authorize your Solana wallet to sign the session and anchor receipts.",
      status: "completed",
    },
    {
      id: "skill",
      title: STORY_LOOP_LABELS[1],
      detail: "Select a published skill asset from the Solana-facing registry.",
      status: "completed",
    },
    {
      id: "task",
      title: STORY_LOOP_LABELS[2],
      detail:
        "Planner, tools, and execution rail update against your Solana session.",
      status: "active",
    },
    {
      id: "reflection",
      title: STORY_LOOP_LABELS[3],
      detail: "Structured reflection captures root cause and next action.",
      status: "pending",
    },
    {
      id: "memory",
      title: STORY_LOOP_LABELS[4],
      detail:
        "Lesson persists via 0G Storage; Solana anchors a compact checksum.",
      status: "pending",
    },
    {
      id: "zg-storage",
      title: STORY_LOOP_LABELS[5],
      detail:
        "Reflection + execution narrative written as canonical blob payloads.",
      status: "pending",
    },
    {
      id: "zg-da",
      title: STORY_LOOP_LABELS[6],
      detail: "Append-only lineage + batch roots for replay and audits.",
      status: "pending",
    },
    {
      id: "anchor",
      title: STORY_LOOP_LABELS[7],
      detail:
        "Compact PDAs / receipts on Solana; long text never lands on-chain here.",
      status: "pending",
    },
    {
      id: "explorer",
      title: STORY_LOOP_LABELS[8],
      detail:
        "Open Solana Explorer when tx is live — demo SIM sigs stay labeled demo-only.",
      status: "pending",
    },
  ];
}

/**
 * Command-center UX model: drives headlines, primary actions, and proof-channel copy.
 * Keeps Solana wallet → skill → execution → reflection → memory → receipt narrative explicit.
 */

import { autonomyLabel, type AutonomyLevel } from "./autonomy";
import type { SwarmExecuteResult } from "./domainModel";

export type UXState =
  | "onboarding"
  | "wallet_connect"
  | "session_verification"
  | "skill_selection"
  | "standby"
  | "planning"
  | "executing"
  | "reflecting"
  | "memory_write"
  | "receipt_anchor"
  | "proof_verification"
  | "replaying"
  | "error"
  | "degraded"
  | "demo";

export type ProofChannel =
  | "verified"
  | "pending"
  | "cached_only"
  | "demo_only"
  | "unavailable";

export type NextActionKind =
  | "connect"
  | "verify"
  | "fix_cluster"
  | "select_skill"
  | "run"
  | "view_explorer"
  | "idle";

export interface UXTimelineItem {
  id: string;
  label: string;
  description: string;
  status: "pending" | "active" | "completed" | "failed" | "skipped";
  timestamp?: string;
  proofStatus?:
    | "unverified"
    | "pending"
    | "verified"
    | "cached_only"
    | "degraded";
  linkLabel?: string;
  linkUrl?: string;
}

export interface CommandUXSnapshot {
  uxState: UXState;
  headline: string;
  subline: string;
  nextActionLabel: string;
  nextActionKind: NextActionKind;
  proofChannel: ProofChannel;
  proofChannelExplanation: string;
  autonomyBandLabel: string;
}

export interface DeriveCommandUXInput {
  demoMode: boolean;
  walletConnected: boolean;
  wrongCluster: boolean;
  sessionVerified: boolean;
  selectedSkillId: string | null;
  hasRegistrySkills: boolean;
  loopBusy: boolean;
  loopError: string | null;
  lastResult: SwarmExecuteResult | null;
  registryDegraded: boolean;
  autonomyLevel?: AutonomyLevel;
  autonomyScore: number;
}

function bandLabel(level: AutonomyLevel | undefined, score: number): string {
  if (level) return autonomyLabel(level);
  return `Autonomy score ${score}`;
}

function executionToUxState(
  status: string | undefined,
  busy: boolean,
): UXState | null {
  if (busy) return "executing";
  if (!status || status === "idle") return null;
  if (status === "planning") return "planning";
  if (status === "running") return "executing";
  if (status === "failed") return "reflecting";
  if (status === "reflected") return "reflecting";
  if (status === "stored") return "memory_write";
  if (status === "anchored") return "receipt_anchor";
  if (status === "verified" || status === "succeeded")
    return "proof_verification";
  if (status === "degraded") return "degraded";
  return "executing";
}

function proofChannelFromRun(
  result: SwarmExecuteResult | null,
  demoMode: boolean,
): { channel: ProofChannel; explanation: string } {
  if (demoMode && !result) {
    return {
      channel: "demo_only",
      explanation:
        "Demo mode uses seeded fixtures; treat explorer links as illustrative unless marked live.",
    };
  }
  if (!result) {
    return {
      channel: "unavailable",
      explanation:
        "No run yet — there is no Solana receipt or signature to verify.",
    };
  }
  if (result.degraded) {
    return {
      channel: "cached_only",
      explanation:
        "Degraded path: some verification used cache or fallback — re-run when RPC or indexer recovers.",
    };
  }
  const st = result.execution.status;
  if (st === "verified" || st === "succeeded") {
    return {
      channel: "verified",
      explanation:
        "Execution record aligns with anchored receipt — open Solana Explorer for signature and accounts.",
    };
  }
  if (demoMode) {
    return {
      channel: "demo_only",
      explanation:
        "Demo bundle mixed with session — confirm signatures labeled live vs fixture.",
    };
  }
  return {
    channel: "pending",
    explanation:
      "Run still settling or proof not yet anchored on your cluster.",
  };
}

export function deriveCommandUX(
  input: DeriveCommandUXInput,
): CommandUXSnapshot {
  const {
    demoMode,
    walletConnected,
    wrongCluster,
    sessionVerified,
    selectedSkillId,
    hasRegistrySkills,
    loopBusy,
    loopError,
    lastResult,
    registryDegraded,
    autonomyLevel,
    autonomyScore,
  } = input;

  const band = bandLabel(autonomyLevel, autonomyScore);

  if (demoMode) {
    const pc = proofChannelFromRun(lastResult, true);
    return {
      uxState: "demo",
      headline: "Demo mode — full story playback",
      subline:
        "Seeded wallet, skill, execution, reflection, memory, and receipts for judges and dry runs. Turn off for live chain behavior.",
      nextActionLabel: "Run demo loop or open mock demo hub",
      nextActionKind: "run",
      proofChannel: pc.channel,
      proofChannelExplanation: pc.explanation,
      autonomyBandLabel: band,
    };
  }

  if (wrongCluster && walletConnected) {
    return {
      uxState: "error",
      headline: "Wrong Solana cluster for this session",
      subline:
        "Switch your wallet to the cluster this deployment expects, then reconnect and sign session again.",
      nextActionLabel: "Switch cluster + reconnect wallet",
      nextActionKind: "fix_cluster",
      proofChannel: "unavailable",
      proofChannelExplanation:
        "Proof anchoring is blocked until wallet RPC cluster matches the verified session.",
      autonomyBandLabel: band,
    };
  }

  if (loopError) {
    const pc = proofChannelFromRun(lastResult, false);
    return {
      uxState: "error",
      headline: "Run failed — details below",
      subline: loopError,
      nextActionLabel: "Fix the issue, then retry the loop",
      nextActionKind: "run",
      proofChannel: pc.channel,
      proofChannelExplanation: pc.explanation,
      autonomyBandLabel: band,
    };
  }

  if (registryDegraded && !hasRegistrySkills) {
    return {
      uxState: "degraded",
      headline: "Skill registry unavailable",
      subline:
        "Indexer or API did not return skills — retry fetch or enable demo mode to preview the narrative.",
      nextActionLabel: "Retry registry load",
      nextActionKind: "idle",
      proofChannel: "unavailable",
      proofChannelExplanation:
        "No published skills loaded — execution cannot bind to a capability.",
      autonomyBandLabel: band,
    };
  }

  if (!walletConnected) {
    return {
      uxState: "wallet_connect",
      headline: "Connect Phantom",
      subline:
        "Your address scopes receipts and memory; signing proves control without custody.",
      nextActionLabel: "Connect Phantom + sign session",
      nextActionKind: "connect",
      proofChannel: "unavailable",
      proofChannelExplanation:
        "Without a connected wallet, runs cannot bind identity or anchor to your address.",
      autonomyBandLabel: band,
    };
  }

  if (!sessionVerified) {
    return {
      uxState: "session_verification",
      headline: "Verify Solana session",
      subline:
        "Sign the human-readable session message so the backend can issue a scoped token for anchoring.",
      nextActionLabel: "Sign session with wallet",
      nextActionKind: "verify",
      proofChannel: "pending",
      proofChannelExplanation:
        "Session not verified — anchoring and some registry calls may be rejected.",
      autonomyBandLabel: band,
    };
  }

  if (!selectedSkillId || !hasRegistrySkills) {
    return {
      uxState: "skill_selection",
      headline: "Choose a published skill",
      subline:
        "Pick a versioned capability — reputation, usage, and author wallet are part of provenance.",
      nextActionLabel: hasRegistrySkills
        ? "Select a skill from the registry"
        : "Retry load or use demo mode",
      nextActionKind: "select_skill",
      proofChannel: "pending",
      proofChannelExplanation:
        "No active skill — the swarm cannot plan or execute until one is selected.",
      autonomyBandLabel: band,
    };
  }

  const execUx = executionToUxState(lastResult?.execution.status, loopBusy);
  if (
    execUx &&
    (loopBusy || (lastResult && lastResult.execution.status !== "idle"))
  ) {
    const status = lastResult?.execution.status;
    const pc = proofChannelFromRun(lastResult ?? null, false);

    let headline = "Mission in progress";
    let subline = "Agents are advancing the plan under your verified session.";

    if (loopBusy) {
      headline = "Orchestrating swarm";
      subline =
        "Selecting skill on-chain, then executing planner → operators → critic with policy gates.";
    } else if (status === "verified" || status === "succeeded") {
      headline = "Proof path complete";
      subline =
        "Receipt anchored — inspect transaction, accounts, and linked memory on Solana Explorer.";
    } else if (status === "failed") {
      headline = "Execution fault — reflection emitted";
      subline =
        "Structured critique and corrective advice feed the next turn; memory writes when storage path succeeds.";
    } else if (status === "planning") {
      headline = "Planning";
      subline = "Receipt-linked plan is being assembled for your goal.";
    } else if (status === "degraded") {
      headline = "Degraded verification";
      subline =
        "Partial proof — retry when infrastructure is healthy; prior session and wallet state are safe.";
    }

    const explorerReady = Boolean(
      lastResult?.execution.explorerUrl ??
        lastResult?.receipts?.[0]?.txSignature,
    );

    return {
      uxState: execUx,
      headline,
      subline,
      nextActionLabel:
        status === "verified" || status === "succeeded"
          ? explorerReady
            ? "Open Solana Explorer for this run"
            : "Start next turn with lesson applied"
          : "Review stages below, then retry if needed",
      nextActionKind:
        status === "verified" || status === "succeeded"
          ? "view_explorer"
          : "run",
      proofChannel: pc.channel,
      proofChannelExplanation: pc.explanation,
      autonomyBandLabel: band,
    };
  }

  const idleProof = proofChannelFromRun(null, false);
  return {
    uxState: "standby",
    headline: "Ready — run proof-linked loop",
    subline:
      "Wallet verified and skill selected. One run walks plan → execution → reflection → memory → Solana receipt.",
    nextActionLabel: "Run Solana proof-linked loop",
    nextActionKind: "run",
    proofChannel: idleProof.channel,
    proofChannelExplanation: idleProof.explanation,
    autonomyBandLabel: band,
  };
}

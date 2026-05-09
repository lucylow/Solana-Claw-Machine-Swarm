export type SwarmJudgingPillar =
  | "innovation"
  | "agenticSophistication"
  | "traction";

export interface SwarmJudgingCriterion {
  id: SwarmJudgingPillar;
  label: string;
  weight: number;
  evidence: string[];
  judgeQuestion: string;
}

export interface SwarmSubmissionMetric {
  label: string;
  value: string;
  detail: string;
}

export interface SwarmSubmissionLink {
  label: string;
  href: string;
  detail: string;
  internal?: boolean;
}

export interface SwarmSubmissionAsset {
  title: string;
  status: "ready" | "needs-live-link" | "demo-mode";
  detail: string;
}

export interface SwarmSubmissionScoreInput {
  innovation: number;
  agenticSophistication: number;
  traction: number;
}

export interface SwarmSubmissionScoreBreakdown {
  criterion: SwarmJudgingPillar;
  normalizedScore: number;
  weightedPoints: number;
}

export interface SwarmSubmissionScoreResult {
  total: number;
  breakdown: SwarmSubmissionScoreBreakdown[];
}

export const SWARM_JUDGING_CRITERIA: SwarmJudgingCriterion[] = [
  {
    id: "innovation",
    label: "Innovation",
    weight: 40,
    judgeQuestion:
      "Does the demo introduce a genuinely new Solana-native primitive for agent economies?",
    evidence: [
      "Wallet → skill → execution → reflection → memory → receipt loop makes agent work auditable instead of ephemeral.",
      "Structured receipts separate plan, execution, reflection, memory, proof anchors, and off-chain storage references.",
      "0G sidecar and OpenClaw bridge demonstrate interoperability beyond a single agent runtime.",
    ],
  },
  {
    id: "agenticSophistication",
    label: "Agentic sophistication",
    weight: 30,
    judgeQuestion:
      "How much does the AI decide, recover, and coordinate instead of simply automating a fixed script?",
    evidence: [
      "Planner selects skills by reputation, policy, wallet scope, and proof requirements.",
      "Execution orchestration records failure handling, reflection, corrective advice, and memory promotion.",
      "DAO and reputation modules show how agent teams can govern shared workflows and payout rules.",
    ],
  },
  {
    id: "traction",
    label: "Traction",
    weight: 30,
    judgeQuestion:
      "Can a judge, user, or partner verify usage, receipts, and a repeatable demo quickly?",
    evidence: [
      "Demo mode gives judges a deterministic end-to-end loop when RPC, wallet, or devnet state is unavailable.",
      "Live mode exposes Solana explorer links, PDA derivation, receipt verification, and wallet session status.",
      "Submission checklist identifies the remaining external artifacts: public GitHub URL, live demo URL, and founder pitch video.",
    ],
  },
];

export const SWARM_SUBMISSION_METRICS: SwarmSubmissionMetric[] = [
  {
    label: "Judging fit",
    value: "100% mapped",
    detail:
      "Innovation, agentic sophistication, and traction each have product evidence and demo paths.",
  },
  {
    label: "Receipt spine",
    value: "6 proof stages",
    detail:
      "Plan, execution, reflection, memory, 0G storage reference, and Solana anchor are tracked separately.",
  },
  {
    label: "Demo fallback",
    value: "Deterministic",
    detail:
      "The app clearly labels simulated rows so judges can review the full story without false on-chain claims.",
  },
  {
    label: "RFB alignment",
    value: "RFB 01 + 05",
    detail:
      "Agent discovery and multi-agent orchestration are the primary SWARM requests-for-builders covered.",
  },
];

export const SWARM_SUBMISSION_LINKS: SwarmSubmissionLink[] = [
  {
    label: "Working dApp",
    href: "/dashboard?section=overview&demo=1",
    detail:
      "Open the wallet-to-receipt demo dashboard from the primary dApp surface.",
    internal: true,
  },
  {
    label: "Full demo story",
    href: "/demo/full-story",
    detail:
      "Judge-friendly narrative replay with proof states, reflection, memory, and receipt lineage.",
    internal: true,
  },
  {
    label: "Proof explorer",
    href: "/proofs",
    detail:
      "Inspect receipt truth labels, storage references, signatures, and degraded-proof warnings.",
    internal: true,
  },
  {
    label: "Open source repository",
    href: "https://github.com/lucylow/Solana-Claw-Machine-Swarm",
    detail: "Public GitHub reference for Frontier submission and code review.",
  },
];

export const SWARM_SUBMISSION_ASSETS: SwarmSubmissionAsset[] = [
  {
    title: "Live working product",
    status: "ready",
    detail:
      "The app builds into a deployable Vite + Express product with landing, wallet state, dApp dashboard, and proof routes.",
  },
  {
    title: "Judge demo path",
    status: "ready",
    detail:
      "Use the landing page first, then /submission, then /dashboard?section=overview&demo=1 to run the dApp proof loop.",
  },
  {
    title: "Public GitHub link",
    status: "needs-live-link",
    detail:
      "Update the link after pushing this final package or keep the existing public repository URL if it remains canonical.",
  },
  {
    title: "Founder pitch video",
    status: "needs-live-link",
    detail:
      "Record a concise 2-minute video covering who you are, what was built, why now, and what judges should try first.",
  },
  {
    title: "Solana proof path",
    status: "demo-mode",
    detail:
      "Devnet anchoring is supported; demo receipts remain visibly labeled when no live signature is present.",
  },
];

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}

export function calculateSwarmSubmissionScore(
  input: SwarmSubmissionScoreInput,
): SwarmSubmissionScoreResult {
  const byCriterion: Record<SwarmJudgingPillar, number> = {
    innovation: input.innovation,
    agenticSophistication: input.agenticSophistication,
    traction: input.traction,
  };

  const breakdown = SWARM_JUDGING_CRITERIA.map((criterion) => {
    const normalizedScore = clampScore(byCriterion[criterion.id]);
    return {
      criterion: criterion.id,
      normalizedScore,
      weightedPoints: Number(
        ((normalizedScore / 100) * criterion.weight).toFixed(2),
      ),
    };
  });

  return {
    breakdown,
    total: Number(
      breakdown.reduce((sum, item) => sum + item.weightedPoints, 0).toFixed(2),
    ),
  };
}

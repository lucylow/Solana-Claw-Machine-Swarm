import { nanoid } from "nanoid";
import type { SolanaCluster } from "@shared/solana/types";
import {
  approvalRatio,
  deriveCanonicalStatus,
  lamportsToSolString,
  participationBpsFromCounts,
} from "@shared/dao/engine";
import type {
  DaoAgentRecommendation,
  DaoCommandCenterPayload,
  DaoDelegation,
  DaoExecutionReceipt,
  DaoGovernanceMemoryRecord,
  DaoMember,
  DaoMemberRole,
  DaoProposal,
  DaoProposalStatus,
  DaoProposalType,
  DaoTreasurySnapshot,
  DaoVote,
} from "@shared/dao/types";
import {
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  explorerBaseUrl,
} from "../solana/explorer";
import type {
  DaoAgentRecommendationRecord,
  DaoConfigRecord,
  DaoDelegationRecord,
  DaoGovernanceMemoryPersist,
  DaoMemberRecord,
  DaoProposalKind,
  DaoProposalRecord,
  DaoTreasurySnapshotPersist,
  DaoVoteLedgerRecord,
} from "./daoTypes";

const DAO_PROGRAM_ID_DEFAULT = "ClAwDAo111111111111111111111111111111111111";

function kindToProposalType(kind: DaoProposalKind): DaoProposalType {
  const m: Record<DaoProposalKind, DaoProposalType> = {
    treasury_spend: "treasury_allocation",
    dao_grant: "grant",
    parameter_change: "parameter_change",
    skill_approve: "skill_listing",
    skill_version_approve: "skill_listing",
    text: "community_initiative",
  };
  return m[kind] ?? "other";
}

function inferPolicy(
  kind: DaoProposalKind,
): "low" | "medium" | "high" | "critical" {
  if (kind === "treasury_spend" || kind === "dao_grant") return "high";
  if (kind === "parameter_change") return "medium";
  return "low";
}

function memberRoleFromRecord(
  m: DaoMemberRecord,
  incomingDelegationCount: number,
): DaoMemberRole {
  if (incomingDelegationCount > 0) return "delegate";
  if (m.reputationPoints > 80 && m.stakeLamports > 2_000_000) return "council";
  return "member";
}

export function mapMemberRecord(
  m: DaoMemberRecord,
  delegations: DaoDelegationRecord[],
): DaoMember {
  const incoming = delegations.filter(
    (d) => d.status === "active" && d.toWallet === m.wallet,
  );
  const delegatedPower = incoming.reduce((acc, d) => {
    // weight field stores delegator snapshot at delegation time
    return acc + d.weight;
  }, 0);
  const role = memberRoleFromRecord(m, incoming.length);
  return {
    id: `mem_${m.wallet.slice(0, 8)}`,
    walletAddress: m.wallet,
    role,
    weight: m.votingPower,
    delegatedWeight: delegatedPower || undefined,
    reputationScore: m.reputationPoints,
    joinedAt: new Date(m.joinedAt).toISOString(),
    lastActiveAt: new Date(m.updatedAt).toISOString(),
    verified: m.active,
    permissions: {
      canVote: m.active,
      canDelegate: m.active,
      canPropose: m.active && m.stakeLamports >= 1_000_000,
      canExecute: role === "council" || m.reputationPoints > 85,
      canViewTreasury: true,
      canReviewProposals: role === "council",
    },
    metadata: { stakeLamports: m.stakeLamports, delegate: m.delegate },
  };
}

export function mapDelegationRecord(d: DaoDelegationRecord): DaoDelegation {
  return {
    id: d.id,
    fromWallet: d.fromWallet,
    toWallet: d.toWallet,
    weight: d.weight,
    reason: d.reason,
    createdAt: new Date(d.createdAt).toISOString(),
    revokedAt: d.revokedAt ? new Date(d.revokedAt).toISOString() : undefined,
    status: d.status,
    proofReceiptId: d.proofReceiptId,
    pda: d.pda,
  };
}

export function mapProposalRecord(
  p: DaoProposalRecord,
  cfg: DaoConfigRecord | undefined,
  eligibleMembers: number,
  cluster: SolanaCluster,
  programId: string,
): DaoProposal {
  const participationBps = participationBpsFromCounts(
    p.voterCount,
    Math.max(1, eligibleMembers),
  );
  const vetoVotes = p.vetoVotes ?? 0;
  const approval = approvalRatio(p.yesVotes, p.noVotes + vetoVotes);
  const threshold = (cfg?.proposalThresholdBps ?? 5000) / 10000;
  const finalized =
    p.status === "succeeded" ||
    p.status === "defeated" ||
    p.status === "executed";
  const executed = p.status === "executed";
  const canonicalStatus: DaoProposalStatus = deriveCanonicalStatus({
    legacyStatus: p.status,
    participationBps,
    quorumBps: cfg?.quorumBps ?? p.quorumBps,
    approval,
    threshold,
    finalized,
    executed,
  });

  return {
    id: String(p.proposalId),
    title: p.title,
    summary: p.description.slice(0, 280) || p.title,
    fullDescription: p.description.length > 280 ? p.description : undefined,
    proposalType: kindToProposalType(p.kind),
    status: canonicalStatus,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
    authorWallet: p.proposer,
    policyLevel: inferPolicy(p.kind),
    quorumRequired: p.quorumBps,
    quorumReached: participationBps,
    thresholdRequired: threshold,
    voteYes: p.yesVotes,
    voteNo: p.noVotes,
    voteAbstain: p.abstainVotes,
    voteVeto: vetoVotes,
    totalVotingPower: p.totalVotes,
    executionReady: p.status === "succeeded",
    executionTxSignature: p.executionTxSignature,
    executionReceiptId: p.executionReceiptId,
    proposalReceiptId: p.proposalReceiptId,
    proofStatus: (p.proofStatus ?? "pending") as DaoProposal["proofStatus"],
    onchain: {
      cluster,
      programId,
      pda: p.onchainPda,
      account: p.onchainAccount,
      txSignature: p.createTxSignature,
    },
    offchain: {
      storageRef: p.offchainStorageRef,
      discussionThreadId: p.discussionThreadId,
      checksum: p.offchainChecksum,
    },
    treasuryImpact:
      p.kind === "treasury_spend" || p.kind === "dao_grant"
        ? {
            amount: p.amountLamports,
            destination: p.recipient,
            budgetCategory: p.kind,
          }
        : undefined,
    metadata: {
      skillKey: p.skillKey,
      legacyStatus: p.status,
      voterCount: p.voterCount,
    },
  };
}

export function mapVoteLedger(v: DaoVoteLedgerRecord): DaoVote {
  return {
    id: v.id,
    proposalId: String(v.proposalId),
    voterWallet: v.voterWallet,
    choice: v.choice,
    weight: v.weight,
    reason: v.reason,
    createdAt: new Date(v.createdAt).toISOString(),
    proofReceiptId: v.proofReceiptId,
    status: "counted",
    metadata: {},
  };
}

export function mapAgentRec(
  a: DaoAgentRecommendationRecord,
): DaoAgentRecommendation {
  return {
    id: a.id,
    proposalId: String(a.proposalId),
    agentId: a.agentId,
    agentName: a.agentName,
    role: a.role as DaoAgentRecommendation["role"],
    summary: a.summary,
    recommendation: a.recommendation,
    confidence: a.confidence,
    risks: a.risks,
    supportingEvidence: a.supportingEvidence,
    createdAt: new Date(a.createdAt).toISOString(),
    status: a.status,
    humanDisposition: a.humanDisposition,
  };
}

export function mapMemory(
  m: DaoGovernanceMemoryPersist,
): DaoGovernanceMemoryRecord {
  return {
    id: m.id,
    proposalId: String(m.proposalId),
    title: m.title,
    lesson: m.lesson,
    outcome: m.outcome as DaoGovernanceMemoryRecord["outcome"],
    createdAt: new Date(m.createdAt).toISOString(),
    linkedReceiptIds: m.linkedReceiptIds,
    storageRef: m.storageRef,
    metadata: {},
  };
}

export function mapExecutionReceipt(
  r: import("./daoTypes").DaoExecutionReceiptPersist,
  cluster: SolanaCluster,
): DaoExecutionReceipt {
  const explorerUrl =
    r.txSignature && r.explorerUrl === undefined
      ? buildExplorerTxUrl(r.txSignature, cluster)
      : r.explorerUrl;
  return {
    id: r.id,
    proposalId: String(r.proposalId),
    walletAddress: r.walletAddress,
    cluster,
    txSignature: r.txSignature,
    title: r.title,
    summary: r.summary,
    status: r.status as DaoExecutionReceipt["status"],
    proofStatus: r.proofStatus as DaoExecutionReceipt["proofStatus"],
    createdAt: new Date(r.createdAt).toISOString(),
    explorerUrl,
    storageRef: r.storageRef,
    metadata: {},
  };
}

export function mapTreasurySnapshot(
  t: DaoTreasurySnapshotPersist,
  cluster: SolanaCluster,
): DaoTreasurySnapshot {
  return {
    id: t.id,
    walletAddress: t.walletAddress,
    cluster,
    totalBalanceLamports: t.totalBalanceLamports,
    totalBalanceSol: t.totalBalanceSol,
    tokenBalances: t.tokenBalances,
    lastUpdatedAt: new Date(t.lastUpdatedAt).toISOString(),
    proofReceiptId: t.proofReceiptId,
    account: t.account,
    pda: t.pda,
    status: t.status as DaoTreasurySnapshot["status"],
  };
}

export function defaultAgentCouncilForProposal(
  proposalId: number,
): DaoAgentRecommendationRecord[] {
  const now = Date.now();
  const base = (
    suffix: string,
    role: DaoAgentRecommendationRecord["role"],
    name: string,
  ) =>
    ({
      id: nanoid(),
      proposalId,
      agentId: `agent_${suffix}`,
      agentName: name,
      role,
      summary: `Automated ${name.toLowerCase()} pass for proposal ${proposalId}.`,
      recommendation:
        "Review quorum, treasury impact, and execution path before finalizing.",
      confidence: 0.7,
      risks: ["Data may be incomplete until treasury snapshot refreshes."],
      supportingEvidence: ["local_store", "policy_default"],
      createdAt: now,
      status: "ready" as const,
      humanDisposition: "pending" as const,
    }) satisfies DaoAgentRecommendationRecord;
  return [
    base("drafter", "proposal_drafter", "Proposal Drafter"),
    base("risk", "risk_analyst", "Risk Analyst"),
    base("policy", "policy_reviewer", "Policy Reviewer"),
  ];
}

export function buildLiveCommandCenter(input: {
  cfg: DaoConfigRecord | undefined;
  members: DaoMemberRecord[];
  proposals: DaoProposalRecord[];
  delegations: DaoDelegationRecord[];
  voteLedger: DaoVoteLedgerRecord[];
  agentRecs: DaoAgentRecommendationRecord[];
  memories: DaoGovernanceMemoryPersist[];
  execReceipts: import("./daoTypes").DaoExecutionReceiptPersist[];
  treasurySnaps: DaoTreasurySnapshotPersist[];
  cluster: SolanaCluster;
  walletAddress?: string;
  effectiveWeight: number;
  programId?: string;
}): DaoCommandCenterPayload {
  const programId =
    input.programId ||
    process.env.SOLANA_DAO_PROGRAM_ID ||
    DAO_PROGRAM_ID_DEFAULT;
  const eligible = input.members.filter((m) => m.active).length;
  const delegations = input.delegations.map(mapDelegationRecord);
  const members = input.members.map((m) =>
    mapMemberRecord(m, input.delegations),
  );
  const proposals = input.proposals.map((p) =>
    mapProposalRecord(p, input.cfg, eligible, input.cluster, programId),
  );
  const votes = input.voteLedger.map(mapVoteLedger);
  const agentRecommendations = input.agentRecs.map(mapAgentRec);
  const governanceMemory = input.memories.map(mapMemory);
  const executionReceipts = input.execReceipts.map((r) =>
    mapExecutionReceipt(r, input.cluster),
  );
  const treasury = input.treasurySnaps[0]
    ? mapTreasurySnapshot(input.treasurySnaps[0], input.cluster)
    : input.cfg?.treasury
      ? ({
          id: "treasury_default",
          walletAddress: input.cfg.treasury,
          cluster: input.cluster,
          totalBalanceLamports: "0",
          totalBalanceSol: "0.0000",
          tokenBalances: [],
          lastUpdatedAt: new Date().toISOString(),
          status: "cached_only",
        } satisfies DaoTreasurySnapshot)
      : null;

  const active = proposals.find(
    (p) =>
      p.status === "voting" ||
      p.status === "quorum_reached" ||
      p.status === "review",
  );

  const wallet = input.walletAddress;
  const member = wallet
    ? (members.find((mm) => mm.walletAddress === wallet) ?? null)
    : null;

  return {
    cluster: input.cluster,
    programId,
    explorerBaseUrl: explorerBaseUrl(),
    demoMode: false,
    walletAddress: wallet,
    member,
    effectiveVoteWeight: input.effectiveWeight,
    delegationsIncoming: wallet
      ? delegations.filter(
          (d) => d.toWallet === wallet && d.status === "active",
        )
      : [],
    delegationsOutgoing: wallet
      ? delegations.filter(
          (d) => d.fromWallet === wallet && d.status === "active",
        )
      : [],
    configSummary: {
      name: input.cfg?.name ?? "CLAW DAO",
      quorumBps: input.cfg?.quorumBps ?? 4000,
      thresholdBps: input.cfg?.proposalThresholdBps ?? 5000,
      paused: input.cfg?.paused ?? false,
      minStakeLamports: input.cfg?.minStakeLamports ?? 0,
      spendLimitLamports: input.cfg?.spendLimitLamports ?? 0,
    },
    proposals,
    members,
    delegations,
    votes,
    treasury,
    executionReceipts,
    agentRecommendations,
    governanceMemory,
    activeProposalId: active?.id ?? null,
    timeline: buildTimelineFromProposal(active),
    degradedReasons: [],
  };
}

function buildTimelineFromProposal(
  p: DaoProposal | undefined,
): import("@shared/dao/types").DaoTimelineStage[] {
  if (!p) {
    return [
      {
        id: "draft",
        label: "Proposal drafted",
        done: false,
        artifact: "offchain",
      },
      {
        id: "agents",
        label: "Agent council review",
        done: false,
        artifact: "offchain",
      },
      {
        id: "publish",
        label: "Published to wallet members",
        done: false,
        artifact: "receipt",
      },
      {
        id: "vote",
        label: "Voting open on Solana",
        done: false,
        artifact: "chain",
      },
      {
        id: "quorum",
        label: "Quorum progress",
        done: false,
        artifact: "chain",
      },
      {
        id: "finalize",
        label: "Finalize proposal",
        done: false,
        artifact: "receipt",
      },
      {
        id: "execute",
        label: "Execute with receipt anchor",
        done: false,
        artifact: "chain",
      },
      {
        id: "memory",
        label: "Governance memory",
        done: false,
        artifact: "offchain",
      },
    ];
  }
  const doneDraft = true;
  const doneAgents = p.status !== "draft";
  const donePublish = p.proposalReceiptId != null || p.status !== "draft";
  const doneVote = p.voteYes + p.voteNo + p.voteAbstain + p.voteVeto > 0;
  const doneQuorum = p.quorumReached >= p.quorumRequired;
  const doneFinalize =
    p.status === "approved" ||
    p.status === "rejected" ||
    p.status === "executed";
  const doneExec = p.status === "executed";
  return [
    {
      id: "draft",
      label: "Proposal drafted",
      done: doneDraft,
      artifact: "offchain",
    },
    {
      id: "agents",
      label: "Agent council review",
      done: doneAgents,
      artifact: "offchain",
    },
    {
      id: "publish",
      label: "Published + proposal receipt",
      done: donePublish,
      artifact: "receipt",
    },
    { id: "vote", label: "Votes cast", done: doneVote, artifact: "chain" },
    {
      id: "quorum",
      label: "Quorum vs threshold",
      done: doneQuorum,
      artifact: "chain",
    },
    {
      id: "finalize",
      label: "Finalize proposal",
      done: doneFinalize,
      artifact: "receipt",
    },
    {
      id: "execute",
      label: "Execution receipt on Solana",
      done: doneExec,
      artifact: "chain",
    },
    {
      id: "memory",
      label: "Governance memory",
      done: doneExec,
      artifact: "offchain",
    },
  ];
}

export function mergeDemoWithLive(
  demo: Omit<DaoCommandCenterPayload, "explorerBaseUrl">,
  live: DaoCommandCenterPayload,
): DaoCommandCenterPayload {
  const proposalIds = new Set(demo.proposals.map((p) => p.id));
  const mergedProposals = [
    ...demo.proposals,
    ...live.proposals.filter((p) => !proposalIds.has(p.id)),
  ];
  return {
    ...demo,
    explorerBaseUrl: live.explorerBaseUrl,
    proposals: mergedProposals,
    members:
      demo.members.length >= live.members.length ? demo.members : live.members,
    votes: [...demo.votes, ...live.votes],
    delegations: [...demo.delegations, ...live.delegations],
    governanceMemory: [...demo.governanceMemory, ...live.governanceMemory],
    executionReceipts: [...demo.executionReceipts, ...live.executionReceipts],
    walletAddress: live.walletAddress,
    member: live.member,
    effectiveVoteWeight: live.effectiveVoteWeight,
    delegationsIncoming: live.delegationsIncoming.length
      ? live.delegationsIncoming
      : demo.delegationsIncoming,
    delegationsOutgoing: live.delegationsOutgoing.length
      ? live.delegationsOutgoing
      : demo.delegationsOutgoing,
    degradedReasons: [...demo.degradedReasons, ...live.degradedReasons],
  };
}

export function treasurySnapshotFromConfig(
  cfg: DaoConfigRecord | undefined,
  cluster: SolanaCluster,
): DaoTreasurySnapshot | null {
  if (!cfg?.treasury) return null;
  return {
    id: `snap_${cfg.treasury.slice(0, 6)}`,
    walletAddress: cfg.treasury,
    cluster,
    totalBalanceLamports: "0",
    totalBalanceSol: lamportsToSolString(0),
    tokenBalances: [],
    lastUpdatedAt: new Date().toISOString(),
    status: "cached_only",
  };
}

export function explorerLinkForAddress(
  address: string,
  cluster: SolanaCluster,
): string {
  return buildExplorerAddressUrl(address, cluster);
}

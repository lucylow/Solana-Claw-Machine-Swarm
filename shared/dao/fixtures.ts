import type { SolanaCluster } from "../solana/types";
import type {
  DaoAgentRecommendation,
  DaoCommandCenterPayload,
  DaoDelegation,
  DaoExecutionReceipt,
  DaoGovernanceMemoryRecord,
  DaoMember,
  DaoProposal,
  DaoTimelineStage,
  DaoTreasurySnapshot,
  DaoVote,
} from "./types";

const CLUSTER: SolanaCluster = "devnet";
const PROGRAM = "ClAwDAo111111111111111111111111111111111111";

function m(
  wallet: string,
  role: DaoMember["role"],
  weight: number,
  rep: number,
  label: string,
): DaoMember {
  return {
    id: `mem_${wallet.slice(0, 8)}`,
    walletAddress: wallet,
    displayName: label,
    role,
    weight,
    delegatedWeight: 0,
    reputationScore: rep,
    joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    verified: true,
    permissions: {
      canVote: true,
      canDelegate: true,
      canPropose: role !== "agent",
      canExecute:
        role === "treasurer" || role === "admin" || role === "council",
      canViewTreasury: true,
      canReviewProposals:
        role === "council" || role === "moderator" || role === "admin",
    },
    metadata: { demo: true },
  };
}

export function buildDaoDemoFixtures(
  now = Date.now(),
): Omit<DaoCommandCenterPayload, "explorerBaseUrl" | "walletAddress"> {
  const w1 = "CLAWGov111111111111111111111111111111111111";
  const w2 = "CLAWDel222222222222222222222222222222222222";
  const w3 = "CLAWMem333333333333333333333333333333333333";
  const w4 = "CLAWTre444444444444444444444444444444444444";

  const members: DaoMember[] = [
    m(w1, "council", 4200, 88, "Council · Atlas"),
    m(w2, "delegate", 3100, 76, "Delegate · River"),
    m(w3, "member", 1800, 62, "Member · Mina"),
    m(w4, "treasurer", 2600, 91, "Treasurer · Sol"),
  ];

  const delegations: DaoDelegation[] = [
    {
      id: "del_demo_1",
      fromWallet: w3,
      toWallet: w2,
      weight: 1800,
      reason: "Travel window — delegate votes for two epochs.",
      createdAt: new Date(now - 86400000 * 2).toISOString(),
      status: "active",
      proofReceiptId: "rcpt_del_demo_1",
      pda: "DaoDelPDA11111111111111111111111111111111",
    },
  ];

  const proposals: DaoProposal[] = [
    {
      id: "prop_demo_treasury",
      title: "Treasury allocation — agent safety buffer",
      summary:
        "Allocate 12 SOL to a claw-agent incident buffer with dual-sig treasurer release.",
      fullDescription: undefined,
      proposalType: "treasury_allocation",
      status: "voting",
      createdAt: new Date(now - 3600000 * 5).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString(),
      authorWallet: w1,
      creatorAgentId: "agent_drafter_1",
      policyLevel: "high",
      quorumRequired: 4000,
      quorumReached: 3200,
      thresholdRequired: 0.55,
      voteYes: 7100,
      voteNo: 2100,
      voteAbstain: 400,
      voteVeto: 0,
      totalVotingPower: 11700,
      executionReady: false,
      proposalReceiptId: "rcpt_prop_treasury",
      proofStatus: "demo_only",
      onchain: {
        pda: "DaoPropPDA22222222222222222222222222222222",
        programId: PROGRAM,
        cluster: CLUSTER,
        txSignature:
          "5demoTreasuryProposalSigBase58Encoded111111111111111111111111111111111111111111111111111111111",
      },
      offchain: {
        storageRef: "zerog://dao/discussion/prop_demo_treasury",
        discussionThreadId: "thread_demo_treasury",
        checksum: "sha256:demo_checksum_treasury",
      },
      treasuryImpact: {
        amount: 12_000_000_000,
        destination: w4,
        budgetCategory: "safety_buffer",
      },
      metadata: { demo: true, stage: "live_vote" },
    },
    {
      id: "prop_demo_skill",
      title: "Skill listing — Claw Planner v3",
      summary:
        "List the planner skill with elevated policy checks for treasury-touching plans.",
      proposalType: "skill_listing",
      status: "review",
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 3600000 * 8).toISOString(),
      authorWallet: w2,
      policyLevel: "medium",
      quorumRequired: 4000,
      quorumReached: 0,
      thresholdRequired: 0.5,
      voteYes: 0,
      voteNo: 0,
      voteAbstain: 0,
      voteVeto: 0,
      totalVotingPower: 11700,
      executionReady: false,
      proofStatus: "demo_only",
      onchain: { cluster: CLUSTER, programId: PROGRAM },
      offchain: { storageRef: "zerog://dao/draft/prop_demo_skill" },
      metadata: { demo: true },
    },
    {
      id: "prop_demo_failed_quorum",
      title: "Parameter change — discovery ranking weight",
      summary: "Tune discovery rank curve; failed quorum in demo epoch.",
      proposalType: "parameter_change",
      status: "rejected",
      createdAt: new Date(now - 86400000 * 4).toISOString(),
      updatedAt: new Date(now - 86400000 * 3).toISOString(),
      authorWallet: w3,
      policyLevel: "low",
      quorumRequired: 4000,
      quorumReached: 2100,
      thresholdRequired: 0.5,
      voteYes: 4000,
      voteNo: 1000,
      voteAbstain: 200,
      voteVeto: 0,
      totalVotingPower: 11700,
      executionReady: false,
      proofStatus: "demo_only",
      onchain: { cluster: CLUSTER },
      metadata: { demo: true, failure: "quorum_not_reached" },
    },
    {
      id: "prop_demo_executed",
      title: "Grant — open-source claw UI components",
      summary: "Approved grant with anchored execution receipt on devnet.",
      proposalType: "grant",
      status: "executed",
      createdAt: new Date(now - 86400000 * 10).toISOString(),
      updatedAt: new Date(now - 86400000 * 9).toISOString(),
      authorWallet: w4,
      policyLevel: "medium",
      quorumRequired: 4000,
      quorumReached: 6100,
      thresholdRequired: 0.5,
      voteYes: 8200,
      voteNo: 900,
      voteAbstain: 300,
      voteVeto: 100,
      totalVotingPower: 11700,
      executionReady: true,
      executionTxSignature:
        "5demoExecGrantSigBase58Encoded222222222222222222222222222222222222222222222222222222222",
      executionReceiptId: "rcpt_exec_grant",
      proposalReceiptId: "rcpt_prop_grant",
      proofStatus: "demo_only",
      onchain: {
        cluster: CLUSTER,
        programId: PROGRAM,
        txSignature:
          "5demoExecGrantSigBase58Encoded222222222222222222222222222222222222222222222222222222222",
        pda: "DaoPropPDAexec333333333333333333333333333333",
      },
      treasuryImpact: {
        amount: 4_000_000_000,
        budgetCategory: "ecosystem_grant",
      },
      metadata: { demo: true },
    },
  ];

  const votes: DaoVote[] = [
    {
      id: "vote_1",
      proposalId: "prop_demo_treasury",
      voterWallet: w1,
      choice: "yes",
      weight: 4200,
      createdAt: new Date(now - 1800000).toISOString(),
      status: "demo_only",
      proofReceiptId: "rcpt_vote_1",
      metadata: { demo: true },
    },
    {
      id: "vote_2",
      proposalId: "prop_demo_treasury",
      voterWallet: w2,
      choice: "yes",
      weight: 3100,
      reason: "Buffer aligns with claw incident playbook.",
      createdAt: new Date(now - 1700000).toISOString(),
      status: "demo_only",
      metadata: { demo: true },
    },
  ];

  const treasury: DaoTreasurySnapshot = {
    id: "snap_demo_1",
    walletAddress: w4,
    cluster: CLUSTER,
    totalBalanceLamports: "84200000000",
    totalBalanceSol: "84.2000",
    tokenBalances: [
      {
        mint: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        balance: "84.2",
      },
      {
        mint: "USDCxaQ111111111111111111111111111111111111",
        symbol: "USDC",
        balance: "125000",
        valueUsd: 125000,
      },
    ],
    lastUpdatedAt: new Date(now - 600000).toISOString(),
    proofReceiptId: "rcpt_treasury_snap",
    pda: "DaoTreasuryPDA44444444444444444444444444444444",
    status: "demo_only",
  };

  const executionReceipts: DaoExecutionReceipt[] = [
    {
      id: "rcpt_exec_grant",
      proposalId: "prop_demo_executed",
      walletAddress: w4,
      cluster: CLUSTER,
      txSignature:
        "5demoExecGrantSigBase58Encoded222222222222222222222222222222222222222222222222222222222",
      title: "Grant transfer executed",
      summary: "4 SOL routed to grant multisig; memo hash anchored.",
      status: "demo_only",
      proofStatus: "demo_only",
      createdAt: new Date(now - 86400000 * 9).toISOString(),
      explorerUrl: `https://explorer.solana.com/tx/5demoExecGrantSigBase58Encoded222222222222222222222222222222222222222222222222222222222?cluster=${CLUSTER}`,
      storageRef: "zerog://dao/exec/prop_demo_executed",
      metadata: { demo: true },
    },
  ];

  const agentRecommendations: DaoAgentRecommendation[] = [
    {
      id: "ar_treasury_risk",
      proposalId: "prop_demo_treasury",
      agentId: "agent_risk",
      agentName: "Risk Analyst",
      role: "risk_analyst",
      summary:
        "Treasury draw is within spend limit but concentrates authority on treasurer path.",
      recommendation:
        "Approve with dual-sig enforcement and 24h timelock in execution coordinator steps.",
      confidence: 0.82,
      risks: [
        "Single treasurer path if multisig misconfigured",
        "Buffer underfunded for multi-incident week",
      ],
      supportingEvidence: ["spend_limit_lamports_ok", "policy_high_treasury"],
      createdAt: new Date(now - 3400000).toISOString(),
      status: "demo_only",
      humanDisposition: "modified",
    },
    {
      id: "ar_treasury_policy",
      proposalId: "prop_demo_treasury",
      agentId: "agent_policy",
      agentName: "Policy Reviewer",
      role: "policy_reviewer",
      summary: "Proposal satisfies quorum and policy level high review.",
      recommendation:
        "Require council co-sign for allocations >10 SOL equivalent.",
      confidence: 0.77,
      risks: ["Threshold drift if parameters change mid-vote"],
      supportingEvidence: ["quorum_config_snapshot"],
      createdAt: new Date(now - 3300000).toISOString(),
      status: "demo_only",
      humanDisposition: "accepted",
    },
    {
      id: "ar_treasury_treasury",
      proposalId: "prop_demo_treasury",
      agentId: "agent_treasury",
      agentName: "Treasury Analyst",
      role: "treasury_analyst",
      summary:
        "Post-transfer liquidity remains above 60 SOL liquid policy band.",
      recommendation:
        "Safe to proceed; schedule follow-on snapshot after execution.",
      confidence: 0.74,
      risks: ["Token price volatility not modeled in demo"],
      supportingEvidence: ["snapshot_snap_demo_1"],
      createdAt: new Date(now - 3200000).toISOString(),
      status: "demo_only",
      humanDisposition: "pending",
    },
  ];

  const governanceMemory: DaoGovernanceMemoryRecord[] = [
    {
      id: "mem_demo_1",
      proposalId: "prop_demo_executed",
      title: "Grant executions anchor well with dual receipts",
      lesson:
        "Keep execution coordinator memo hash + treasury snapshot hash paired for explorer audits.",
      outcome: "executed",
      createdAt: new Date(now - 86400000 * 8).toISOString(),
      linkedReceiptIds: ["rcpt_exec_grant", "rcpt_prop_grant"],
      storageRef: "zerog://dao/memory/mem_demo_1",
      precedentProposalIds: ["prop_demo_executed"],
      metadata: { demo: true },
    },
    {
      id: "mem_demo_2",
      proposalId: "prop_demo_failed_quorum",
      title: "Ranking parameter changes need earlier delegate activation",
      lesson:
        "Failed quorum when delegates travel; surface push notifications to delegators.",
      outcome: "rejected",
      createdAt: new Date(now - 86400000 * 3).toISOString(),
      linkedReceiptIds: [],
      metadata: { demo: true },
    },
  ];

  const timeline: DaoTimelineStage[] = [
    {
      id: "draft",
      label: "Proposal drafted",
      at: new Date(now - 3600000 * 6).toISOString(),
      done: true,
      artifact: "offchain",
    },
    {
      id: "agents",
      label: "Agent council review",
      at: new Date(now - 3600000 * 5).toISOString(),
      done: true,
      artifact: "offchain",
    },
    {
      id: "publish",
      label: "Published to members",
      at: new Date(now - 3600000 * 4).toISOString(),
      done: true,
      artifact: "receipt",
    },
    {
      id: "vote",
      label: "Voting open",
      at: new Date(now - 3600000 * 3).toISOString(),
      done: true,
      artifact: "chain",
    },
    { id: "quorum", label: "Quorum progress", done: false, artifact: "chain" },
    {
      id: "finalize",
      label: "Finalize proposal",
      done: false,
      artifact: "receipt",
    },
    {
      id: "execute",
      label: "Execute on Solana",
      done: false,
      artifact: "chain",
    },
    {
      id: "memory",
      label: "Write governance memory",
      done: false,
      artifact: "offchain",
    },
  ];

  return {
    cluster: CLUSTER,
    programId: PROGRAM,
    demoMode: true,
    member: null,
    effectiveVoteWeight: 0,
    delegationsIncoming: delegations.filter((d) => d.toWallet === w2),
    delegationsOutgoing: [],
    configSummary: {
      name: "CLAW Governance (demo)",
      quorumBps: 4000,
      thresholdBps: 5000,
      paused: false,
      minStakeLamports: 1_000_000,
      spendLimitLamports: 5_000_000_000,
    },
    proposals,
    members,
    delegations,
    votes,
    treasury,
    executionReceipts,
    agentRecommendations,
    governanceMemory,
    activeProposalId: "prop_demo_treasury",
    timeline,
    degradedReasons: [],
  };
}

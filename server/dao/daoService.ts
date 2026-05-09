import crypto from "crypto";
import { nanoid } from "nanoid";
import { buildDaoDemoFixtures } from "@shared/dao/fixtures";
import { buildExplorerTxUrl } from "../solana/explorer";
import { getServerSolanaCluster } from "../solana/config";
import type {
  DaoDiscoveryRecord,
  DaoMemberRecord,
  DaoProposalKind,
  DaoProposalRecord,
  DaoVoteChoice,
} from "./daoTypes";
import { DaoStore } from "./daoStore";
import {
  buildLiveCommandCenter,
  defaultAgentCouncilForProposal,
  mergeDemoWithLive,
} from "./governanceMapper";

function rankScore(proposal: DaoProposalRecord) {
  const veto = proposal.vetoVotes ?? 0;
  const total =
    proposal.yesVotes + proposal.noVotes + proposal.abstainVotes + veto;
  const participation =
    total > 0 ? Math.floor((proposal.totalVotes / (total + 1)) * 10000) : 0;
  const denom = proposal.yesVotes + proposal.noVotes + veto;
  const approval =
    denom > 0 ? Math.floor((proposal.yesVotes / (denom + 1)) * 10000) : 0;
  return Math.min(
    10000,
    Math.floor(
      proposal.quorumBps / 2 +
        proposal.approvalThresholdBps / 2 +
        participation / 2 +
        approval / 2,
    ),
  );
}

export class DaoService {
  constructor(private readonly store: DaoStore) {}

  async bootstrap() {
    if (!this.store.getConfig()) {
      await this.store.setConfig({
        name: "CLAW DAO",
        symbol: "CLAW",
        uri: "https://claw.machine",
        chainId: 101,
        paused: false,
        quorumBps: 4000,
        proposalThresholdBps: 5000,
        voteDurationSlots: 20,
        minStakeLamports: 1_000_000,
        spendLimitLamports: 5_000_000_000,
        treasury: "DAO_TREASURY",
        totalMembers: 0,
        totalProposals: 0,
        totalVotes: 0,
        totalExecuted: 0,
        totalTreasurySpend: 0,
      });
    }
    await this.ensureTreasurySnapshot();
  }

  private async ensureTreasurySnapshot() {
    const cfg = this.store.getConfig();
    if (!cfg?.treasury) return;
    const existing = this.store.listTreasurySnapshots();
    if (existing.length) return;
    await this.store.upsertTreasurySnapshot({
      id: `snap_${nanoid()}`,
      walletAddress: cfg.treasury,
      totalBalanceLamports: "0",
      totalBalanceSol: "0.0000",
      tokenBalances: [],
      lastUpdatedAt: new Date().toISOString(),
      status: "cached_only",
    });
  }

  getConfig() {
    const cfg = this.store.getConfig();
    if (!cfg) return null;
    const members = this.store.listMembers();
    const proposals = this.store.listProposals();
    return {
      ...cfg,
      spendLimitLamports: cfg.spendLimitLamports ?? 0,
      totalMembers: members.length,
      totalProposals: proposals.length,
      totalVotes: proposals.reduce((acc, p) => acc + p.voterCount, 0),
      totalExecuted: proposals.filter((p) => p.status === "executed").length,
      totalTreasurySpend: cfg.totalTreasurySpend ?? 0,
    };
  }

  effectiveVotingPower(wallet: string): number {
    const member = this.store.getMember(wallet);
    if (!member || !member.active) return 0;
    const delegations = this.store.listDelegations();
    if (
      delegations.some((d) => d.fromWallet === wallet && d.status === "active")
    )
      return 0;
    const base = member.votingPower;
    const delegatedIn = delegations
      .filter((d) => d.toWallet === wallet && d.status === "active")
      .reduce((acc, d) => acc + d.weight, 0);
    return base + delegatedIn;
  }

  buildCommandCenterPayload(opts: { walletAddress?: string; demo?: boolean }) {
    const cluster = getServerSolanaCluster();
    const wallet = opts.walletAddress?.trim();
    const eff = wallet ? this.effectiveVotingPower(wallet) : 0;
    const live = buildLiveCommandCenter({
      cfg: this.store.getConfig(),
      members: this.store.listMembers(),
      proposals: this.store.listProposals(),
      delegations: this.store.listDelegations(),
      voteLedger: this.store.listVoteLedger(),
      agentRecs: this.store.listAgentRecommendations(),
      memories: this.store.listGovernanceMemory(),
      execReceipts: this.store.listExecutionReceipts(),
      treasurySnaps: this.store.listTreasurySnapshots(),
      cluster,
      walletAddress: wallet,
      effectiveWeight: eff,
    });

    if (opts.demo) {
      const demoFixtures = buildDaoDemoFixtures();
      return mergeDemoWithLive(demoFixtures, live);
    }
    return live;
  }

  async registerMember(
    wallet: string,
    delegate: string,
    stakeLamports: number,
    reputationPoints: number,
  ) {
    const cfg = this.store.getConfig();
    if (!cfg) throw new Error("dao_not_bootstrapped");
    if (stakeLamports < cfg.minStakeLamports)
      throw new Error("stake_below_min");

    const now = Date.now();
    const member: DaoMemberRecord = {
      wallet,
      delegate,
      stakeLamports,
      votingPower: stakeLamports + reputationPoints * 10,
      reputationPoints,
      active: true,
      joinedAt: now,
      updatedAt: now,
    };
    await this.store.upsertMember(member);
    return member;
  }

  async updateMember(wallet: string, patch: Partial<DaoMemberRecord>) {
    const current = this.store.getMember(wallet);
    if (!current) throw new Error("member_not_found");
    const stake = patch.stakeLamports ?? current.stakeLamports;
    const rep = patch.reputationPoints ?? current.reputationPoints;
    const next = {
      ...current,
      ...patch,
      votingPower: stake + rep * 10,
      updatedAt: Date.now(),
    };
    return this.store.upsertMember(next);
  }

  async delegateVotePower(
    fromWallet: string,
    toWallet: string,
    reason?: string,
  ) {
    const from = this.store.getMember(fromWallet);
    const to = this.store.getMember(toWallet);
    if (!from || !to) throw new Error("member_not_found");
    if (!from.active || !to.active) throw new Error("member_inactive");
    if (fromWallet === toWallet) throw new Error("delegate_self_invalid");
    const weight = from.votingPower;
    await this.store.appendDelegation({
      id: `del_${nanoid()}`,
      fromWallet,
      toWallet,
      weight,
      reason,
      createdAt: Date.now(),
      status: "active",
      proofReceiptId: `rcpt_del_${nanoid()}`,
    });
    return this.store
      .listDelegations()
      .find((d) => d.fromWallet === fromWallet && d.status === "active");
  }

  async revokeDelegate(fromWallet: string) {
    await this.store.revokeDelegation(fromWallet);
  }

  async createProposal(input: {
    proposalId: number;
    proposer: string;
    title: string;
    description: string;
    kind: DaoProposalKind;
    skillKey: string;
    recipient: string;
    amountLamports: number;
    startSlot: number;
    endSlot: number;
    quorumBps: number;
    approvalThresholdBps: number;
  }) {
    const now = Date.now();
    const proposalReceiptId = `rcpt_prop_${nanoid()}`;
    const proposal: DaoProposalRecord = {
      proposalId: input.proposalId,
      proposer: input.proposer,
      kind: input.kind,
      status: "active",
      title: input.title,
      description: input.description,
      skillKey: input.skillKey,
      recipient: input.recipient,
      amountLamports: input.amountLamports,
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0,
      vetoVotes: 0,
      totalVotes: 0,
      voterCount: 0,
      startSlot: input.startSlot,
      endSlot: input.endSlot,
      quorumBps: input.quorumBps,
      approvalThresholdBps: input.approvalThresholdBps,
      executionHash: "",
      resultHash: "",
      createdAt: now,
      updatedAt: now,
      executedAt: 0,
      proposalReceiptId,
      proofStatus: "pending",
      offchainStorageRef: `mem://dao/desc/${input.proposalId}`,
      discussionThreadId: `thread_${input.proposalId}`,
    };

    await this.store.upsertProposal(proposal);
    const agents = defaultAgentCouncilForProposal(input.proposalId);
    await this.store.appendAgentRecommendations(agents);
    return proposal;
  }

  async castVote(
    proposalId: number,
    wallet: string,
    choice: DaoVoteChoice,
    reason: string,
  ) {
    const proposal = this.store.getProposal(proposalId);
    const member = this.store.getMember(wallet);
    if (!proposal) throw new Error("proposal_not_found");
    if (!member) throw new Error("member_not_found");
    if (proposal.status !== "active") throw new Error("proposal_not_active");

    const prior = this.store
      .listVoteLedger(proposalId)
      .some((v) => v.voterWallet === wallet);
    if (prior) throw new Error("already_voted");

    const weight = this.effectiveVotingPower(wallet);
    if (weight <= 0) throw new Error("insufficient_voting_power");

    const next = { ...proposal, vetoVotes: proposal.vetoVotes ?? 0 };
    if (choice === "yes") next.yesVotes += weight;
    if (choice === "no") next.noVotes += weight;
    if (choice === "abstain") next.abstainVotes += weight;
    if (choice === "veto") next.vetoVotes += weight;
    next.totalVotes += weight;
    next.voterCount += 1;
    next.updatedAt = Date.now();

    await this.store.upsertProposal(next);
    await this.store.appendVoteLedger({
      id: `vote_${nanoid()}`,
      proposalId,
      voterWallet: wallet,
      choice,
      weight,
      reason,
      createdAt: Date.now(),
      proofReceiptId: `rcpt_vote_${nanoid()}`,
    });

    return {
      proposal: next,
      vote: {
        voter: wallet,
        delegate: member.delegate,
        choice,
        weight,
        reason,
        createdAt: Date.now(),
      },
    };
  }

  async finalizeProposal(proposalId: number) {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error("proposal_not_found");

    const cfg = this.store.getConfig();
    if (!cfg) throw new Error("dao_not_bootstrapped");

    const members = this.store.listMembers().filter((m) => m.active).length;
    const participationBps =
      members > 0 ? Math.floor((proposal.voterCount / members) * 10000) : 0;
    const veto = proposal.vetoVotes ?? 0;
    const approvalDenom = proposal.yesVotes + proposal.noVotes + veto;
    const approvalBps =
      approvalDenom > 0
        ? Math.floor((proposal.yesVotes / approvalDenom) * 10000)
        : 0;

    const passed =
      participationBps >= cfg.quorumBps &&
      approvalBps >= cfg.proposalThresholdBps;
    const next = {
      ...proposal,
      status: passed ? ("succeeded" as const) : ("defeated" as const),
      updatedAt: Date.now(),
    };

    await this.store.upsertProposal(next);

    const row: DaoDiscoveryRecord = {
      proposalId: next.proposalId,
      kind: next.kind,
      title: next.title,
      status: next.status,
      yesVotes: next.yesVotes,
      noVotes: next.noVotes,
      abstainVotes: next.abstainVotes,
      totalVotes: next.totalVotes,
      rankScoreBps: rankScore(next),
      updatedAt: Date.now(),
    };
    await this.store.upsertDiscovery(row);

    if (!passed) {
      await this.store.appendGovernanceMemory({
        id: `gmem_${nanoid()}`,
        proposalId: next.proposalId,
        title: `Lesson: proposal ${next.proposalId} did not pass`,
        lesson: `Quorum ${participationBps} bps vs required ${cfg.quorumBps} bps; approval ${approvalBps} bps vs ${cfg.proposalThresholdBps} bps.`,
        outcome: "rejected",
        createdAt: Date.now(),
        linkedReceiptIds: next.proposalReceiptId
          ? [next.proposalReceiptId]
          : [],
        storageRef: `mem://dao/governance/${next.proposalId}`,
      });
    }

    return { proposal: next, passed, discovery: row };
  }

  async executeProposal(proposalId: number) {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error("proposal_not_found");
    if (proposal.status !== "succeeded") throw new Error("proposal_not_passed");
    if (proposal.executedAt) throw new Error("already_executed");

    const cluster = getServerSolanaCluster();
    const txSig = `sim_${crypto.randomBytes(18).toString("base64url")}`;

    const receiptId = `rcpt_exec_${nanoid()}`;
    await this.store.appendExecutionReceipt({
      id: receiptId,
      proposalId,
      walletAddress: proposal.proposer,
      txSignature: txSig,
      title: `Execution receipt · ${proposal.title}`,
      summary:
        "Compact execution proof queued for Solana — relayer submits instruction; explorer link becomes final after confirmation.",
      status: "submitted",
      proofStatus: "pending",
      createdAt: Date.now(),
      explorerUrl: buildExplorerTxUrl(txSig, cluster),
    });

    const next = {
      ...proposal,
      status: "executed" as const,
      executedAt: Date.now(),
      updatedAt: Date.now(),
      executionTxSignature: txSig,
      executionReceiptId: receiptId,
      proofStatus: "pending",
      resultHash: crypto
        .createHash("sha256")
        .update(`${proposal.kind}:${proposal.proposalId}:${proposal.title}`)
        .digest("hex"),
    };

    await this.store.upsertProposal(next);

    const cfg = this.store.getConfig();
    if (
      cfg &&
      proposal.kind === "treasury_spend" &&
      proposal.amountLamports > 0
    ) {
      await this.store.patchConfig({
        totalTreasurySpend: cfg.totalTreasurySpend + proposal.amountLamports,
      });
    }

    await this.store.appendGovernanceMemory({
      id: `gmem_${nanoid()}`,
      proposalId: next.proposalId,
      title: `Precedent: ${proposal.title}`,
      lesson:
        "Successful execution — anchor execution receipt and refresh treasury snapshot for the next cycle.",
      outcome: "executed",
      createdAt: Date.now(),
      linkedReceiptIds: [receiptId, proposal.proposalReceiptId].filter(
        Boolean,
      ) as string[],
      storageRef: `mem://dao/governance/ok/${next.proposalId}`,
    });

    return next;
  }

  listProposals() {
    return this.store.listProposals();
  }

  listDiscovery() {
    return this.store.listDiscovery();
  }

  listMembers() {
    return this.store.listMembers();
  }

  listDelegations() {
    return this.store.listDelegations();
  }

  listVoteLedger(proposalId?: number) {
    return this.store.listVoteLedger(proposalId);
  }

  getProposal(proposalId: number) {
    return this.store.getProposal(proposalId);
  }

  getMember(wallet: string) {
    return this.store.getMember(wallet);
  }
}

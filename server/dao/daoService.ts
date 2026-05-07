import crypto from "crypto";
import type {
  DaoDiscoveryRecord,
  DaoMemberRecord,
  DaoProposalKind,
  DaoProposalRecord,
  DaoVoteChoice,
} from "./daoTypes";
import { DaoStore } from "./daoStore";

function rankScore(proposal: DaoProposalRecord) {
  const total = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const participation =
    total > 0 ? Math.floor((proposal.totalVotes / (total + 1)) * 10000) : 0;
  const approval =
    proposal.yesVotes + proposal.noVotes > 0
      ? Math.floor((proposal.yesVotes / (proposal.yesVotes + proposal.noVotes + 1)) * 10000)
      : 0;
  return Math.min(
    10000,
    Math.floor(
      proposal.quorumBps / 2 +
        proposal.approvalThresholdBps / 2 +
        participation / 2 +
        approval / 2
    )
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
      totalExecuted: proposals.filter(p => p.status === "executed").length,
      totalTreasurySpend: cfg.totalTreasurySpend ?? 0,
    };
  }

  async registerMember(
    wallet: string,
    delegate: string,
    stakeLamports: number,
    reputationPoints: number
  ) {
    const cfg = this.store.getConfig();
    if (!cfg) throw new Error("dao_not_bootstrapped");
    if (stakeLamports < cfg.minStakeLamports) throw new Error("stake_below_min");

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
    };

    await this.store.upsertProposal(proposal);
    return proposal;
  }

  async castVote(proposalId: number, wallet: string, choice: DaoVoteChoice, reason: string) {
    const proposal = this.store.getProposal(proposalId);
    const member = this.store.getMember(wallet);
    if (!proposal) throw new Error("proposal_not_found");
    if (!member) throw new Error("member_not_found");
    if (proposal.status !== "active") throw new Error("proposal_not_active");

    const weight = member.votingPower;
    const next = { ...proposal };
    if (choice === "yes") next.yesVotes += weight;
    if (choice === "no") next.noVotes += weight;
    if (choice === "abstain") next.abstainVotes += weight;
    next.totalVotes += weight;
    next.voterCount += 1;
    next.updatedAt = Date.now();

    await this.store.upsertProposal(next);
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

    const members = this.store.listMembers().length;
    const participationBps =
      members > 0 ? Math.floor((proposal.voterCount / members) * 10000) : 0;
    const approvalBps =
      proposal.yesVotes + proposal.noVotes > 0
        ? Math.floor((proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 10000)
        : 0;

    const passed = participationBps >= cfg.quorumBps && approvalBps >= cfg.proposalThresholdBps;
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

    return { proposal: next, passed, discovery: row };
  }

  async executeProposal(proposalId: number) {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error("proposal_not_found");
    if (proposal.status !== "succeeded") throw new Error("proposal_not_passed");
    if (proposal.executedAt) throw new Error("already_executed");

    const next = {
      ...proposal,
      status: "executed" as const,
      executedAt: Date.now(),
      updatedAt: Date.now(),
      resultHash: crypto
        .createHash("sha256")
        .update(`${proposal.kind}:${proposal.proposalId}:${proposal.title}`)
        .digest("hex"),
    };

    await this.store.upsertProposal(next);

    const cfg = this.store.getConfig();
    if (cfg && proposal.kind === "treasury_spend" && proposal.amountLamports > 0) {
      await this.store.patchConfig({
        totalTreasurySpend: cfg.totalTreasurySpend + proposal.amountLamports,
      });
    }

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

  getProposal(proposalId: number) {
    return this.store.getProposal(proposalId);
  }

  getMember(wallet: string) {
    return this.store.getMember(wallet);
  }
}

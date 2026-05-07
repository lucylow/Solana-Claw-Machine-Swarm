import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { DaoProposalKind, DaoVoteChoice } from "./daoTypes";

/** Maps REST-style kinds to Anchor enum payloads (IDL camelCase variants). */
export function daoProposalKindForAnchor(kind: DaoProposalKind): Record<string, Record<string, never>> {
  const map: Record<DaoProposalKind, Record<string, Record<string, never>>> = {
    treasury_spend: { treasurySpend: {} },
    parameter_change: { parameterChange: {} },
    skill_approve: { skillApprove: {} },
    skill_version_approve: { skillVersionApprove: {} },
    dao_grant: { daoGrant: {} },
    text: { text: {} },
  };
  return map[kind];
}

export function daoVoteChoiceForAnchor(choice: DaoVoteChoice): Record<string, Record<string, never>> {
  const map: Record<DaoVoteChoice, Record<string, Record<string, never>>> = {
    yes: { yes: {} },
    no: { no: {} },
    abstain: { abstain: {} },
  };
  return map[choice];
}

/**
 * Thin Anchor wrapper for the `claw_dao` program. Pass the IDL from
 * `target/idl/claw_dao.json` after `anchor build`.
 */
export class ClawDaoClient {
  readonly program: anchor.Program;
  readonly programId: PublicKey;

  constructor(programId: string, idl: anchor.Idl, provider: anchor.AnchorProvider) {
    const idlWithAddress = { ...idl, address: programId } as anchor.Idl;
    this.program = new anchor.Program(idlWithAddress, provider);
    this.programId = this.program.programId;
  }

  deriveDaoPda() {
    return PublicKey.findProgramAddressSync([Buffer.from("dao-config")], this.programId);
  }

  deriveTreasuryPda() {
    return PublicKey.findProgramAddressSync([Buffer.from("dao-treasury")], this.programId);
  }

  deriveMemberPda(dao: PublicKey, wallet: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("dao-member"), dao.toBuffer(), wallet.toBuffer()],
      this.programId
    );
  }

  deriveProposalPda(dao: PublicKey, proposalId: number) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("dao-proposal"),
        dao.toBuffer(),
        new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8),
      ],
      this.programId
    );
  }

  deriveVotePda(proposal: PublicKey, voter: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("dao-vote"), proposal.toBuffer(), voter.toBuffer()],
      this.programId
    );
  }

  deriveDiscoveryPda(proposal: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("dao-discovery"), proposal.toBuffer()],
      this.programId
    );
  }

  deriveExecutionPda(proposal: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("dao-exec"), proposal.toBuffer()],
      this.programId
    );
  }

  async initializeDao(args: {
    authority: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    chainId: number;
    quorumBps: number;
    proposalThresholdBps: number;
    voteDurationSlots: number;
    minStakeLamports: number;
    spendLimitLamports: number;
  }) {
    const [dao] = this.deriveDaoPda();
    const [treasury] = this.deriveTreasuryPda();

    return this.program.methods
      .initializeDao(
        args.name,
        args.symbol,
        args.uri,
        new anchor.BN(args.chainId),
        args.quorumBps,
        args.proposalThresholdBps,
        new anchor.BN(args.voteDurationSlots),
        new anchor.BN(args.minStakeLamports),
        new anchor.BN(args.spendLimitLamports)
      )
      .accounts({
        dao,
        treasury,
        authority: args.authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async registerMember(args: {
    payer: PublicKey;
    delegate: PublicKey;
    stakeLamports: number;
    reputationPoints: number;
  }) {
    const [dao] = this.deriveDaoPda();
    const [member] = this.deriveMemberPda(dao, args.payer);

    return this.program.methods
      .registerMember(
        args.delegate,
        new anchor.BN(args.stakeLamports),
        new anchor.BN(args.reputationPoints)
      )
      .accounts({
        dao,
        member,
        payer: args.payer,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async updateMember(args: {
    wallet: PublicKey;
    delegate?: PublicKey | null;
    stakeLamports?: number | null;
    reputationPoints?: number | null;
    active?: boolean | null;
  }) {
    const [dao] = this.deriveDaoPda();
    const [member] = this.deriveMemberPda(dao, args.wallet);

    return this.program.methods
      .updateMember(
        args.delegate ?? null,
        args.stakeLamports == null ? null : new anchor.BN(args.stakeLamports),
        args.reputationPoints == null ? null : new anchor.BN(args.reputationPoints),
        args.active ?? null
      )
      .accounts({
        dao,
        member,
        wallet: args.wallet,
      })
      .rpc();
  }

  async createProposal(args: {
    proposer: PublicKey;
    proposalId: number;
    title: string;
    description: string;
    kind: DaoProposalKind;
    skillKey: string;
    recipient: PublicKey;
    amountLamports: number;
    targetProgram: PublicKey;
    targetAccount: PublicKey;
    voteDurationSlots: number;
  }) {
    const [dao] = this.deriveDaoPda();
    const [member] = this.deriveMemberPda(dao, args.proposer);
    const [proposal] = this.deriveProposalPda(dao, args.proposalId);

    return this.program.methods
      .createProposal(
        new anchor.BN(args.proposalId),
        args.title,
        args.description,
        daoProposalKindForAnchor(args.kind) as never,
        args.skillKey,
        args.recipient,
        new anchor.BN(args.amountLamports),
        args.targetProgram,
        args.targetAccount,
        new anchor.BN(args.voteDurationSlots)
      )
      .accounts({
        dao,
        member,
        proposal,
        proposer: args.proposer,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async castVote(args: {
    voter: PublicKey;
    proposalId: number;
    choice: DaoVoteChoice;
    reason: string;
  }) {
    const [dao] = this.deriveDaoPda();
    const [proposal] = this.deriveProposalPda(dao, args.proposalId);
    const [member] = this.deriveMemberPda(dao, args.voter);
    const [voteRecord] = this.deriveVotePda(proposal, args.voter);

    return this.program.methods
      .castVote(daoVoteChoiceForAnchor(args.choice) as never, args.reason)
      .accounts({
        dao,
        member,
        proposal,
        voteRecord,
        voter: args.voter,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async finalizeProposal(args: { proposalId: number }) {
    const [dao] = this.deriveDaoPda();
    const [proposal] = this.deriveProposalPda(dao, args.proposalId);

    return this.program.methods
      .finalizeProposal()
      .accounts({
        dao,
        proposal,
      })
      .rpc();
  }

  async executeProposal(args: { proposalId: number; executor: PublicKey }) {
    const [dao] = this.deriveDaoPda();
    const [proposal] = this.deriveProposalPda(dao, args.proposalId);
    const [executionRecord] = this.deriveExecutionPda(proposal);

    return this.program.methods
      .executeProposal()
      .accounts({
        dao,
        proposal,
        executionRecord,
        executor: args.executor,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async depositTreasury(args: { depositor: PublicKey; amountLamports: number }) {
    const [dao] = this.deriveDaoPda();
    const [treasury] = this.deriveTreasuryPda();

    return this.program.methods
      .depositTreasury(new anchor.BN(args.amountLamports))
      .accounts({
        dao,
        treasury,
        depositor: args.depositor,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async withdrawTreasury(args: {
    proposalId: number;
    executor: PublicKey;
    recipient: PublicKey;
  }) {
    const [dao] = this.deriveDaoPda();
    const [treasury] = this.deriveTreasuryPda();
    const [proposal] = this.deriveProposalPda(dao, args.proposalId);
    const [executionRecord] = this.deriveExecutionPda(proposal);

    return this.program.methods
      .withdrawTreasury()
      .accounts({
        dao,
        treasury,
        proposal,
        executionRecord,
        executor: args.executor,
        recipient: args.recipient,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async refreshDiscovery(args: { proposalId: number; authority: PublicKey }) {
    const [dao] = this.deriveDaoPda();
    const [proposal] = this.deriveProposalPda(dao, args.proposalId);
    const [discoveryRow] = this.deriveDiscoveryPda(proposal);

    return this.program.methods
      .refreshDiscovery()
      .accounts({
        dao,
        proposal,
        discoveryRow,
        authority: args.authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
}

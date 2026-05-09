import fs from "fs/promises";
import path from "path";
import type {
  DaoAgentRecommendationRecord,
  DaoConfigRecord,
  DaoDelegationRecord,
  DaoDiscoveryRecord,
  DaoExecutionReceiptPersist,
  DaoGovernanceMemoryPersist,
  DaoMemberRecord,
  DaoProposalRecord,
  DaoTreasurySnapshotPersist,
  DaoVoteLedgerRecord,
} from "./daoTypes";

type State = {
  config?: DaoConfigRecord;
  members: DaoMemberRecord[];
  proposals: DaoProposalRecord[];
  discovery: DaoDiscoveryRecord[];
  delegations: DaoDelegationRecord[];
  voteLedger: DaoVoteLedgerRecord[];
  agentRecommendations: DaoAgentRecommendationRecord[];
  governanceMemory: DaoGovernanceMemoryPersist[];
  executionReceipts: DaoExecutionReceiptPersist[];
  treasurySnapshots: DaoTreasurySnapshotPersist[];
};

const EMPTY: State = {
  members: [],
  proposals: [],
  discovery: [],
  delegations: [],
  voteLedger: [],
  agentRecommendations: [],
  governanceMemory: [],
  executionReceipts: [],
  treasurySnapshots: [],
};

function normalizeState(raw: Partial<State>): State {
  return {
    ...EMPTY,
    ...raw,
    members: raw.members ?? [],
    proposals: raw.proposals ?? [],
    discovery: raw.discovery ?? [],
    delegations: raw.delegations ?? [],
    voteLedger: raw.voteLedger ?? [],
    agentRecommendations: raw.agentRecommendations ?? [],
    governanceMemory: raw.governanceMemory ?? [],
    executionReceipts: raw.executionReceipts ?? [],
    treasurySnapshots: raw.treasurySnapshots ?? [],
  };
}

export class DaoStore {
  private state: State = structuredClone(EMPTY);

  constructor(private readonly filePath?: string) {}

  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.state = normalizeState(JSON.parse(raw) as Partial<State>);
    } catch {
      this.state = structuredClone(EMPTY);
    }
  }

  private async persist() {
    if (!this.filePath) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(
      this.filePath,
      JSON.stringify(this.state, null, 2),
      "utf8",
    );
  }

  async setConfig(config: DaoConfigRecord) {
    this.state.config = config;
    await this.persist();
    return config;
  }

  async patchConfig(patch: Partial<DaoConfigRecord>) {
    if (!this.state.config) return;
    this.state.config = { ...this.state.config, ...patch };
    await this.persist();
    return this.state.config;
  }

  getConfig() {
    return this.state.config;
  }

  async upsertMember(member: DaoMemberRecord) {
    const idx = this.state.members.findIndex((m) => m.wallet === member.wallet);
    if (idx >= 0) this.state.members[idx] = member;
    else this.state.members.unshift(member);
    await this.persist();
    return member;
  }

  async upsertProposal(proposal: DaoProposalRecord) {
    const idx = this.state.proposals.findIndex(
      (p) => p.proposalId === proposal.proposalId,
    );
    if (idx >= 0) this.state.proposals[idx] = proposal;
    else this.state.proposals.unshift(proposal);
    await this.persist();
    return proposal;
  }

  async upsertDiscovery(row: DaoDiscoveryRecord) {
    const idx = this.state.discovery.findIndex(
      (d) => d.proposalId === row.proposalId,
    );
    if (idx >= 0) this.state.discovery[idx] = row;
    else this.state.discovery.unshift(row);
    await this.persist();
    return row;
  }

  listMembers() {
    return [...this.state.members];
  }

  listProposals() {
    return [...this.state.proposals];
  }

  listDiscovery() {
    return [...this.state.discovery].sort(
      (a, b) => b.rankScoreBps - a.rankScoreBps,
    );
  }

  getMember(wallet: string) {
    return this.state.members.find((m) => m.wallet === wallet);
  }

  getProposal(proposalId: number) {
    return this.state.proposals.find((p) => p.proposalId === proposalId);
  }

  listDelegations() {
    return [...this.state.delegations];
  }

  async appendDelegation(row: DaoDelegationRecord) {
    const now = Date.now();
    this.state.delegations = this.state.delegations.map((d) => {
      if (d.fromWallet === row.fromWallet && d.status === "active") {
        return { ...d, status: "revoked" as const, revokedAt: now };
      }
      return d;
    });
    this.state.delegations.unshift(row);
    await this.persist();
    return row;
  }

  async revokeDelegation(fromWallet: string) {
    const now = Date.now();
    let changed = false;
    this.state.delegations = this.state.delegations.map((d) => {
      if (d.fromWallet === fromWallet && d.status === "active") {
        changed = true;
        return { ...d, status: "revoked" as const, revokedAt: now };
      }
      return d;
    });
    if (changed) await this.persist();
  }

  listVoteLedger(proposalId?: number) {
    const rows = [...this.state.voteLedger];
    if (proposalId === undefined) return rows;
    return rows.filter((v) => v.proposalId === proposalId);
  }

  async appendVoteLedger(row: DaoVoteLedgerRecord) {
    this.state.voteLedger.unshift(row);
    await this.persist();
    return row;
  }

  listAgentRecommendations(proposalId?: number) {
    const rows = [...this.state.agentRecommendations];
    if (proposalId === undefined) return rows;
    return rows.filter((a) => a.proposalId === proposalId);
  }

  async appendAgentRecommendations(rows: DaoAgentRecommendationRecord[]) {
    this.state.agentRecommendations = [
      ...rows,
      ...this.state.agentRecommendations,
    ];
    await this.persist();
  }

  listGovernanceMemory() {
    return [...this.state.governanceMemory];
  }

  async appendGovernanceMemory(row: DaoGovernanceMemoryPersist) {
    this.state.governanceMemory.unshift(row);
    await this.persist();
    return row;
  }

  listExecutionReceipts() {
    return [...this.state.executionReceipts];
  }

  async appendExecutionReceipt(row: DaoExecutionReceiptPersist) {
    this.state.executionReceipts.unshift(row);
    await this.persist();
    return row;
  }

  listTreasurySnapshots() {
    return [...this.state.treasurySnapshots];
  }

  async upsertTreasurySnapshot(row: DaoTreasurySnapshotPersist) {
    const idx = this.state.treasurySnapshots.findIndex((t) => t.id === row.id);
    if (idx >= 0) this.state.treasurySnapshots[idx] = row;
    else this.state.treasurySnapshots.unshift(row);
    await this.persist();
    return row;
  }
}

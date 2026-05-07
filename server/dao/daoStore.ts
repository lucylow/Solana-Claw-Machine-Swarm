import fs from "fs/promises";
import path from "path";
import type {
  DaoConfigRecord,
  DaoDiscoveryRecord,
  DaoMemberRecord,
  DaoProposalRecord,
} from "./daoTypes";

type State = {
  config?: DaoConfigRecord;
  members: DaoMemberRecord[];
  proposals: DaoProposalRecord[];
  discovery: DaoDiscoveryRecord[];
};

const EMPTY: State = { members: [], proposals: [], discovery: [] };

export class DaoStore {
  private state: State = structuredClone(EMPTY);

  constructor(private readonly filePath?: string) {}

  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw) as State;
    } catch {
      this.state = structuredClone(EMPTY);
    }
  }

  private async persist() {
    if (!this.filePath) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
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
    const idx = this.state.members.findIndex(m => m.wallet === member.wallet);
    if (idx >= 0) this.state.members[idx] = member;
    else this.state.members.unshift(member);
    await this.persist();
    return member;
  }

  async upsertProposal(proposal: DaoProposalRecord) {
    const idx = this.state.proposals.findIndex(p => p.proposalId === proposal.proposalId);
    if (idx >= 0) this.state.proposals[idx] = proposal;
    else this.state.proposals.unshift(proposal);
    await this.persist();
    return proposal;
  }

  async upsertDiscovery(row: DaoDiscoveryRecord) {
    const idx = this.state.discovery.findIndex(d => d.proposalId === row.proposalId);
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
    return [...this.state.discovery].sort((a, b) => b.rankScoreBps - a.rankScoreBps);
  }

  getMember(wallet: string) {
    return this.state.members.find(m => m.wallet === wallet);
  }

  getProposal(proposalId: number) {
    return this.state.proposals.find(p => p.proposalId === proposalId);
  }
}

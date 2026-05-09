import fs from "fs/promises";
import path from "path";

export type MirrorAccountKind =
  | "registry"
  | "skill"
  | "skill_version"
  | "plan_receipt"
  | "memory_receipt"
  | "proof_receipt"
  | "unknown";

export interface MirrorAccountRecord {
  address: string;
  kind: MirrorAccountKind;
  ownerWallet?: string;
  programId?: string;
  subjectId: string;
  status: "pending" | "confirmed" | "failed";
  action: string;
  payloadHash: string;
  txSignature?: string;
  explorerUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MirrorHistoryRecord {
  id: string;
  action: string;
  walletAddress: string;
  cluster: string;
  txSignature?: string;
  accountAddress: string;
  accountKind: MirrorAccountKind;
  programId?: string;
  payloadHash: string;
  status: "building" | "submitted" | "confirmed" | "indexed" | "failed";
  receiptId?: string;
  requestId?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

type IndexState = {
  accounts: Record<string, MirrorAccountRecord>;
  history: MirrorHistoryRecord[];
};

const EMPTY_STATE: IndexState = {
  accounts: {},
  history: [],
};

export class SolanaIndexerStore {
  private state: IndexState = structuredClone(EMPTY_STATE);

  constructor(private readonly filePath: string) {}

  async init() {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<IndexState>;
      this.state = {
        accounts: parsed.accounts || {},
        history: parsed.history || [],
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE);
    }
  }

  private async persist() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(
      this.filePath,
      JSON.stringify(this.state, null, 2),
      "utf8",
    );
  }

  async saveAccount(account: MirrorAccountRecord) {
    this.state.accounts[account.address] = account;
    await this.persist();
    return account;
  }

  async saveHistory(item: MirrorHistoryRecord) {
    this.state.history = this.state.history.filter(
      (existing) => existing.id !== item.id,
    );
    this.state.history.unshift(item);
    this.state.history = this.state.history.slice(0, 5_000);
    await this.persist();
    return item;
  }

  async listAccounts(filter?: {
    wallet?: string;
    kind?: MirrorAccountKind;
    status?: string;
  }) {
    let rows = Object.values(this.state.accounts).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    if (filter?.wallet)
      rows = rows.filter((row) => row.ownerWallet === filter.wallet);
    if (filter?.kind) rows = rows.filter((row) => row.kind === filter.kind);
    if (filter?.status)
      rows = rows.filter((row) => row.status === filter.status);
    return rows;
  }

  async getAccount(address: string) {
    return this.state.accounts[address];
  }

  async listHistory(filter?: {
    wallet?: string;
    account?: string;
    status?: MirrorHistoryRecord["status"];
    limit?: number;
  }) {
    let rows = [...this.state.history];
    if (filter?.wallet)
      rows = rows.filter((row) => row.walletAddress === filter.wallet);
    if (filter?.account)
      rows = rows.filter((row) => row.accountAddress === filter.account);
    if (filter?.status)
      rows = rows.filter((row) => row.status === filter.status);
    return rows.slice(0, filter?.limit || 250);
  }
}

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { ExecutionRecord, ReceiptRecord } from "@shared/domainModel";

export type SwarmMirrorSnapshot = {
  version: 1;
  selectedSkillByWallet: Record<string, { skillId: string; updatedAt: string }>;
  executions: ExecutionRecord[];
  receipts: ReceiptRecord[];
};

const emptySnapshot = (): SwarmMirrorSnapshot => ({
  version: 1,
  selectedSkillByWallet: {},
  executions: [],
  receipts: [],
});

export class SwarmMirrorStore {
  private data: SwarmMirrorSnapshot = emptySnapshot();
  private readonly filePath: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(filePath?: string) {
    this.filePath =
      filePath || path.join(process.cwd(), "data", "swarm-mirror.json");
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as SwarmMirrorSnapshot;
      if (parsed?.version === 1 && Array.isArray(parsed.executions)) {
        this.data = {
          ...emptySnapshot(),
          ...parsed,
          executions: parsed.executions,
          receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
          selectedSkillByWallet: parsed.selectedSkillByWallet || {},
        };
      }
    } catch {
      this.data = emptySnapshot();
      await this.persist();
    }
  }

  private persist() {
    this.writeChain = this.writeChain.then(() =>
      writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf8"),
    );
    return this.writeChain;
  }

  async setSelectedSkill(wallet: string, skillId: string) {
    this.data.selectedSkillByWallet[wallet] = {
      skillId,
      updatedAt: new Date().toISOString(),
    };
    await this.persist();
  }

  getSelectedSkill(wallet: string) {
    return this.data.selectedSkillByWallet[wallet]?.skillId ?? null;
  }

  async upsertExecution(record: ExecutionRecord) {
    const idx = this.data.executions.findIndex((e) => e.id === record.id);
    if (idx >= 0) this.data.executions[idx] = record;
    else this.data.executions.unshift(record);
    this.data.executions = this.data.executions.slice(0, 500);
    await this.persist();
  }

  getExecution(id: string) {
    return this.data.executions.find((e) => e.id === id) ?? null;
  }

  listExecutions(filter?: { wallet?: string; limit?: number }) {
    let rows = [...this.data.executions];
    if (filter?.wallet) rows = rows.filter((e) => e.wallet === filter.wallet);
    const limit = filter?.limit ?? 50;
    return rows.slice(0, limit);
  }

  async appendReceipt(record: ReceiptRecord) {
    this.data.receipts.unshift(record);
    this.data.receipts = this.data.receipts.slice(0, 2000);
    await this.persist();
  }

  listReceipts(filter?: { wallet?: string; limit?: number }) {
    let rows = [...this.data.receipts];
    if (filter?.wallet) rows = rows.filter((r) => r.wallet === filter.wallet);
    return rows.slice(0, filter?.limit ?? 100);
  }
}

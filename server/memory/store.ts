import fs from "fs/promises";
import path from "path";
import type {
  MemoryInjectionBundle,
  MemoryLifecycleEvent,
  MemoryReceiptOnChain,
  MemoryTurnLink,
  ReflectionRecordOffchain,
} from "@shared/memoryReceipts";

type State = {
  reflections: Record<string, ReflectionRecordOffchain>;
  receipts: Record<string, MemoryReceiptOnChain>;
  reflectionToReceipt: Record<string, string>;
  links: Record<string, MemoryTurnLink>;
  events: MemoryLifecycleEvent[];
  injections: MemoryInjectionBundle[];
};

const EMPTY_STATE: State = {
  reflections: {},
  receipts: {},
  reflectionToReceipt: {},
  links: {},
  events: [],
  injections: [],
};

export class MemoryReceiptStore {
  private state: State = structuredClone(EMPTY_STATE);

  constructor(private readonly filePath?: string) {}

  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<State>;
      this.state = {
        reflections: parsed.reflections || {},
        receipts: parsed.receipts || {},
        reflectionToReceipt: parsed.reflectionToReceipt || {},
        links: parsed.links || {},
        events: parsed.events || [],
        injections: parsed.injections || [],
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE);
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

  async saveReflection(record: ReflectionRecordOffchain) {
    this.state.reflections[record.id] = record;
    await this.persist();
    return record;
  }

  async getReflection(id: string) {
    return this.state.reflections[id];
  }

  async listReflections() {
    return Object.values(this.state.reflections).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async saveReceipt(reflectionId: string, receipt: MemoryReceiptOnChain) {
    this.state.receipts[receipt.id] = receipt;
    this.state.reflectionToReceipt[reflectionId] = receipt.id;
    await this.persist();
    return receipt;
  }

  async getReceipt(id: string) {
    return this.state.receipts[id];
  }

  async getReceiptByReflectionId(reflectionId: string) {
    const receiptId = this.state.reflectionToReceipt[reflectionId];
    return receiptId ? this.state.receipts[receiptId] : undefined;
  }

  async listReceipts() {
    return Object.values(this.state.receipts).sort(
      (a, b) => b.createdAtUnix - a.createdAtUnix,
    );
  }

  async saveLink(link: MemoryTurnLink) {
    this.state.links[link.id] = link;
    await this.persist();
    return link;
  }

  async listLinks() {
    return Object.values(this.state.links).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async listLinksByReceipt(receiptId: string) {
    return Object.values(this.state.links)
      .filter((link) => link.receiptId === receiptId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveInjection(bundle: MemoryInjectionBundle) {
    this.state.injections.unshift(bundle);
    this.state.injections = this.state.injections.slice(0, 500);
    await this.persist();
    return bundle;
  }

  async listInjections() {
    return [...this.state.injections];
  }

  async pushEvent(event: MemoryLifecycleEvent) {
    this.state.events.unshift(event);
    this.state.events = this.state.events.slice(0, 2_000);
    await this.persist();
    return event;
  }

  async listEventsForReflection(reflectionId: string) {
    return this.state.events.filter(
      (event) => event.reflectionId === reflectionId,
    );
  }
}

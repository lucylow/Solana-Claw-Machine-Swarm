import fs from "fs/promises";
import path from "path";
import type { PlanExecutionReceipt, PlanReceipt, PlanResultReceipt } from "@shared/planReceipts";
import type { PlanLifecycleEvent } from "./types";

type State = {
  receipts: Record<string, PlanReceipt>;
  latestReceiptByPlanId: Record<string, string>;
  executions: Record<string, PlanExecutionReceipt>;
  latestExecutionByPlanId: Record<string, string>;
  results: Record<string, PlanResultReceipt>;
  latestResultByPlanId: Record<string, string>;
  timeline: PlanLifecycleEvent[];
};

const EMPTY_STATE: State = {
  receipts: {},
  latestReceiptByPlanId: {},
  executions: {},
  latestExecutionByPlanId: {},
  results: {},
  latestResultByPlanId: {},
  timeline: [],
};

export class PlanStore {
  private state: State = structuredClone(EMPTY_STATE);

  constructor(private readonly filePath?: string) {}

  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<State>;
      this.state = {
        receipts: parsed.receipts || {},
        latestReceiptByPlanId: parsed.latestReceiptByPlanId || {},
        executions: parsed.executions || {},
        latestExecutionByPlanId: parsed.latestExecutionByPlanId || {},
        results: parsed.results || {},
        latestResultByPlanId: parsed.latestResultByPlanId || {},
        timeline: parsed.timeline || [],
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE);
    }
  }

  private async persist() {
    if (!this.filePath) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  async saveReceipt(receipt: PlanReceipt) {
    this.state.receipts[receipt.id] = receipt;
    this.state.latestReceiptByPlanId[receipt.planId] = receipt.id;
    await this.persist();
    return receipt;
  }

  async listReceipts() {
    return Object.values(this.state.receipts).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listLatestReceipts() {
    const ids = Object.values(this.state.latestReceiptByPlanId);
    return ids
      .map(id => this.state.receipts[id])
      .filter((value): value is PlanReceipt => Boolean(value))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getReceiptById(receiptId: string) {
    return this.state.receipts[receiptId];
  }

  async getLatestReceiptByPlanId(planId: string) {
    const latestId = this.state.latestReceiptByPlanId[planId];
    return latestId ? this.state.receipts[latestId] : undefined;
  }

  async listReceiptsByPlanId(planId: string) {
    return Object.values(this.state.receipts)
      .filter(receipt => receipt.planId === planId)
      .sort((a, b) => b.version - a.version);
  }

  async saveExecution(execution: PlanExecutionReceipt) {
    this.state.executions[execution.id] = execution;
    this.state.latestExecutionByPlanId[execution.planId] = execution.id;
    await this.persist();
    return execution;
  }

  async getExecutionById(executionId: string) {
    return this.state.executions[executionId];
  }

  async getLatestExecutionByPlanId(planId: string) {
    const latestId = this.state.latestExecutionByPlanId[planId];
    return latestId ? this.state.executions[latestId] : undefined;
  }

  async saveResult(result: PlanResultReceipt) {
    this.state.results[result.id] = result;
    this.state.latestResultByPlanId[result.planId] = result.id;
    await this.persist();
    return result;
  }

  async getResultById(resultId: string) {
    return this.state.results[resultId];
  }

  async getLatestResultByPlanId(planId: string) {
    const latestId = this.state.latestResultByPlanId[planId];
    return latestId ? this.state.results[latestId] : undefined;
  }

  async pushTimelineEvent(event: PlanLifecycleEvent) {
    this.state.timeline.unshift(event);
    this.state.timeline = this.state.timeline.slice(0, 5000);
    await this.persist();
    return event;
  }

  async listTimelineForPlan(planId: string) {
    return this.state.timeline
      .filter(event => event.planId === planId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}

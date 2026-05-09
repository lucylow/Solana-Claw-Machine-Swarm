import type { PlanTimelineEvent } from "@shared/planReceipts";
import type { PlanLifecycleEvent } from "./types";

export class PlanTimelineService {
  toTimelineEvents(events: PlanLifecycleEvent[]): PlanTimelineEvent[] {
    return events.map((event) => ({
      id: event.id,
      planId: event.planId,
      planReceiptId: event.planReceiptId,
      executionReceiptId: event.executionReceiptId,
      resultReceiptId: event.resultReceiptId,
      stage: this.stageForType(event.type),
      status: event.status as PlanTimelineEvent["status"],
      title: this.titleForType(event.type),
      summary: event.summary,
      timestamp: event.createdAt,
      refs: {
        storage: this.stringRef(event.data, "storageRef"),
        txSignature: this.stringRef(event.data, "txSignature"),
        reflectionId: this.stringRef(event.data, "reflectionId"),
        memoryId: this.stringRef(event.data, "memoryId"),
        hash: this.stringRef(event.data, "hash"),
      },
      metadata: event.data,
    }));
  }

  private stageForType(
    type: PlanLifecycleEvent["type"],
  ): PlanTimelineEvent["stage"] {
    if (type.includes("created") || type.includes("stored")) return "breakdown";
    if (type.includes("anchor") || type.includes("verified")) return "proof";
    if (type.includes("execut")) return "execution";
    if (type.includes("result")) return "result";
    if (type.includes("reflection")) return "reflection";
    if (type.includes("memory")) return "memory";
    return "goal";
  }

  private titleForType(type: PlanLifecycleEvent["type"]): string {
    switch (type) {
      case "plan_created":
        return "Plan receipt created";
      case "plan_stored":
        return "Plan stored";
      case "plan_anchored":
        return "Plan anchored";
      case "plan_anchor_degraded":
        return "Plan anchor degraded";
      case "plan_executing":
        return "Execution started";
      case "plan_execution_recorded":
        return "Execution receipt recorded";
      case "plan_result_recorded":
        return "Result receipt recorded";
      case "plan_reflection_linked":
        return "Reflection linked";
      case "plan_memory_linked":
        return "Memory linked";
      case "plan_verified":
        return "Plan verified";
      case "plan_verification_failed":
        return "Verification failed";
      default:
        return "Plan event";
    }
  }

  private stringRef(data: Record<string, unknown> | undefined, key: string) {
    const value = data?.[key];
    return typeof value === "string" ? value : undefined;
  }
}

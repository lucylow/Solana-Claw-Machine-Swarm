import type { DemoMemoryFixture, DemoReflectionFixture } from "./demoTypes";
import type { MemoryRecord, ReflectionRecord } from "./domainModel";

export function reflectionRecordToDemoFixture(r: ReflectionRecord): DemoReflectionFixture {
  const proofStatus: DemoReflectionFixture["proofStatus"] =
    r.status === "verified" ? "verified" : r.status === "failed" || r.status === "degraded" ? "failed" : "pending";
  const outcome: DemoReflectionFixture["outcome"] =
    r.summary.toLowerCase().includes("lesson") || r.summary.toLowerCase().includes("retry")
      ? "lesson"
      : r.status === "failed"
        ? "failure"
        : "correction";
  return {
    id: r.id,
    sourceTurnId: r.sourceTurnId,
    outcome,
    rootCause: r.rootCause,
    correctiveAdvice: r.correctiveAdvice,
    nextAction: r.nextAction,
    confidence: 88,
    linkedMemoryId: r.memoryId ?? "",
    linkedReceiptId: r.onchainReceiptId ?? "",
    proofStatus,
  };
}

export function memoryRecordToDemoFixture(m: MemoryRecord): DemoMemoryFixture {
  return {
    id: m.id,
    memoryType: m.kind,
    source: m.sourceReflectionId ? `Reflection ${m.sourceReflectionId}` : "Orchestration",
    summary: m.summary,
    storageReference: m.storageRef ?? "",
    proofReference: m.proofReceiptId ?? "",
    linkedNextTurnId: m.linkedNextTurnId ?? "",
    verification: m.proofReceiptId ? "verified" : "pending",
    timestampIso: m.createdAt,
  };
}

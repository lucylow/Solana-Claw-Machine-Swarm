import crypto from "crypto";
import type {
  PlanExecutionReceipt,
  PlanReceipt,
  PlanResultReceipt,
} from "@shared/planReceipts";
import {
  canonicalPlanPayload,
  canonicalPlanSummaryPayload,
  canonicalExecutionPayload,
  canonicalResultPayload,
  canonicalize,
} from "./canonicalize";

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hashCanonical(input: unknown): string {
  return sha256Hex(canonicalize(input));
}

export function hashPlanSummary(plan: PlanReceipt): string {
  return hashCanonical(canonicalPlanSummaryPayload(plan));
}

export function hashPlan(plan: PlanReceipt): string {
  return hashCanonical(canonicalPlanPayload(plan));
}

export function hashExecution(execution: PlanExecutionReceipt): string {
  return hashCanonical(canonicalExecutionPayload(execution));
}

export function hashResult(result: PlanResultReceipt): string {
  return hashCanonical(canonicalResultPayload(result));
}

export function compactAnchorHash(input: string): string {
  return sha256Hex(input).slice(0, 64);
}

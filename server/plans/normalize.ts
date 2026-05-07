import { nanoid } from "nanoid";
import type { CreatePlanReceiptInput } from "./types";

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeDate(input?: string) {
  if (!input) return nowIso();
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return nowIso();
  return date.toISOString();
}

export function normalizePlanId(planId?: string) {
  return planId?.trim() || `plan_${nanoid(12)}`;
}

export function normalizeSteps(input: CreatePlanReceiptInput["steps"]) {
  return input.map((step, index) => ({
    ...step,
    id: step.id || `step_${index + 1}`,
    index,
    dependencies: [...(step.dependencies || [])],
    chosenSkills: [...(step.chosenSkills || [])],
    status: step.status ?? "pending",
  }));
}

export function normalizeTags(tags?: string[]) {
  return (tags || [])
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 32);
}

export function normalizeMetadata(metadata?: Record<string, unknown>) {
  return metadata ? { ...metadata } : {};
}

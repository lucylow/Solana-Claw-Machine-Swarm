import type {
  PlanExecutionReceipt,
  PlanReceipt,
  PlanResultReceipt,
  PlanTimelineEvent,
  PlanVerificationResult,
} from "@shared/planReceipts";

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload.data;
}

export async function listPlans() {
  return request<PlanReceipt[]>("/api/plans");
}

export async function getPlan(planId: string) {
  return request<PlanReceipt>(`/api/plans/${planId}`);
}

export async function getPlanTimeline(planId: string) {
  return request<PlanTimelineEvent[]>(`/api/plans/${planId}/timeline`);
}

export async function getPlanResult(planId: string) {
  return request<PlanResultReceipt | null>(`/api/plans/${planId}/result`);
}

export async function verifyPlan(planId: string) {
  return request<PlanVerificationResult>(`/api/plans/${planId}/verify`);
}

export async function executePlan(input: {
  planId: string;
  worker: string;
  finalResult?: string;
  status?: PlanExecutionReceipt["status"];
}) {
  return request<PlanExecutionReceipt>("/api/plans/execute", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createPlanResult(input: {
  planId: string;
  actualOutcome: string;
  status: PlanResultReceipt["status"];
  resultSummary: string;
  sourceExecutionReceiptId?: string;
  reflection?: PlanResultReceipt["reflection"];
  memory?: PlanResultReceipt["memory"];
}) {
  return request<{
    result: PlanResultReceipt;
    planReceipt: PlanReceipt;
    degraded: boolean;
  }>("/api/plans/result", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

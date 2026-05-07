import type { ZeroGBridgeState } from "./types";

export function bridgeStatusLabel(state: ZeroGBridgeState) {
  if (!state.enabled) return "Bridge unavailable";
  if (state.mode === "mock") return state.status === "confirmed" ? "Bridge verified (mock)" : "Mock bridge mode";
  if (state.status === "confirmed") return "Bridge verified";
  if (state.status === "pending") return "Bridge pending";
  if (state.status === "failed" || state.status === "degraded") return "Bridge unavailable";
  return "Bridge ready";
}

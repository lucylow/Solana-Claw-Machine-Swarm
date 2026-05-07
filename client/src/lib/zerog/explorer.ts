import { formatHash } from "./format";
import type { ZeroGConfig } from "./types";

export function artifactExplorerUrl(config: ZeroGConfig, storageRef?: string) {
  if (!storageRef) return undefined;
  return `${config.explorerUrl}/artifact/${encodeURIComponent(storageRef)}`;
}

export function computeExplorerUrl(config: ZeroGConfig, computeRef?: string) {
  if (!computeRef) return undefined;
  return `${config.explorerUrl}/compute/${encodeURIComponent(computeRef)}`;
}

export function daExplorerUrl(config: ZeroGConfig, availabilityRef?: string) {
  if (!availabilityRef) return undefined;
  return `${config.explorerUrl}/da/${encodeURIComponent(availabilityRef)}`;
}

export function explorerLabel(id?: string) {
  return id ? formatHash(id, 6) : "open";
}

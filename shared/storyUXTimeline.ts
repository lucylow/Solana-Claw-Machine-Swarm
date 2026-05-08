/**
 * Maps bottom-rail {@link CommandTimelineEvent}s into {@link UXTimelineItem} for
 * screen readers, checklist UIs, and exports — one narrative, two views.
 */

import type { CommandTimelineEvent } from "./commandCenterTimeline";
import type { UXTimelineItem } from "./uxState";

function mapStatus(
  s: CommandTimelineEvent["status"],
): UXTimelineItem["status"] {
  switch (s) {
    case "complete":
      return "completed";
    case "active":
      return "active";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

function mapProofStatus(
  ev: CommandTimelineEvent,
): UXTimelineItem["proofStatus"] | undefined {
  if (ev.proofRef) return "verified";
  if (ev.status === "failed") return "degraded";
  if (ev.status === "active") return "pending";
  if (ev.status === "complete") return "pending";
  return "unverified";
}

/** Compact checklist rows aligned with the live command-center timeline. */
export function commandEventsToUXTimeline(
  events: CommandTimelineEvent[],
): UXTimelineItem[] {
  return events.map(ev => ({
    id: ev.id,
    label: ev.label,
    description: ev.detail?.trim() ? ev.detail : "—",
    status: mapStatus(ev.status),
    timestamp: ev.at,
    proofStatus: mapProofStatus(ev),
  }));
}

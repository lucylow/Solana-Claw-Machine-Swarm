import type { AutonomyLevel } from "@shared/autonomy";

export const AUTONOMY_LEVEL_LABELS: Record<AutonomyLevel, string> = {
  automation_only: "Automation only",
  assisted: "Assisted",
  guided: "Guided",
  policy_gated: "Policy gated",
  meaningful_agency: "Meaningful agency",
  near_autonomous: "Near autonomous",
  fully_autonomous: "Full autonomy",
};

export function autonomyLevelClass(level: AutonomyLevel): string {
  switch (level) {
    case "automation_only":
      return "bg-zinc-800/80 text-zinc-200 border-zinc-600/60";
    case "assisted":
      return "bg-slate-800/80 text-slate-100 border-slate-500/60";
    case "guided":
      return "bg-cyan-950/80 text-cyan-300 border-cyan-600/60";
    case "policy_gated":
      return "bg-teal-950/80 text-teal-300 border-teal-600/60";
    case "meaningful_agency":
      return "bg-emerald-950/80 text-emerald-300 border-emerald-600/60";
    case "near_autonomous":
      return "bg-lime-950/80 text-lime-300 border-lime-600/60";
    case "fully_autonomous":
      return "bg-[#1a2c1f] text-[#6dffb3] border-[#3bff96]/60";
  }
}

export function scoreTone(score: number): "low" | "mid" | "high" {
  if (score < 40) return "low";
  if (score < 75) return "mid";
  return "high";
}

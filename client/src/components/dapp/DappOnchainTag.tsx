import { Database, FlaskConical, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DappScope = "onchain" | "offchain" | "demo";

const COPY: Record<DappScope, { label: string; hint: string }> = {
  onchain: {
    label: "Onchain",
    hint: "Anchored on Solana — verifiable in Explorer.",
  },
  offchain: {
    label: "Offchain",
    hint: "Stored locally or in a sidecar; not anchored on Solana.",
  },
  demo: {
    label: "Demo only",
    hint: "Fixture data — no real signature on this row.",
  },
};

const TONE: Record<DappScope, string> = {
  onchain: "border-[#14f195]/45 bg-[#14f195]/10 text-[#d6ffe9]",
  offchain: "border-slate-500/40 bg-slate-500/10 text-slate-200",
  demo: "border-violet-400/40 bg-violet-500/10 text-violet-100",
};

const ICON = {
  onchain: Link2,
  offchain: Database,
  demo: FlaskConical,
} as const;

/**
 * Trust label that disambiguates onchain vs offchain vs demo data.
 */
export function DappOnchainTag({
  scope,
  className,
  size = "md",
}: {
  scope: DappScope;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = ICON[scope];
  const meta = COPY[scope];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-semibold uppercase tracking-wide",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        TONE[scope],
        className,
      )}
      title={meta.hint}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  );
}

import { cn } from "@/lib/utils";
import { proofStatusBadgeLabel } from "@/lib/copy/renderProofClaim";
import type { ProofStatus } from "@shared/structuredReceipt";

export function ProofStateBadge({
  status,
  className,
}: {
  status: ProofStatus;
  className?: string;
}) {
  const label = proofStatusBadgeLabel(status);
  const tone =
    status === "verified"
      ? "border-[#14f195]/50 bg-[#14f195]/15 text-[#c8ffe8]"
      : status === "pending"
        ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
        : status === "degraded"
          ? "border-rose-400/40 bg-rose-950/40 text-rose-100"
          : status === "cached_only"
            ? "border-slate-500/50 bg-slate-900/60 text-slate-300"
            : status === "demo_only"
              ? "border-violet-400/35 bg-violet-950/30 text-violet-100"
              : "border-white/12 bg-black/40 text-slate-500";

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone,
        className
      )}
      title={label}
    >
      {label}
    </span>
  );
}

import { cn } from "@/lib/utils";

/**
 * Subtle Solana-tinted skeleton.
 * Use while waiting for chain/RPC reads.
 */
export function DappLoadingSkeleton({
  className,
  rounded = "lg",
  pulse = true,
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  pulse?: boolean;
}) {
  const r =
    rounded === "sm"
      ? "rounded"
      : rounded === "md"
        ? "rounded-md"
        : rounded === "xl"
          ? "rounded-xl"
          : rounded === "full"
            ? "rounded-full"
            : "rounded-lg";
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-white/[0.04] via-[#14f195]/[0.06] to-white/[0.04]",
        pulse && "motion-safe:animate-pulse",
        r,
        className,
      )}
      aria-hidden
    />
  );
}

/** A pre-built receipt-card-shaped skeleton. */
export function DappReceiptSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <DappLoadingSkeleton className="h-3 w-24" />
        <DappLoadingSkeleton className="h-5 w-16" rounded="full" />
      </div>
      <DappLoadingSkeleton className="h-4 w-3/4" />
      <DappLoadingSkeleton className="h-3 w-1/2" />
      <div className="flex flex-wrap gap-2 pt-1">
        <DappLoadingSkeleton className="h-5 w-24" rounded="full" />
        <DappLoadingSkeleton className="h-5 w-20" rounded="full" />
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { SolanaCluster } from "@shared/solana/types";

const CLUSTER_LABEL: Record<SolanaCluster, string> = {
  "mainnet-beta": "Mainnet-beta",
  devnet: "Devnet",
  testnet: "Testnet",
  localnet: "Localnet",
};

const CLUSTER_TONE: Record<SolanaCluster, string> = {
  "mainnet-beta": "border-[#14f195]/45 bg-[#14f195]/10 text-[#d6ffe9]",
  devnet: "border-cyan-400/40 bg-cyan-500/10 text-cyan-100",
  testnet: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  localnet: "border-violet-400/40 bg-violet-500/10 text-violet-100",
};

/**
 * Cluster pill with a live status dot.
 * Always visible in the dApp shell so the user knows whether they
 * are on devnet / testnet / mainnet-beta / localnet.
 */
export function DappNetworkBadge({
  cluster,
  rpcOk = true,
  wrong = false,
  size = "md",
  className,
}: {
  cluster: SolanaCluster;
  rpcOk?: boolean;
  wrong?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const tone = wrong
    ? "border-amber-400/55 bg-amber-500/15 text-amber-100"
    : CLUSTER_TONE[cluster] ?? "border-white/15 bg-white/5 text-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        tone,
        className
      )}
      aria-label={wrong ? "Wrong cluster" : `Solana ${cluster} cluster`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
            wrong
              ? "bg-amber-300"
              : rpcOk
                ? "bg-[#3bff96]"
                : "bg-rose-400"
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            wrong ? "bg-amber-300" : rpcOk ? "bg-[#3bff96]" : "bg-rose-400"
          )}
        />
      </span>
      {wrong ? "Cluster mismatch" : CLUSTER_LABEL[cluster] ?? cluster}
    </span>
  );
}

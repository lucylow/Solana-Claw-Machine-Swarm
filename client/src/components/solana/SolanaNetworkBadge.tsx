import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SolanaCluster } from "@shared/solana/types";

const LABELS: Record<SolanaCluster, string> = {
  "mainnet-beta": "Mainnet",
  devnet: "Devnet",
  testnet: "Testnet",
  localnet: "Localnet",
};

export function SolanaNetworkBadge({
  cluster,
  className,
  wrong = false,
}: {
  cluster: SolanaCluster;
  className?: string;
  wrong?: boolean;
}) {
  return (
    <Badge
      className={cn(
        "border text-[11px] font-semibold uppercase tracking-wide",
        wrong
          ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
          : "border-[#3bff96]/40 bg-[#3bff96]/12 text-[#c9ffe8]",
        className
      )}
    >
      {wrong ? "Wrong cluster" : LABELS[cluster] ?? cluster}
    </Badge>
  );
}

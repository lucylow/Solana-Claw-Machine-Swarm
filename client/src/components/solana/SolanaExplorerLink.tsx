import { cn } from "@/lib/utils";
import type { SolanaCluster } from "@shared/solana/types";
import { ExternalLink } from "lucide-react";

type Props = {
  kind: "tx" | "address";
  value?: string | null;
  cluster: SolanaCluster;
  label?: string;
  buildUrl: (value: string, cluster: SolanaCluster) => string;
};

export function SolanaExplorerLink({ kind, value, cluster, label, buildUrl }: Props) {
  if (!value) return null;
  const href = buildUrl(value, cluster);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[#3bff96]/35 bg-[#3bff96]/10 px-2 py-1 text-xs font-medium text-[#c9ffe8]",
        "transition hover:border-[#3bff96]/60 hover:bg-[#3bff96]/15"
      )}
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      {label ?? (kind === "tx" ? "Solana explorer · signature" : "Solana explorer · account")}
    </a>
  );
}

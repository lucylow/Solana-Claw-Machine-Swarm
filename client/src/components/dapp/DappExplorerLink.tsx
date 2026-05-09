import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { addressExplorerUrl, txExplorerUrl } from "@/lib/solana/explorer";
import type { SolanaCluster } from "@shared/solana/types";

type Props = {
  kind: "tx" | "address";
  value?: string | null;
  cluster: SolanaCluster;
  label?: string;
  /** Render as full button or inline anchor. */
  variant?: "button" | "inline";
  className?: string;
};

/**
 * Single-click "Open in Explorer" affordance.
 * Always Solana Explorer with cluster query; no Etherscan / EVM patterns.
 */
export function DappExplorerLink({
  kind,
  value,
  cluster,
  label,
  variant = "button",
  className,
}: Props) {
  if (!value) return null;
  const href =
    kind === "tx"
      ? txExplorerUrl(value, cluster)
      : addressExplorerUrl(value, cluster);
  if (!href) return null;

  const text =
    label ??
    (kind === "tx"
      ? "Open transaction in Explorer"
      : "Open account in Explorer");

  if (variant === "inline") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium text-[#9cf6d8] underline-offset-4 transition hover:text-[#d6ffe9] hover:underline",
          className,
        )}
      >
        <ExternalLink className="h-3 w-3" aria-hidden />
        {text}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-[#14f195]/35 bg-[#14f195]/10 px-2.5 py-1 text-[11px] font-semibold text-[#d6ffe9] transition hover:border-[#14f195]/55 hover:bg-[#14f195]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14f195]/60",
        className,
      )}
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      {text}
    </a>
  );
}

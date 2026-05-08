import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label?: string;
  /** Visual variant: pill is good in tight rows, ghost is for inline labels. */
  variant?: "pill" | "ghost";
  toastMessage?: string;
  className?: string;
};

/**
 * Copy-to-clipboard button with celebratory state.
 * Designed for addresses, signatures, and PDA strings.
 */
export function DappCopyButton({
  value,
  label,
  variant = "pill",
  toastMessage = "Copied to clipboard",
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(toastMessage);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={label ? `Copy ${label}` : "Copy"}
      className={cn(
        "group inline-flex items-center gap-1.5 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14f195]/60",
        variant === "pill"
          ? "rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-slate-300 hover:border-[#14f195]/40 hover:bg-[#14f195]/10 hover:text-[#d6ffe9]"
          : "rounded text-slate-400 hover:text-[#d6ffe9]",
        copied && "border-[#14f195]/45 bg-[#14f195]/10 text-[#d6ffe9]",
        className
      )}
    >
      {copied ? (
        <Check className="h-3 w-3 text-[#3bff96]" aria-hidden />
      ) : (
        <Copy className="h-3 w-3 opacity-70 group-hover:opacity-100" aria-hidden />
      )}
      <span className="truncate">{label ?? value}</span>
    </button>
  );
}

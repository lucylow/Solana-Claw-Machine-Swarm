import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Empty state that still feels like part of a Solana dApp.
 * Encourages a wallet-first action when nothing is loaded yet.
 */
export function DappEmptyState({
  title,
  description,
  Icon = Inbox,
  action,
  tone = "default",
  className,
}: {
  title: string;
  description?: string;
  Icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  tone?: "default" | "wallet" | "demo";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-10 text-center",
        tone === "wallet"
          ? "border-[#14f195]/30 bg-[#0a120e]/70"
          : tone === "demo"
            ? "border-violet-400/25 bg-violet-500/[0.05]"
            : "border-white/10 bg-black/30",
        className,
      )}
      role="status"
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border",
          tone === "wallet"
            ? "border-[#14f195]/30 bg-[#14f195]/10 text-[#9cf6d8]"
            : tone === "demo"
              ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
              : "border-white/10 bg-black/40 text-slate-400",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-white">{title}</p>
      {description ? (
        <p className="max-w-md text-xs leading-relaxed text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

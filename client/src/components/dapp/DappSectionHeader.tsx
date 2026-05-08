import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact section header for dApp pages.
 *
 * Pattern: small uppercase tag (Solana eyebrow) + bold title + optional
 * supporting copy and inline status / action slot on the right.
 */
export function DappSectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7dccb8]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Error state that preserves trust:
 *  - clearly communicates failure (Solana cluster vs adapter vs app)
 *  - offers a retry without resorting to a generic "Something broke".
 */
export function DappErrorState({
  title = "Something failed onchain",
  description,
  hint,
  onRetry,
  retryLabel = "Retry",
  className,
  children,
}: {
  title?: string;
  description?: string;
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-400/35 bg-rose-950/25 p-4 text-rose-50 shadow-[0_18px_40px_rgba(244,63,94,0.18)]",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rose-50">{title}</p>
          {description ? (
            <p className="mt-1 break-words text-xs leading-relaxed text-rose-100/85">
              {description}
            </p>
          ) : null}
          {hint ? (
            <p className="mt-2 text-[11px] uppercase tracking-wider text-rose-200/70">
              Try: {hint}
            </p>
          ) : null}
          {children ? <div className="mt-2 text-xs text-rose-100/85">{children}</div> : null}
        </div>
        {onRetry ? (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-rose-300/40 text-[11px] text-rose-50 hover:bg-rose-500/15"
            onClick={onRetry}
          >
            <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

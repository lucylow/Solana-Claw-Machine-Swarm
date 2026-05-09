import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AppError } from "@shared/errorTypes";
import { getRetryPolicyForCode } from "@shared/retryPolicy";
import {
  AlertTriangle,
  Bug,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { isDiagnosticsMode } from "./diagnostics";
import { useErrorSurface } from "./ErrorSurfaceContext";

export function RecoveryActionButton({
  appError,
  onRetry,
  className,
}: {
  appError: AppError;
  onRetry?: () => void;
  className?: string;
}) {
  const policy = getRetryPolicyForCode(appError.code);
  if (!onRetry || !appError.retryable || !policy.retryable) return null;
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn("border-[#14f195]/40 text-[#b8ffd9]", className)}
      onClick={onRetry}
    >
      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
      {appError.retryLabel ?? policy.label}
    </Button>
  );
}

export function InlineErrorCard({
  appError,
  onRetry,
  onDismiss,
  className,
}: {
  appError: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const diag = isDiagnosticsMode();
  const tone =
    appError.severity === "critical"
      ? "border-red-500/40 bg-red-950/30"
      : appError.severity === "error"
        ? "border-orange-500/35 bg-orange-950/20"
        : "border-amber-400/30 bg-amber-950/15";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm text-slate-100 shadow-sm",
        tone,
        className,
      )}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 shrink-0 text-[#ffb020] mt-0.5" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-white leading-snug">
              {appError.title}
            </p>
            <p className="text-slate-300 text-[13px] leading-relaxed">
              {appError.message}
            </p>
            {appError.recoveryAction ? (
              <p className="text-[12px] text-[#14f195]/90 flex items-start gap-1">
                <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {appError.recoveryAction}
              </p>
            ) : null}
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
              {appError.code} · {appError.scope}
              {appError.retryable ? " · Retry available" : ""}
            </p>
            {diag && appError.technicalMessage ? (
              <pre className="text-[11px] text-slate-400 whitespace-pre-wrap break-all mt-2">
                {appError.technicalMessage}
              </pre>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {onDismiss ? (
            <button
              type="button"
              aria-label="Dismiss"
              className="text-slate-500 hover:text-slate-300"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <RecoveryActionButton appError={appError} onRetry={onRetry} />
        </div>
      </div>
    </div>
  );
}

export function SectionErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center space-y-3">
      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
      <p className="font-medium text-white">{title}</p>
      <p className="text-sm text-slate-400 max-w-md mx-auto">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function GlobalErrorBanner() {
  const ctx = useErrorSurface();
  const err = ctx?.state.active;
  if (!err) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[100] px-3 pt-3 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <InlineErrorCard
          appError={err}
          onDismiss={() => ctx.dismissActive()}
          onRetry={
            err.retryable
              ? () => {
                  ctx.queueRetry(err.id);
                  ctx.dismissActive();
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}

export function DegradedModeBanner({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-[12px] text-amber-100/90">
      <span className="font-semibold text-amber-200">Degraded mode · </span>
      {messages.join(" · ")}
    </div>
  );
}

export function DemoModeNotice({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="rounded-lg border border-[#9945ff]/35 bg-[#1a0f24]/80 px-3 py-2 text-[12px] text-[#e9d5ff]">
      Demo mode only — flows may use fixtures; proof badges follow demo policy,
      not live verification unless configured.
    </div>
  );
}

export function ProofErrorBadge({ status }: { status: string }) {
  const label =
    status === "verified"
      ? "Verified"
      : status === "pending"
        ? "Proof pending"
        : status === "degraded"
          ? "Proof degraded"
          : status === "cached_only"
            ? "Cached only"
            : status === "demo_only"
              ? "Demo only"
              : "Unverified";
  const cls =
    status === "verified"
      ? "bg-[#14f195]/15 text-[#14f195] border-[#14f195]/40"
      : status === "demo_only" || status === "cached_only"
        ? "bg-[#9945ff]/15 text-[#e9d5ff] border-[#9945ff]/35"
        : "bg-amber-500/10 text-amber-200 border-amber-400/35";
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border",
        cls,
      )}
    >
      {label}
    </span>
  );
}

export function WalletErrorBanner({ appError }: { appError: AppError | null }) {
  if (!appError || appError.scope !== "wallet") return null;
  return <InlineErrorCard appError={appError} />;
}

export function SessionErrorBanner({
  appError,
}: {
  appError: AppError | null;
}) {
  if (!appError || appError.scope !== "session") return null;
  return <InlineErrorCard appError={appError} />;
}

export function ReceiptErrorCard({
  appError,
  onRetry,
}: {
  appError: AppError | null;
  onRetry?: () => void;
}) {
  if (
    !appError ||
    (appError.scope !== "receipt" && appError.code !== "RECEIPT_ANCHOR_FAILED")
  )
    return null;
  return <InlineErrorCard appError={appError} onRetry={onRetry} />;
}

export function MemoryErrorCard({
  appError,
  onRetry,
}: {
  appError: AppError | null;
  onRetry?: () => void;
}) {
  if (
    !appError ||
    (appError.scope !== "memory" && appError.scope !== "reflection")
  )
    return null;
  return <InlineErrorCard appError={appError} onRetry={onRetry} />;
}

export function ZeroGErrorCard({
  appError,
  onRetry,
}: {
  appError: AppError | null;
  onRetry?: () => void;
}) {
  if (!appError || appError.scope !== "zerog") return null;
  return <InlineErrorCard appError={appError} onRetry={onRetry} />;
}

export function OpenClawErrorCard({
  appError,
  onRetry,
}: {
  appError: AppError | null;
  onRetry?: () => void;
}) {
  if (!appError || appError.scope !== "openclaw") return null;
  return <InlineErrorCard appError={appError} onRetry={onRetry} />;
}

export function ExecutionErrorPanel({
  errors,
  onRetry,
}: {
  errors: AppError[];
  onRetry?: () => void;
}) {
  if (!errors.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
        Execution errors
      </p>
      {errors.map((e) => (
        <InlineErrorCard key={e.id} appError={e} onRetry={onRetry} />
      ))}
    </div>
  );
}

export function RetryableOperationCard({
  title,
  status,
  appError,
  onRetry,
  children,
}: {
  title: string;
  status: "idle" | "pending" | "success" | "failed";
  appError?: AppError | null;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{title}</p>
        <span className="text-[10px] uppercase text-slate-500">{status}</span>
      </div>
      {children}
      {appError ? (
        <InlineErrorCard appError={appError} onRetry={onRetry} />
      ) : null}
    </div>
  );
}

export function ErrorPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}

export function ErrorDiagnosticsDrawer({
  appErrors,
}: {
  appErrors: AppError[];
}) {
  if (!isDiagnosticsMode() || !appErrors.length) return null;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-slate-400 gap-1"
        >
          <Bug className="h-4 w-4" />
          Diagnostics
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Error diagnostics</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {appErrors.map((e) => (
            <pre
              key={e.id}
              className="text-[11px] bg-muted p-3 rounded-lg overflow-x-auto"
            >
              {JSON.stringify(e, null, 2)}
            </pre>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

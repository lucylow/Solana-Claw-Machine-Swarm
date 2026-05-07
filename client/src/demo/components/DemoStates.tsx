import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { DemoPanel } from "./DemoPanel";

export function DemoEmptyState({
  title,
  message,
  action,
  presentationMode,
}: {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  presentationMode?: boolean;
}) {
  return (
    <DemoPanel presentationMode={presentationMode} className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="mb-3 h-10 w-10 text-slate-600" />
      <h3 className={cn("font-semibold text-slate-200", presentationMode ? "text-lg" : "text-base")}>{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
      {action ? (
        <Button className="mt-4 bg-[#3bff96] text-black hover:bg-[#6bffbc]" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </DemoPanel>
  );
}

export function DemoLoadingState({ label, presentationMode }: { label: string; presentationMode?: boolean }) {
  return (
    <DemoPanel presentationMode={presentationMode} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin text-[#3bff96]" />
        {label}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-slate-800/80" />
        <div className="h-3 w-[85%] animate-pulse rounded bg-slate-800/60" />
        <div className="h-24 animate-pulse rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
      </div>
    </DemoPanel>
  );
}

export function DemoErrorState({
  title,
  message,
  onRetry,
  presentationMode,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  presentationMode?: boolean;
}) {
  return (
    <DemoPanel
      presentationMode={presentationMode}
      className="border-red-500/30 bg-red-950/20"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
        <div>
          <h3 className="font-semibold text-red-100">{title}</h3>
          <p className="mt-1 text-sm text-red-200/90">{message}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-3 border-red-400/40 text-red-100" onClick={onRetry}>
              Retry preview
            </Button>
          ) : null}
        </div>
      </div>
    </DemoPanel>
  );
}

export function DemoSkeletonCard() {
  return <div className="h-28 animate-pulse rounded-xl border border-white/5 bg-slate-900/40" />;
}

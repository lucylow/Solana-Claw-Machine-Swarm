import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeError } from "@shared/normalizeError";
import { AlertTriangle, ExternalLink, RotateCcw } from "lucide-react";

export default function FallbackScreen({
  title = "Command center hit a render fault",
  error,
  onRetry,
}: {
  title?: string;
  error: unknown;
  onRetry?: () => void;
}) {
  const app = normalizeError(error, { source: "error_boundary" });

  return (
    <div className="min-h-screen bg-[#0a0f14] text-slate-100 flex flex-col items-center justify-center p-6">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border border-[#14f195]/25 bg-[#0d151c]/95",
          "shadow-[0_0_40px_rgba(20,241,149,0.08)] p-8 space-y-6"
        )}
      >
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#14f195]/10 p-3 text-[#14f195]">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[#14f195]/80">CLAW_MACHINE</p>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-slate-300 leading-relaxed">{app.message}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              {app.code} · {app.scope}
            </p>
          </div>
        </div>

        {app.technicalMessage ? (
          <pre className="text-[11px] leading-relaxed rounded-lg bg-black/40 border border-white/5 p-3 overflow-auto max-h-40 text-slate-400">
            {app.technicalMessage}
          </pre>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {onRetry ? (
            <Button
              type="button"
              onClick={onRetry}
              className="bg-[#14f195] text-black hover:bg-[#0fd688]"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="border-white/15 text-slate-200"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-[#9945ff]"
            asChild
          >
            <a href="https://solana.com" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Solana
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

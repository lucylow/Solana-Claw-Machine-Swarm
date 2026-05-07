import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function DemoMockModeBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
        <span>
          <span className="font-medium text-amber-50">Demo mode</span> — interactive mock data. Not live chain state; Solana
          links open real explorers with demo signatures for presentation.
        </span>
      </div>
      <Badge variant="outline" className="border-amber-400/50 text-amber-50">
        Mock layer
      </Badge>
    </div>
  );
}

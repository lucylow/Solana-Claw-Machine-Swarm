import { ProofVerificationBadge } from "@/components/command-center/CommandCenterComponents";
import { cn } from "@/lib/utils";
import type { DemoReflectionFixture } from "@shared/demoTypes";
import { Brain } from "lucide-react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";
import { DemoEmptyState } from "./DemoStates";

export function DemoReflectionCard({
  reflection,
  presentationMode,
  glow,
}: {
  reflection: DemoReflectionFixture | null;
  presentationMode?: boolean;
  glow?: boolean;
}) {
  const { setRunOutcome } = useDemo();

  if (!reflection) {
    return (
      <DemoEmptyState
        presentationMode={presentationMode}
        title="No reflection on this path"
        message="Run with failure or recovery outcome to show structured reflection linked to memory and Solana receipts."
        action={{ label: "Switch to recovery", onClick: () => setRunOutcome("recovery") }}
      />
    );
  }

  return (
    <DemoPanel glow={glow} presentationMode={presentationMode} className="space-y-3 border-[#38d7d0]/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#38d7d0]" />
          <h3 className={cn("font-semibold text-white", presentationMode && "text-xl")}>Reflection record</h3>
        </div>
        <ProofVerificationBadge
          verification={{
            status: reflection.proofStatus === "verified" ? "verified" : "pending",
            label: reflection.proofStatus === "verified" ? "Anchored on Solana" : "Pending proof",
          }}
        />
      </div>
      <p className="font-mono text-xs text-slate-500">{reflection.id}</p>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
          <p className="text-xs text-slate-500">Root cause</p>
          <p className="mt-1 text-sm text-slate-200">{reflection.rootCause}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
          <p className="text-xs text-slate-500">Corrective advice</p>
          <p className="mt-1 text-sm text-slate-200">{reflection.correctiveAdvice}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 md:col-span-2">
          <p className="text-xs text-slate-500">Next action</p>
          <p className="mt-1 text-sm text-[#c8ffe2]">{reflection.nextAction}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span>Source turn: {reflection.sourceTurnId}</span>
        <span>Memory: {reflection.linkedMemoryId}</span>
        <span>Receipt: {reflection.linkedReceiptId}</span>
        <span>Confidence {reflection.confidence}</span>
      </div>
    </DemoPanel>
  );
}

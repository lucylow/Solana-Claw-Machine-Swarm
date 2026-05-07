import { ProofVerificationBadge } from "@/components/command-center/CommandCenterComponents";
import { cn } from "@/lib/utils";
import type { DemoMemoryFixture } from "@shared/demoTypes";
import { MemoryStick } from "lucide-react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";
import { DemoEmptyState } from "./DemoStates";

export function DemoMemoryCard({
  memory,
  presentationMode,
  glow,
}: {
  memory: DemoMemoryFixture | null;
  presentationMode?: boolean;
  glow?: boolean;
}) {
  const { setRunOutcome } = useDemo();

  if (!memory) {
    return (
      <DemoEmptyState
        presentationMode={presentationMode}
        title="No durable memory yet"
        message="Memory appears after a failure path produces a reflection. It becomes queryable and is injected into the next turn."
        action={{ label: "Show failure → memory arc", onClick: () => setRunOutcome("failure") }}
      />
    );
  }

  return (
    <DemoPanel glow={glow} presentationMode={presentationMode} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MemoryStick className="h-5 w-5 text-cyan-300" />
          <h3 className={cn("font-semibold text-white", presentationMode && "text-xl")}>Memory record</h3>
        </div>
        <ProofVerificationBadge
          verification={{
            status: memory.verification === "verified" ? "verified" : "pending",
            label: memory.verification === "verified" ? "Verified durable memory" : "Pending verification",
          }}
        />
      </div>
      <p className="font-mono text-xs text-slate-500">{memory.id}</p>
      <p className="text-sm text-slate-200">{memory.summary}</p>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/40 p-2">
          <p className="text-slate-500">Type</p>
          <p className="mt-1 text-slate-200">{memory.memoryType}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-2">
          <p className="text-slate-500">Source</p>
          <p className="mt-1 text-slate-200">{memory.source}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-2 md:col-span-2">
          <p className="text-slate-500">Storage reference</p>
          <p className="mt-1 break-all font-mono text-[11px] text-[#b8ffd8]">{memory.storageReference}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-2 md:col-span-2">
          <p className="text-slate-500">Solana proof reference</p>
          <p className="mt-1 break-all font-mono text-[11px] text-slate-400">{memory.proofReference}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-2 md:col-span-2">
          <p className="text-slate-500">Linked next turn</p>
          <p className="mt-1 font-mono text-slate-200">{memory.linkedNextTurnId}</p>
        </div>
      </div>
      <p className="text-[11px] text-slate-600">Written {new Date(memory.timestampIso).toLocaleString()}</p>
    </DemoPanel>
  );
}

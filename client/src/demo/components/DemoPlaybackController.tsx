import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEMO_SCENARIOS } from "@shared/demoFixtures";
import { LayoutList } from "lucide-react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";
import { DemoEventLogPanel } from "./DemoEventLogPanel";
import { DemoStoryStepper } from "./DemoStoryStepper";

/** Scenario switching + playback + event log — presenter shell. */
export function DemoPlaybackController({ presentationMode }: { presentationMode?: boolean }) {
  const { selectedScenarioId, setSelectedScenarioId, demoSnapshot, replayStory } = useDemo();

  return (
    <div className="space-y-4">
      <DemoPanel presentationMode={presentationMode} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <LayoutList className="h-4 w-4 text-[#3bff96]" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87f7d0]">Scenario</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map(s => (
            <Button
              key={s.id}
              size="sm"
              variant={selectedScenarioId === s.id ? "default" : "outline"}
              className={cn(
                selectedScenarioId === s.id
                  ? "bg-[#3bff96] text-black hover:bg-[#6bffbc]"
                  : "border-white/15 text-slate-200"
              )}
              onClick={() => {
                setSelectedScenarioId(s.id);
                replayStory();
              }}
            >
              {s.title}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">{DEMO_SCENARIOS.find(s => s.id === selectedScenarioId)?.summary}</p>
      </DemoPanel>

      <DemoStoryStepper presentationMode={presentationMode} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DemoPanel presentationMode={presentationMode} className="space-y-2 text-sm text-slate-300">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Snapshot · derived</p>
          <ul className="space-y-1 text-[11px] text-slate-400">
            <li>Wallet verified · {demoSnapshot.derived.isWalletVerified ? "yes" : "no"}</li>
            <li>Proof verified (strict) · {demoSnapshot.derived.isProofVerified ? "yes" : "no — demo receipts"}</li>
            <li>Memory linked · {demoSnapshot.derived.isMemoryLinked ? "yes" : "no"}</li>
            <li>Failure / recovery · {demoSnapshot.derived.hasFailure ? "failure path" : "clean"} /{" "}
            {demoSnapshot.derived.hasRecovery ? "recovery arc" : "—"}</li>
            <li>Reputation · {demoSnapshot.reputation?.label}</li>
            <li>Autonomy · {demoSnapshot.autonomy?.label}</li>
          </ul>
        </DemoPanel>
        <DemoEventLogPanel presentationMode={presentationMode} />
      </div>
    </div>
  );
}

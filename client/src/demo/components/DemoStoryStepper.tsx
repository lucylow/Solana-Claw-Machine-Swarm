import { Button } from "@/components/ui/button";
import { DEMO_GUIDED_STEPS } from "@shared/demoFixtures";
import {
  ChevronLeft,
  ChevronRight,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";

export function DemoStoryStepper({ presentationMode }: { presentationMode?: boolean }) {
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    guidedAutoplay,
    setGuidedAutoplay,
    showPresenterNotes,
    setShowPresenterNotes,
    replayGuided,
    guidedStepCount,
  } = useDemo();

  const step = DEMO_GUIDED_STEPS[guidedStepIndex]!;

  return (
    <DemoPanel presentationMode={presentationMode} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Guided story</p>
          <p className="text-sm font-medium text-white">
            Step {guidedStepIndex + 1} / {guidedStepCount}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 text-slate-200"
            onClick={() => setGuidedAutoplay(!guidedAutoplay)}
          >
            {guidedAutoplay ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            {guidedAutoplay ? "Pause" : "Autoplay"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 text-slate-200"
            onClick={() => setGuidedStepIndex(i => Math.max(0, i - 1))}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 text-slate-200"
            onClick={() => setGuidedStepIndex(i => Math.min(guidedStepCount - 1, i + 1))}
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" className="border-white/15 text-slate-200" onClick={replayGuided}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Replay
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-500/35 text-cyan-100"
            onClick={() => setGuidedStepIndex(guidedStepCount - 1)}
          >
            <FastForward className="mr-1 h-3.5 w-3.5" />
            End
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <p className="text-base font-semibold text-[#d4ffef]">{step.title}</p>
        <p className="mt-2 text-sm text-slate-300">{step.detail}</p>
        {showPresenterNotes ? (
          <p className="mt-3 border-t border-white/10 pt-3 text-xs text-amber-100/90">
            <span className="font-medium text-amber-50">Presenter:</span> {step.presenterNote}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setShowPresenterNotes(!showPresenterNotes)}>
          {showPresenterNotes ? "Hide notes" : "Show notes"}
        </Button>
        <div className="flex flex-1 flex-wrap gap-1">
          {DEMO_GUIDED_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setGuidedStepIndex(i)}
              className={`h-2 flex-1 min-w-[28px] max-w-[52px] rounded-full transition ${
                i === guidedStepIndex
                  ? "bg-[#3bff96] shadow-[0_0_10px_rgba(59,255,150,0.35)]"
                  : i < guidedStepIndex
                    ? "bg-[#3bff96]/40"
                    : "bg-slate-800"
              }`}
              title={s.title}
            />
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-white/15 text-slate-200"
          onClick={() => setGuidedStepIndex(i => (i + 1) % guidedStepCount)}
        >
          <SkipForward className="mr-1 h-3.5 w-3.5" />
          Loop
        </Button>
      </div>
    </DemoPanel>
  );
}

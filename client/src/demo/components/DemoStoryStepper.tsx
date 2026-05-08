import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  CircleDot,
} from "lucide-react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";

/** Interactive demo scrubber — scenario frames, variable cadence, unified beat metadata. */
export function DemoStoryStepper({ presentationMode }: { presentationMode?: boolean }) {
  const {
    runOutcome,
    storyPlaybackIndex,
    setStoryPlaybackIndex,
    storyPlaybackAutoplay,
    setStoryPlaybackAutoplay,
    showPresenterNotes,
    setShowPresenterNotes,
    replayStory,
    storyBeatCount,
    playbackDrivesDemoWallet,
    setPlaybackDrivesDemoWallet,
    activeUnifiedBeat,
    demoSnapshot,
    selectedScenarioId,
  } = useDemo();

  const step = activeUnifiedBeat;
  const rail = demoSnapshot.storySteps;

  return (
    <DemoPanel presentationMode={presentationMode} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#87f7d0]">Demo story controller</p>
          <p className="text-sm font-medium text-white">
            Step {storyPlaybackIndex + 1} / {storyBeatCount} · {selectedScenarioId.replace(/-/g, " ")}
          </p>
          <p className="mt-1 text-[10px] font-mono text-slate-500">
            Outcome rail · {runOutcome} · data posture · {demoSnapshot.derived.dataPosture.replace(/_/g, " ")}
          </p>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
            <input
              type="checkbox"
              checked={playbackDrivesDemoWallet}
              onChange={e => setPlaybackDrivesDemoWallet(e.target.checked)}
              className="rounded border-white/20 bg-black"
            />
            Sync wallet panel with playback
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 text-slate-200"
            onClick={() => setStoryPlaybackAutoplay(!storyPlaybackAutoplay)}
          >
            {storyPlaybackAutoplay ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            {storyPlaybackAutoplay ? "Pause" : "Autoplay"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 text-slate-200"
            onClick={() => setStoryPlaybackIndex(i => Math.max(0, i - 1))}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 text-slate-200"
            onClick={() => setStoryPlaybackIndex(i => Math.min(storyBeatCount - 1, i + 1))}
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" className="border-white/15 text-slate-200" onClick={replayStory}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Restart
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-[#38d7d0]/35 text-[#b5fff8]"
            onClick={() => setStoryPlaybackIndex(storyBeatCount - 1)}
          >
            <FastForward className="mr-1 h-3.5 w-3.5" />
            End
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[#14f195]/25 bg-black/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#14f195]/90">{step.patch.currentStage}</p>
        <p className="mt-2 text-base font-semibold text-[#d4ffef]">{step.title}</p>
        <p className="mt-2 text-sm text-slate-300">{step.detail}</p>
        {demoSnapshot.activeStoryAnnotation ? (
          <p className="mt-2 text-xs text-cyan-100/90">{demoSnapshot.activeStoryAnnotation}</p>
        ) : null}
        {showPresenterNotes ? (
          <p className="mt-3 border-t border-white/10 pt-3 text-xs text-amber-100/90">
            <span className="font-medium text-amber-50">Presenter:</span> {step.presenterNote}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setShowPresenterNotes(!showPresenterNotes)}>
          {showPresenterNotes ? "Hide presenter notes" : "Show presenter notes"}
        </Button>
        <div className="flex flex-1 flex-wrap gap-1">
          {rail.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStoryPlaybackIndex(i)}
              className={`h-2 flex-1 min-w-[24px] max-w-[46px] rounded-full transition ${
                i === storyPlaybackIndex
                  ? "bg-[#3bff96] shadow-[0_0_10px_rgba(59,255,150,0.35)]"
                  : i < storyPlaybackIndex
                    ? "bg-[#3bff96]/35"
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
          onClick={() => setStoryPlaybackIndex(i => (i + 1) % storyBeatCount)}
        >
          <SkipForward className="mr-1 h-3.5 w-3.5" />
          Loop
        </Button>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-[#3bff96]/80 transition-all duration-300"
          style={{ width: `${demoSnapshot.progressPercent}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-600">
        <CircleDot className="h-3 w-3 text-[#38d7d0]" />
        <span>Jump rail follows scenario frames — receipts stay explicit about demo vs verified.</span>
      </div>
    </DemoPanel>
  );
}

import { Button } from "@/components/ui/button";
import { getUnifiedStoryBeats } from "@shared/demoUnifiedStoryPlayback";
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
import { useMemo } from "react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";

/** Unified execution story scrubber · drives stage rail + presenter copy. */
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
  } = useDemo();

  const beats = useMemo(() => getUnifiedStoryBeats(runOutcome), [runOutcome]);
  const step = beats[storyPlaybackIndex] ?? beats[0]!;

  return (
    <DemoPanel presentationMode={presentationMode} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#87f7d0]">Demo story controller</p>
          <p className="text-sm font-medium text-white">
            Beat {storyPlaybackIndex + 1} / {storyBeatCount} · Execution stage rail
          </p>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
            <input
              type="checkbox"
              checked={playbackDrivesDemoWallet}
              onChange={e => setPlaybackDrivesDemoWallet(e.target.checked)}
              className="rounded border-white/20 bg-black"
            />
            Sync wallet indicator with beats
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
            {storyPlaybackAutoplay ? "Pause autoplay" : "Autoplay beats"}
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
            Replay beats
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-[#38d7d0]/35 text-[#b5fff8]"
            onClick={() => setStoryPlaybackIndex(storyBeatCount - 1)}
          >
            <FastForward className="mr-1 h-3.5 w-3.5" />
            Terminal beat
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[#14f195]/25 bg-black/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#14f195]/90">{step.patch.currentStage}</p>
        <p className="mt-2 text-base font-semibold text-[#d4ffef]">{step.title}</p>
        <p className="mt-2 text-sm text-slate-300">{step.detail}</p>
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
          {beats.map((s, i) => (
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
          Loop beats
        </Button>
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-600">
        <CircleDot className="h-3 w-3 text-[#38d7d0]" />
        <span>Jumps sync execution rail + lineage visibility — receipts stay honest about demo anchors.</span>
      </div>
    </DemoPanel>
  );
}

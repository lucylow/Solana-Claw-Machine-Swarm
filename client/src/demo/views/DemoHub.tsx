import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEMO_SCENARIOS } from "@shared/demoFixtures";
import { ArrowRight, LayoutGrid, PlayCircle, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useDemo } from "../DemoProvider";
import { DemoMockModeBanner } from "../components/DemoMockModeBanner";
import { DemoPanel } from "../components/DemoPanel";
import { DemoPreviewPanel } from "../components/DemoPreviewPanel";
import { DemoScenarioCard } from "../components/DemoScenarioCard";

export function DemoHub() {
  const { selectedScenarioId, setSelectedScenarioId, presentationMode } = useDemo();

  const selected = DEMO_SCENARIOS.find(s => s.id === selectedScenarioId)!;

  return (
    <div className="space-y-6">
      <DemoMockModeBanner />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8ceada]">CLAW_MACHINE · demo command center</p>
          <h1 className={cn("mt-2 font-semibold text-white", presentationMode ? "text-4xl" : "text-3xl md:text-4xl")}>
            Interactive mock narrative
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
            A presenter-ready, Solana-default loop: wallet connect, skill discovery, multi-agent execution, reflection,
            durable memory, and receipts anyone can verify on Solana Explorer — without waiting on live chain state.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <DemoPanel className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/demo/full-story">
                <Button className="bg-[#3bff96] text-black hover:bg-[#6bffbc]">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start guided demo
                </Button>
              </Link>
              <Link href="/demo/playground">
                <Button variant="outline" className="border-[#38d7d0]/50 text-[#d4fffb]">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Open playground
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              Guided mode includes autoplay, presenter notes, and step jump. Playground lets you flip success, failure,
              and recovery without leaving the page.
            </p>
          </DemoPanel>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <Sparkles className="h-4 w-4 text-[#3bff96]" />
              Scenarios
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {DEMO_SCENARIOS.map(sc => (
                <DemoScenarioCard
                  key={sc.id}
                  scenario={sc}
                  selected={sc.id === selectedScenarioId}
                  onSelect={() => setSelectedScenarioId(sc.id)}
                  presentationMode={presentationMode}
                />
              ))}
            </div>
          </div>

          <DemoPanel className="space-y-2">
            <h3 className="text-sm font-medium text-white">What you will see · {selected.title}</h3>
            <ul className="space-y-2">
              {selected.whatYouWillSee.map(line => (
                <li key={line} className="flex gap-2 text-sm text-slate-300">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#3bff96]" />
                  {line}
                </li>
              ))}
            </ul>
          </DemoPanel>
        </div>

        <div>
          <DemoPreviewPanel presentationMode={presentationMode} />
          <p className="mt-2 text-center text-[11px] text-slate-600">
            Selecting a scenario updates this preview — open <span className="text-slate-400">Guided full story</span> for
            step-linked highlights.
          </p>
        </div>
      </div>
    </div>
  );
}

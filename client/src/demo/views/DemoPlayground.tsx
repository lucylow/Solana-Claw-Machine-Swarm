import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEMO_SKILLS, getSkillById } from "@shared/demoFixtures";
import { useMemo, useState } from "react";
import { useDemo } from "../DemoProvider";
import { DemoExecutionTimeline } from "../components/DemoExecutionTimeline";
import { DemoMemoryCard } from "../components/DemoMemoryCard";
import { DemoMemoryTimeline } from "../components/DemoMemoryTimeline";
import { DemoMockModeBanner } from "../components/DemoMockModeBanner";
import { DemoOrchestrationFlow } from "../components/DemoOrchestrationFlow";
import { DemoPanel } from "../components/DemoPanel";
import { DemoPlanCard } from "../components/DemoPlanCard";
import { DemoPreviewPanel } from "../components/DemoPreviewPanel";
import { DemoProofPanel } from "../components/DemoProofPanel";
import { DemoReceiptCard } from "../components/DemoReceiptCard";
import { DemoReceiptChain } from "../components/DemoReceiptChain";
import { DemoReflectionCard } from "../components/DemoReflectionCard";
import { DemoReputationPanel } from "../components/DemoReputationPanel";
import { DemoSkillCard } from "../components/DemoSkillCard";
import { DemoErrorState, DemoLoadingState } from "../components/DemoStates";
import { DemoWalletCard } from "../components/DemoWalletCard";
import { DemoIntegrationStrip } from "../components/DemoIntegrationStrip";
import { DemoPlaybackController } from "../components/DemoPlaybackController";

export function DemoPlayground() {
  const {
    runOutcome,
    setRunOutcome,
    selectedSkillId,
    setSelectedSkillId,
    presentationMode,
    setPresentationMode,
    simulateLoading,
    setSimulateLoading,
    forceError,
    setForceError,
    plan,
    agents,
    steps,
    reflection,
    memory,
    receipts,
    memoryTimeline,
    activeSkill,
  } = useDemo();

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"reputation" | "usage">("reputation");
  const [activeOnly, setActiveOnly] = useState(true);

  const filtered = useMemo(() => {
    let list = DEMO_SKILLS.filter(s => {
      const ok =
        !q.trim() ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(q.toLowerCase()));
      const active = !activeOnly || s.status === "active";
      return ok && active;
    });
    list = [...list].sort((a, b) => (sort === "reputation" ? b.reputationScore - a.reputationScore : b.usageCount - a.usageCount));
    return list;
  }, [q, sort, activeOnly]);

  const compareSkill = getSkillById("skill-proof-publisher");

  if (simulateLoading) {
    return <DemoLoadingState presentationMode={presentationMode} label="Loading mock scenario bundle…" />;
  }

  return (
    <div className="space-y-6">
      <DemoMockModeBanner />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={cn("font-semibold text-white", presentationMode ? "text-3xl" : "text-2xl")}>Playground</h1>
          <p className="mt-1 text-sm text-slate-400">Sandbox the full loop: outcomes, skills, receipts, and proofs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1">
            <span className="text-xs text-slate-400">Presentation</span>
            <Switch checked={presentationMode} onCheckedChange={setPresentationMode} />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1">
            <span className="text-xs text-slate-400">Simulate loading</span>
            <Switch checked={simulateLoading} onCheckedChange={setSimulateLoading} />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1">
            <span className="text-xs text-slate-400">Preview error</span>
            <Switch checked={forceError} onCheckedChange={setForceError} />
          </div>
        </div>
      </div>

      {forceError ? (
        <DemoErrorState
          presentationMode={presentationMode}
          title="Preview generation failed (mock)"
          message="Toggle off “Preview error” above to restore the sandbox."
          onRetry={() => setForceError(false)}
        />
      ) : null}

      <DemoPlaybackController presentationMode={presentationMode} />

      <DemoIntegrationStrip presentationMode={presentationMode} />

      <DemoPanel className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Run outcome</span>
        {(["success", "failure", "recovery"] as const).map(o => (
          <Button
            key={o}
            size="sm"
            variant={runOutcome === o ? "default" : "outline"}
            className={runOutcome === o ? "bg-[#3bff96] text-black hover:bg-[#6bffbc]" : "border-white/15 text-slate-200"}
            onClick={() => setRunOutcome(o)}
          >
            {o}
          </Button>
        ))}
      </DemoPanel>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <DemoWalletCard presentationMode={presentationMode} />
          <DemoPanel className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs text-slate-500">Search skills</Label>
                <Input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Name or tag…"
                  className="mt-1 border-white/10 bg-black/40 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Sort</Label>
                <div className="mt-1 flex gap-1">
                  <Button size="sm" variant={sort === "reputation" ? "secondary" : "outline"} onClick={() => setSort("reputation")}>
                    Reputation
                  </Button>
                  <Button size="sm" variant={sort === "usage" ? "secondary" : "outline"} onClick={() => setSort("usage")}>
                    Usage
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={activeOnly} onCheckedChange={setActiveOnly} id="active-only" />
                <Label htmlFor="active-only" className="text-xs text-slate-400">
                  Active only
                </Label>
              </div>
            </div>
            <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filtered.map(s => (
                <DemoSkillCard
                  key={s.id}
                  skill={s}
                  selected={s.id === selectedSkillId}
                  onSelect={() => setSelectedSkillId(s.id)}
                  presentationMode={presentationMode}
                />
              ))}
            </div>
          </DemoPanel>
          <DemoPlanCard plan={plan} presentationMode={presentationMode} />
          <DemoExecutionTimeline steps={steps} presentationMode={presentationMode} />
          <DemoOrchestrationFlow agents={agents} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoReflectionCard reflection={reflection} presentationMode={presentationMode} />
            <DemoMemoryCard memory={memory} presentationMode={presentationMode} />
          </div>
          <DemoMemoryTimeline stages={memoryTimeline} />
          <DemoReceiptChain receipts={receipts} />
          <DemoReputationPanel skill={activeSkill} compare={compareSkill ?? null} />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Receipts</p>
            {receipts.map((r, i) => (
              <DemoReceiptCard key={r.id} receipt={r} defaultOpen={i === receipts.length - 1} />
            ))}
          </div>
          <DemoProofPanel receipt={receipts[receipts.length - 1]} />
        </div>
        <div className="space-y-4">
          <DemoPreviewPanel presentationMode={presentationMode} />
        </div>
      </div>
    </div>
  );
}

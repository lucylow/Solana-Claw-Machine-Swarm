import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_SKILLS, getSkillById } from "@shared/demoFixtures";
import { useMemo, useState, type ReactNode } from "react";
import { useDemo } from "../DemoProvider";
import { DemoExecutionTimeline } from "../components/DemoExecutionTimeline";
import { DemoMemoryCard } from "../components/DemoMemoryCard";
import { DemoMemoryTimeline } from "../components/DemoMemoryTimeline";
import { DemoMockModeBanner } from "../components/DemoMockModeBanner";
import { DemoPlanCard } from "../components/DemoPlanCard";
import { DemoPreviewPanel } from "../components/DemoPreviewPanel";
import { DemoProofPanel } from "../components/DemoProofPanel";
import { DemoReceiptCard } from "../components/DemoReceiptCard";
import { DemoReceiptChain } from "../components/DemoReceiptChain";
import { DemoReflectionCard } from "../components/DemoReflectionCard";
import { DemoReputationPanel } from "../components/DemoReputationPanel";
import { DemoSkillCard } from "../components/DemoSkillCard";
import { DemoWalletCard } from "../components/DemoWalletCard";

function Shell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="space-y-4">
      <DemoMockModeBanner />
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function DemoWalletPage() {
  const { presentationMode } = useDemo();
  return (
    <Shell title="Solana wallet (demo)" subtitle="First action in the loop — connect, balances, explorer, signing state.">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <DemoWalletCard presentationMode={presentationMode} />
        <DemoPreviewPanel presentationMode={presentationMode} />
      </div>
    </Shell>
  );
}

export function DemoSkillsPage() {
  const { presentationMode, selectedSkillId, setSelectedSkillId } = useDemo();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"reputation" | "usage">("reputation");
  const filtered = useMemo(() => {
    const list = DEMO_SKILLS.filter(
      s =>
        !q.trim() ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))
    );
    return [...list].sort((a, b) => (sort === "reputation" ? b.reputationScore - a.reputationScore : b.usageCount - a.usageCount));
  }, [q, sort]);

  return (
    <Shell
      title="Skill discovery"
      subtitle="Search, sort by reputation or usage — each skill is a published capability with Solana-facing metadata."
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#060a10]/95 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Label className="text-xs text-slate-500">Search</Label>
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                className="mt-1 border-white/10 bg-black/40 text-white"
                placeholder="Skill name or tag…"
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
          </div>
          <div className="grid max-h-[560px] gap-2 overflow-y-auto sm:grid-cols-2">
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
        </div>
        <DemoPreviewPanel presentationMode={presentationMode} />
      </div>
    </Shell>
  );
}

export function DemoExecutionPage() {
  const { presentationMode, plan, steps } = useDemo();
  return (
    <Shell title="Plan & execution" subtitle="Durable plan artifact and a live execution rail with active step highlighting.">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <DemoPlanCard plan={plan} presentationMode={presentationMode} />
          <DemoExecutionTimeline steps={steps} presentationMode={presentationMode} />
        </div>
        <DemoPreviewPanel presentationMode={presentationMode} />
      </div>
    </Shell>
  );
}

export function DemoReflectionPage() {
  const { presentationMode, reflection } = useDemo();
  return (
    <Shell title="Reflection" subtitle="Structured post-mortem: root cause, advice, next action, linked memory and Solana receipt.">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <DemoReflectionCard reflection={reflection} presentationMode={presentationMode} />
        <DemoPreviewPanel presentationMode={presentationMode} />
      </div>
    </Shell>
  );
}

export function DemoMemoryPage() {
  const { presentationMode, memory, memoryTimeline } = useDemo();
  return (
    <Shell title="Memory" subtitle="Durable records with storage references, proof links, and lifecycle timeline.">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <DemoMemoryCard memory={memory} presentationMode={presentationMode} />
          <DemoMemoryTimeline stages={memoryTimeline} />
        </div>
        <DemoPreviewPanel presentationMode={presentationMode} />
      </div>
    </Shell>
  );
}

export function DemoReceiptsPage() {
  const { presentationMode, receipts } = useDemo();
  return (
    <Shell title="Receipts & proof" subtitle="Expandable Solana receipts — explorer handoff and verification copy.">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <DemoReceiptChain receipts={receipts} />
          {receipts.map((r, i) => (
            <DemoReceiptCard key={r.id} receipt={r} defaultOpen={i === receipts.length - 1} />
          ))}
          <DemoProofPanel receipt={receipts[receipts.length - 1]} />
        </div>
        <DemoPreviewPanel presentationMode={presentationMode} />
      </div>
    </Shell>
  );
}

export function DemoReputationPage() {
  const { presentationMode, activeSkill } = useDemo();
  const compare = getSkillById("skill-proof-publisher");
  return (
    <Shell title="Reputation" subtitle="Usage-weighted trust signals that reorder discovery on the next run.">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <DemoReputationPanel skill={activeSkill} compare={compare ?? null} />
        <DemoPreviewPanel presentationMode={presentationMode} />
      </div>
    </Shell>
  );
}

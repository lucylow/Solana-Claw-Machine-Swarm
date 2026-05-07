import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DemoStoryStepper,
  EmptyState,
  MemoryArtifactCard,
  OnchainReceiptCard,
  ReflectionCard,
  SolanaStatusBadge,
  StoryLoopStrip,
  buildDemoSteps,
  buildExplorerTxUrl,
} from "@/components/command-center";
import { PlanReceiptCard } from "@/components/PlanReceiptCard";
import { CheckCircle2, Link2, Sparkles, Workflow, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getPlanTimeline, listPlans } from "@/plans/planClient";
import type {
  MemoryLifecycleEvent,
  MemoryReceiptOnChain,
  MemoryTurnLink,
  ReflectionRecordOffchain,
} from "@shared/memoryReceipts";
import type { ReflectionState } from "@shared/commandCenter";
import type { PlanReceipt, PlanTimelineEvent } from "@shared/planReceipts";
import { SOLANA_COPY } from "@shared/copy";
import { useLocation } from "wouter";

type ReflectionItem = {
  reflection: ReflectionRecordOffchain;
  receipt: MemoryReceiptOnChain | null;
};

type ChainResponse = {
  reflection: ReflectionRecordOffchain;
  receipt: MemoryReceiptOnChain | null;
  parentReceipt: MemoryReceiptOnChain | null;
  links: MemoryTurnLink[];
};

function shortHash(value?: string | null, size = 18) {
  if (!value) return "n/a";
  return value.length <= size ? value : `${value.slice(0, size)}...`;
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = (await res.json()) as { ok: boolean; data?: T; error?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data.data as T;
}

export default function ReceiptsPage() {
  const { loading } = useAuth();
  const [, setLocation] = useLocation();
  const [agentIdFilter, setAgentIdFilter] = useState("agent_demo");
  const [items, setItems] = useState<ReflectionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<MemoryLifecycleEvent[]>([]);
  const [chain, setChain] = useState<ChainResponse | null>(null);
  const [plans, setPlans] = useState<PlanReceipt[]>([]);
  const [activePlanTimeline, setActivePlanTimeline] = useState<PlanTimelineEvent[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    agentId: "agent_demo",
    conversationId: "demo-conversation",
    wallet: "demo_wallet",
    sourceTurnId: `turn_${Date.now()}`,
    kind: "failure",
    title: "Tool invocation failed",
    summary: "A failed turn produced a reflection and should anchor proof.",
    fullText:
      "The tool invocation failed because the required input schema was assumed instead of validated. The full reflection is persisted off-chain and the compact proof should be anchored on Solana.",
    rootCause: "Tool schema assumptions were incorrect.",
    correctiveAdvice: "Always load and validate the tool descriptor before execution.",
    nextAction: "Inject schema-first checklist into the next turn.",
    tags: "failure,schema,lesson",
  });

  const selected = useMemo(() => items.find(item => item.reflection.id === selectedId) || null, [items, selectedId]);

  const loadList = useCallback(async () => {
    setBusy(true);
    try {
      const data = await fetchJSON<{ items: ReflectionItem[] }>("/api/memory/reflections");
      setItems(data.items);
      if (!selectedId && data.items[0]) setSelectedId(data.items[0].reflection.id);
    } finally {
      setBusy(false);
    }
  }, [selectedId]);

  const loadPlans = useCallback(async () => {
    try {
      const nextPlans = await listPlans();
      setPlans(nextPlans);
    } catch (error) {
      console.error("Failed to load plans:", error);
    }
  }, []);

  const loadChain = useCallback(async (id: string) => {
    const [nextChain, nextTimeline] = await Promise.all([
      fetchJSON<ChainResponse>(`/api/memory/reflections/${id}/chain`),
      fetchJSON<MemoryLifecycleEvent[]>(`/api/memory/reflections/${id}/timeline`),
    ]);
    setChain(nextChain);
    setTimeline(nextTimeline);
  }, []);

  useEffect(() => {
    loadList().catch(console.error);
  }, [loadList]);

  useEffect(() => {
    loadPlans().catch(console.error);
  }, [loadPlans]);

  useEffect(() => {
    if (!selectedId) return;
    loadChain(selectedId).catch(console.error);
  }, [loadChain, selectedId]);

  const runDemo = async () => {
    setBusy(true);
    try {
      await fetchJSON("/api/memory/demo/run", {
        method: "POST",
        body: JSON.stringify({
          agentId: agentIdFilter || "agent_demo",
          conversationId: "demo-conversation",
          wallet: "demo_wallet",
        }),
      });
      await loadList();
    } finally {
      setBusy(false);
    }
  };

  const runPlanDemo = async () => {
    setBusy(true);
    try {
      await fetchJSON("/api/plans/demo/run", {
        method: "POST",
        body: JSON.stringify({
          agentId: agentIdFilter || "agent_demo",
          wallet: "demo_wallet",
        }),
      });
      await loadPlans();
    } finally {
      setBusy(false);
    }
  };

  const createReflection = async () => {
    setBusy(true);
    try {
      await fetchJSON("/api/memory/reflections", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map(x => x.trim())
            .filter(Boolean),
          autoAnchor: true,
          autoVerify: false,
        }),
      });
      await loadList();
    } finally {
      setBusy(false);
    }
  };

  const verifySelected = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await fetchJSON(`/api/memory/reflections/${selected.reflection.id}/verify`, { method: "POST" });
      await loadList();
      await loadChain(selected.reflection.id);
    } finally {
      setBusy(false);
    }
  };

  const injectNextTurn = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await fetchJSON("/api/memory/injection-bundle", {
        method: "POST",
        body: JSON.stringify({
          agentId: selected.reflection.agentId,
          conversationId: selected.reflection.conversationId,
          wallet: selected.receipt?.wallet,
          nextTurnId: `turn_next_${Date.now()}`,
          maxItems: 3,
        }),
      });
      await loadList();
      await loadChain(selected.reflection.id);
    } finally {
      setBusy(false);
    }
  };

  const openPlanDetails = async (planId: string) => {
    setActivePlanId(planId);
    try {
      const events = await getPlanTimeline(planId);
      setActivePlanTimeline(events);
    } catch (error) {
      console.error("Failed to load plan timeline:", error);
      setActivePlanTimeline([]);
    }
  };

  const filteredItems = useMemo(() => {
    if (!agentIdFilter.trim()) return items;
    return items.filter(item => item.reflection.agentId.includes(agentIdFilter.trim()));
  }, [agentIdFilter, items]);

  const selectedReflectionState: ReflectionState | null = selected
    ? {
        id: selected.reflection.id,
        sourceTurnId: selected.reflection.sourceTurnId,
        outcome: selected.reflection.kind,
        rootCause: selected.reflection.rootCause,
        correctiveAdvice: selected.reflection.correctiveAdvice,
        nextAction: selected.reflection.nextAction,
        storedAsMemory: Boolean(selected.reflection.storageRef),
        anchored: Boolean(selected.receipt?.solanaTxSig),
        injectedNextTurn: Boolean(chain?.receipt?.nextTurnIdHash),
      }
    : null;

  const demoSteps = buildDemoSteps();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-300">Loading Solana memory and receipt trail…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      <header className="border-b border-slate-800 bg-black/70 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Workflow className="w-7 h-7 text-[#6dffb3]" />
            <h1 className="text-2xl font-semibold text-[#d6ffea]">Reflection, Memory, and Receipt Trail</h1>
            <SolanaStatusBadge label="Solana proof view" active />
          </div>
          <div className="flex gap-2">
            <Button onClick={runDemo} className="bg-[#6dffb3] text-black hover:bg-[#7fffbe]" disabled={busy}>
              <Sparkles className="w-4 h-4 mr-2" />
              Memory Demo
            </Button>
            <Button onClick={runPlanDemo} className="bg-cyan-500 text-black hover:bg-cyan-400" disabled={busy}>
              <Workflow className="w-4 h-4 mr-2" />
              Planner Demo
            </Button>
            <Button onClick={() => setLocation("/dashboard")} variant="outline" className="border-[#3bff96]/60">
              {SOLANA_COPY.navigation.backCommandCenter}
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6">
        <StoryLoopStrip activeStep={5} />

        <Card className="bg-[#07140f] border-[#2af08b]/30 p-5">
          <p className="text-sm text-slate-300">
            Full reflections are stored off-chain. Compact hashes, turn links, wallet proofs, and tx references are anchored on Solana.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge className="bg-[#153827] border-[#2af08b]/40">Reflection stored</Badge>
            <Badge className="bg-[#153827] border-[#2af08b]/40">Receipt anchored on Solana</Badge>
            <Badge className="bg-[#153827] border-[#2af08b]/40">Injected into next turn</Badge>
            <Badge className="bg-[#153827] border-[#2af08b]/40">Lesson verified</Badge>
          </div>
        </Card>

        <Card className="bg-[#07140f] border-[#2af08b]/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#6dffb3]">Planner receipt lifecycle</h2>
              <p className="text-xs text-slate-400 mt-1">
                goal → breakdown → execution → result → memory
              </p>
            </div>
            <Badge className="bg-[#153827] border-[#2af08b]/40">durable plan artifacts</Badge>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {plans.slice(0, 4).map(plan => (
              <PlanReceiptCard
                key={plan.id}
                plan={plan}
                onOpenDetails={async (planId) => {
                  await openPlanDetails(planId);
                  setLocation(`/plans/${planId}`);
                }}
              />
            ))}
            {plans.length === 0 ? (
              <div className="text-xs text-slate-500">
                No planner receipts yet. Create one with `POST /api/plans/receipt` and this timeline will render immediately.
              </div>
            ) : null}
          </div>
          {activePlanId && activePlanTimeline.length > 0 ? (
            <div className="mt-3 rounded border border-[#2af08b]/30 bg-black/40 p-2 text-xs text-slate-300">
              Active plan timeline loaded ({activePlanTimeline.length} events) for {activePlanId}.
            </div>
          ) : null}
        </Card>

        <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <Card className="bg-black/60 border-cyan-500/30 p-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-slate-400">Filter by agent</label>
                  <input
                    value={agentIdFilter}
                    onChange={e => setAgentIdFilter(e.target.value)}
                    className="mt-1 w-full bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-sm"
                  />
                </div>
                <Button variant="outline" className="border-cyan-500/40" onClick={() => loadList()} disabled={busy}>
                  Refresh
                </Button>
              </div>
            </Card>

            <Card className="bg-black/60 border-purple-500/30 p-4">
              <h3 className="text-purple-300 font-semibold mb-3">Create Reflection + Anchor Receipt</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  value={form.agentId}
                  onChange={e => setForm(prev => ({ ...prev, agentId: e.target.value }))}
                  placeholder="agentId"
                  className="bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <select
                  value={form.kind}
                  onChange={e => setForm(prev => ({ ...prev, kind: e.target.value }))}
                  className="bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                >
                  <option value="failure">failure</option>
                  <option value="success">success</option>
                  <option value="retry">retry</option>
                  <option value="correction">correction</option>
                  <option value="lesson">lesson</option>
                </select>
                <input
                  value={form.sourceTurnId}
                  onChange={e => setForm(prev => ({ ...prev, sourceTurnId: e.target.value }))}
                  placeholder="sourceTurnId"
                  className="bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <input
                  value={form.wallet}
                  onChange={e => setForm(prev => ({ ...prev, wallet: e.target.value }))}
                  placeholder="wallet"
                  className="bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="title"
                  className="md:col-span-2 bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <textarea
                  value={form.summary}
                  onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="summary"
                  rows={2}
                  className="md:col-span-2 bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <textarea
                  value={form.rootCause}
                  onChange={e => setForm(prev => ({ ...prev, rootCause: e.target.value }))}
                  placeholder="root cause"
                  rows={2}
                  className="bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <textarea
                  value={form.correctiveAdvice}
                  onChange={e => setForm(prev => ({ ...prev, correctiveAdvice: e.target.value }))}
                  placeholder="corrective advice"
                  rows={2}
                  className="bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <textarea
                  value={form.nextAction}
                  onChange={e => setForm(prev => ({ ...prev, nextAction: e.target.value }))}
                  placeholder="next action"
                  rows={2}
                  className="md:col-span-2 bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <textarea
                  value={form.fullText}
                  onChange={e => setForm(prev => ({ ...prev, fullText: e.target.value }))}
                  placeholder="full reflection text"
                  rows={3}
                  className="md:col-span-2 bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
                <input
                  value={form.tags}
                  onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="tags comma-separated"
                  className="md:col-span-2 bg-black/60 border border-purple-500/30 rounded px-3 py-2 text-sm"
                />
              </div>
              <Button className="mt-3 bg-purple-600 hover:bg-purple-700" onClick={createReflection} disabled={busy}>
                <Zap className="w-4 h-4 mr-2" />
                Reflection Stored + Receipt Anchored
              </Button>
            </Card>

            <div className="space-y-3">
              {filteredItems.map(item => (
                <Card
                  key={item.reflection.id}
                  className={`cursor-pointer p-4 border ${
                    selectedId === item.reflection.id
                      ? "border-[#3bff96] bg-[#0e2319]"
                      : "border-cyan-500/20 bg-black/50"
                  }`}
                  onClick={() => setSelectedId(item.reflection.id)}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-300">{item.reflection.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.reflection.sourceTurnId}</div>
                    </div>
                    <Badge
                      className={
                        item.receipt?.verified
                          ? "bg-[#153827] text-[#6dffb3] border-[#3bff96]"
                          : "bg-slate-800 text-slate-200 border-slate-600"
                      }
                    >
                      {item.receipt?.status || "stored"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{item.reflection.summary}</div>
                </Card>
              ))}
              {!filteredItems.length ? (
                <EmptyState title="No reflections yet" message="Run memory demo or create a reflection to start the timeline." />
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="bg-black/60 border-[#3bff96]/30 p-4">
              <div className="flex justify-between">
                <h3 className="text-[#6dffb3] font-semibold">Proof controls</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={verifySelected} disabled={!selected || busy}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                  <Button size="sm" variant="outline" onClick={injectNextTurn} disabled={!selected || busy}>
                    <Link2 className="w-4 h-4 mr-1" />
                    Inject
                  </Button>
                </div>
              </div>
              {!selected || !selectedReflectionState ? (
                <p className="text-sm text-slate-400 mt-2">Select a reflection to inspect its chain.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <ReflectionCard reflection={selectedReflectionState} record={selected.reflection} receipt={selected.receipt} />
                  <OnchainReceiptCard
                    receipt={{
                      id: selected.receipt?.id,
                      createdAt: selected.reflection.createdAt,
                      wallet: selected.receipt?.wallet,
                      summaryHash: selected.receipt?.summaryHash,
                      txSignature: selected.receipt?.solanaTxSig,
                      verified: selected.receipt?.verified,
                      storageRef: selected.reflection.storageRef,
                    }}
                    explorerUrl={buildExplorerTxUrl(selected.receipt?.solanaTxSig)}
                  />
                </div>
              )}
            </Card>

            <Card className="bg-black/60 border-cyan-500/30 p-4">
              <h3 className="text-cyan-300 font-semibold">Memory Timeline</h3>
              <div className="mt-3 space-y-2">
                {timeline.map(event => (
                  <div key={event.id} className="rounded border border-cyan-500/20 bg-black/40 p-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-cyan-200">{event.kind.replace(/_/g, " ")}</span>
                      <span className="text-slate-500">{new Date(event.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{event.message}</p>
                  </div>
                ))}
                {!timeline.length ? <p className="text-xs text-slate-500">Timeline will appear after selection.</p> : null}
              </div>
            </Card>

            {selected ? (
              <MemoryArtifactCard
                memory={{
                  id: selected.reflection.id,
                  summary: selected.reflection.summary,
                  kind: selected.reflection.kind,
                  createdAt: selected.reflection.createdAt,
                  sourceTurnId: selected.reflection.sourceTurnId,
                  correctiveAdvice: selected.reflection.correctiveAdvice,
                }}
                timeline={timeline}
              />
            ) : null}

            <Card className="bg-black/60 border-emerald-500/30 p-4">
              <h3 className="text-emerald-300 font-semibold">Chain links</h3>
              <div className="mt-2 space-y-2 text-xs">
                <p>Source turn: {chain?.reflection.sourceTurnId || "n/a"}</p>
                <p>Parent receipt: {chain?.parentReceipt?.id || "none"}</p>
                <p>Linked next turn hash: {shortHash(chain?.receipt?.nextTurnIdHash, 30)}</p>
                <p>Link records: {chain?.links.length || 0}</p>
              </div>
            </Card>

            <Card className="bg-black/60 border-slate-700 p-4">
              <h3 className="text-slate-200 font-semibold">Demo guide</h3>
              <div className="mt-3">
                <DemoStoryStepper steps={demoSteps} />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

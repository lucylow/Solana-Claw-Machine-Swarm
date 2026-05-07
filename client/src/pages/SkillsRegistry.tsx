import { useAuth } from "@/_core/hooks/useAuth";
import {
  CommandCenterPanel,
  EmptyState,
  ErrorState,
  LiveStateBanner,
  LoadingSkeleton,
  SkillAssetCard,
  SolanaStatusBadge,
  StoryLoopStrip,
} from "@/components/command-center";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { trpc } from "@/lib/trpc";
import { SOLANA_CLUSTER } from "@/solana/constants";
import { SOLANA_COPY } from "@shared/copy";
import type { OpenClawBridgeReceipt } from "@shared/openclaw/types";
import type { SkillAsset, SkillStatus } from "@shared/skills";
import { CheckCircle2, Link2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function SkillsRegistry() {
  const { user, loading } = useAuth();
  const wallet = useSolanaWallet();
  const [, setLocation] = useLocation();
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SkillStatus | "all">("all");
  const [sortBy, setSortBy] = useState<
    "latest_published" | "most_used" | "highest_reputation" | "success_rate" | "alphabetical"
  >("latest_published");
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillTags, setSkillTags] = useState("");
  const [authorWallet, setAuthorWallet] = useState("");
  const [bridgeReceipts, setBridgeReceipts] = useState<OpenClawBridgeReceipt[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<"verified" | "degraded" | "unavailable">("verified");
  const utils = trpc.useUtils();

  const queryInput = useMemo(
    () => ({
      search: search.trim() || undefined,
      status,
      sortBy,
    }),
    [search, status, sortBy]
  );

  const { data: skills, isLoading: skillsLoading } = trpc.skills.list.useQuery(queryInput, {
    enabled: !!user,
  });
  const { data: skillsHealth } = trpc.skills.health.useQuery(undefined, {
    enabled: !!user,
  });
  const publishSkillMutation = trpc.skills.publish.useMutation();
  const activateMutation = trpc.skills.activate.useMutation();
  const pauseMutation = trpc.skills.pause.useMutation();
  const deprecateMutation = trpc.skills.deprecate.useMutation();
  const verifyMutation = trpc.skills.verify.useMutation();

  const invalidateSkills = async () => {
    await Promise.all([utils.skills.list.invalidate(), utils.skills.health.invalidate()]);
  };

  useEffect(() => {
    if (wallet.walletAddress) {
      setAuthorWallet(prev => prev || wallet.walletAddress || "");
    }
  }, [wallet.walletAddress]);

  useEffect(() => {
    const loadBridgeState = async () => {
      const [statusRes, receiptsRes] = await Promise.all([
        fetch("/api/openclaw/status").then(r => r.json()),
        fetch("/api/openclaw/receipts").then(r => r.json()),
      ]);
      if (statusRes?.ok) setBridgeStatus(statusRes.data.status);
      if (receiptsRes?.ok) setBridgeReceipts(receiptsRes.data as OpenClawBridgeReceipt[]);
    };
    loadBridgeState().catch(() => undefined);
  }, []);

  const handleCreateSkill = async () => {
    if (!skillName || !authorWallet) return;
    try {
      await publishSkillMutation.mutateAsync({
        name: skillName,
        description: skillDesc,
        tags: skillTags
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean),
        authorWallet,
        status: "published",
      });
      await invalidateSkills();
      setSkillName("");
      setSkillDesc("");
      setSkillTags("");
      setShowCreateSkill(false);
    } catch (err) {
      console.error("Failed to publish skill:", err);
    }
  };

  const handleImportOpenClaw = async () => {
    if (!wallet.walletAddress) return;
    await fetch("/api/openclaw/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: wallet.walletAddress,
        manifest: {
          manifestVersion: "1.0",
          skillId: `openclaw-import-${Date.now()}`,
          name: "Imported OpenClaw Skill",
          description: "Imported through OpenClaw bridge",
          authorWallet: wallet.walletAddress,
          version: "1.0.0",
          tags: ["openclaw", "import"],
          tools: [],
          contentHash: `hash_${Date.now()}`,
          provenanceHash: `prov_${Date.now()}`,
          createdAt: Date.now(),
        },
      }),
    });
    const receiptsRes = await fetch("/api/openclaw/receipts").then(r => r.json());
    if (receiptsRes?.ok) setBridgeReceipts(receiptsRes.data as OpenClawBridgeReceipt[]);
  };

  const handleExportOpenClaw = async (skill: SkillAsset) => {
    await fetch("/api/openclaw/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skill: {
          skillId: skill.id,
          name: skill.name,
          description: skill.description,
          authorWallet: skill.authorWallet || wallet.walletAddress || "unknown_wallet",
          version: skill.currentVersion,
          tags: skill.tags,
          contentHash: skill.contentHash || `hash_${skill.id}`,
        },
      }),
    });
    const receiptsRes = await fetch("/api/openclaw/receipts").then(r => r.json());
    if (receiptsRes?.ok) setBridgeReceipts(receiptsRes.data as OpenClawBridgeReceipt[]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="mx-auto max-w-6xl">
          <LoadingSkeleton label="Loading Solana skill assets..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      <header className="border-b border-slate-800 bg-black/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-7 w-7 text-cyan-500" />
            <h1 className="text-2xl font-semibold text-cyan-200">{SOLANA_COPY.skillRegistry.publishConsoleTitle}</h1>
            <SolanaStatusBadge label={`Solana ${SOLANA_CLUSTER}`} active />
          </div>
          <Button onClick={() => setLocation("/dashboard")} variant="outline" className="border-cyan-500/40 text-cyan-200">
            {SOLANA_COPY.skillRegistry.backLabel}
          </Button>
        </div>
      </header>

      <main className="container space-y-6 py-8">
        <CommandCenterPanel
          title="Published skill assets"
          subtitle="Skills are Solana-backed capability assets with version lineage and proof."
        >
          <p className="mb-4 text-sm text-gray-400">
            Every publish creates immutable provenance with content hash, version account, and author wallet.
          </p>
          <div className="mb-3 rounded border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200">
            OpenClaw bridge: {bridgeStatus} · latest receipt: {bridgeReceipts[0]?.id || "none"}
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded bg-black/30 p-3">
              <p className="text-gray-500">Registry health</p>
              <p className="flex items-center gap-2 font-bold text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                {skillsHealth?.chain === "degraded" ? "Degraded (fallback mode)" : "Connected"}
              </p>
            </div>
            <div className="rounded bg-black/30 p-3">
              <p className="text-gray-500">Published skills</p>
              <p className="font-bold text-cyan-400">{skills?.length || 0}</p>
            </div>
            <div className="rounded bg-black/30 p-3">
              <p className="text-gray-500">Backend mode</p>
              <p className="font-bold text-cyan-400">{skillsHealth?.mode || "unknown"}</p>
            </div>
          </div>
          <div className="mt-4">
            <StoryLoopStrip activeStep={1} />
          </div>
        </CommandCenterPanel>

        <LiveStateBanner
          state={skillsHealth?.chain === "degraded" ? "read-only" : "ready"}
          message={
            skillsHealth?.chain === "degraded"
              ? "Cluster degraded. Browse registry in read-only mode."
              : "Ready to publish and verify Solana skill assets."
          }
        />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-cyan-200">Skill asset registry</h2>
          <div className="flex gap-2">
            <Button onClick={handleImportOpenClaw} variant="outline" className="border-cyan-500/40 text-cyan-200">
              Import OpenClaw
            </Button>
            <Button onClick={() => setShowCreateSkill(true)} className="bg-[#3bff96] text-black hover:bg-[#62ffb4]">
              <Plus className="mr-2 h-4 w-4" />
              Publish skill
            </Button>
          </div>
        </div>

        <Card className="border-slate-800 bg-black/50 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, tag, author wallet, hash"
              className="w-full rounded border border-cyan-500/30 bg-black/50 px-3 py-2 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
            />
            <select
              value={status}
              onChange={e => setStatus(e.target.value as SkillStatus | "all")}
              className="rounded border border-cyan-500/30 bg-black/50 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="deprecated">Deprecated</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="rounded border border-cyan-500/30 bg-black/50 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="latest_published">Latest published</option>
              <option value="most_used">Most used</option>
              <option value="highest_reputation">Highest reputation</option>
              <option value="success_rate">Success rate</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </Card>

        {skillsLoading ? (
          <LoadingSkeleton label="Loading skill assets..." />
        ) : skills && skills.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {skills.map(skill => (
              <div key={skill.id} className="space-y-2">
                <SkillAssetCard
                  skill={skill as SkillAsset}
                  onRun={selected => setLocation(`/skills/${selected.id}`)}
                  onPublish={async selected => {
                    if (selected.status !== "active") {
                      await activateMutation.mutateAsync({ id: selected.id });
                      await invalidateSkills();
                    }
                  }}
                  onVerify={async selected => {
                    await verifyMutation.mutateAsync({ id: selected.id });
                    await invalidateSkills();
                  }}
                />
                <div className="flex flex-wrap gap-2 px-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/40 text-cyan-200"
                    onClick={() => handleExportOpenClaw(skill as SkillAsset)}
                  >
                    Export OpenClaw
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/40 text-cyan-200"
                    onClick={() => setLocation(`/skills/${skill.id}`)}
                  >
                    Inspect history
                  </Button>
                  {skill.status !== "active" ? (
                    <Button
                      size="sm"
                      className="bg-[#3bff96] text-black hover:bg-[#62ffb4]"
                      onClick={async () => {
                        await activateMutation.mutateAsync({ id: skill.id });
                        await invalidateSkills();
                      }}
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-500 text-yellow-300"
                      onClick={async () => {
                        await pauseMutation.mutateAsync({ id: skill.id });
                        await invalidateSkills();
                      }}
                    >
                      Pause
                    </Button>
                  )}
                  {skill.status !== "deprecated" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-200"
                      onClick={async () => {
                        await deprecateMutation.mutateAsync({ id: skill.id });
                        await invalidateSkills();
                      }}
                    >
                      Deprecate
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No skills found"
            message="Publish a Solana skill asset to start the execution loop."
            action={
              <Button onClick={() => setShowCreateSkill(true)} className="bg-[#3bff96] text-black hover:bg-[#62ffb4]">
                Publish skill
              </Button>
            }
          />
        )}

        {showCreateSkill ? (
          <Card className="border-slate-800 bg-black/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-cyan-300">Publish new skill asset</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Name</label>
                <input
                  type="text"
                  value={skillName}
                  onChange={e => setSkillName(e.target.value)}
                  placeholder="e.g., policy-gated-planner"
                  className="w-full rounded border border-cyan-500/30 bg-black/50 px-3 py-2 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Description</label>
                <textarea
                  value={skillDesc}
                  onChange={e => setSkillDesc(e.target.value)}
                  placeholder="Describe what this skill does..."
                  rows={3}
                  className="w-full rounded border border-cyan-500/30 bg-black/50 px-3 py-2 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Tags</label>
                <input
                  type="text"
                  value={skillTags}
                  onChange={e => setSkillTags(e.target.value)}
                  placeholder="planner, memory, policy"
                  className="w-full rounded border border-cyan-500/30 bg-black/50 px-3 py-2 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Author wallet</label>
                <input
                  type="text"
                  value={authorWallet}
                  onChange={e => setAuthorWallet(e.target.value)}
                  placeholder="Enter publishing wallet"
                  className="w-full rounded border border-cyan-500/30 bg-black/50 px-3 py-2 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateSkill}
                  disabled={publishSkillMutation.isPending}
                  className="bg-[#3bff96] text-black hover:bg-[#62ffb4]"
                >
                  {publishSkillMutation.isPending ? "Publishing..." : "Publish"}
                </Button>
                <Button onClick={() => setShowCreateSkill(false)} variant="outline" className="border-slate-700 text-slate-200">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {publishSkillMutation.error ? (
          <ErrorState
            title="Publish failed"
            message={publishSkillMutation.error.message}
            onRetry={handleCreateSkill}
          />
        ) : null}
      </main>
    </div>
  );
}

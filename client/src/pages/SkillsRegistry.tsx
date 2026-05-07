import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { SkillStatus } from "@shared/skills";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Link2, Plus, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

export default function SkillsRegistry() {
  const { user, loading } = useAuth();
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
    await Promise.all([
      utils.skills.list.invalidate(),
      utils.skills.health.invalidate(),
    ]);
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Zap className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="mt-4 text-cyan-400">Loading on-chain skill assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link2 className="w-8 h-8 text-cyan-500" />
            <h1 className="text-2xl font-bold text-cyan-400">CLAW Skills Registry</h1>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-cyan-500 text-cyan-400"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info Section */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 p-8 mb-8">
          <h2 className="text-2xl font-bold text-cyan-300 mb-4">Published Agent Capabilities</h2>
          <p className="text-gray-400 mb-4">
            Skills are now Solana-backed, versioned assets. Every publish creates immutable
            provenance with content hash, version account, and author wallet.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Registry Health</p>
              <p className="text-green-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {skillsHealth?.chain === "degraded" ? "Degraded (fallback mode)" : "Connected"}
              </p>
            </div>
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Published Skills</p>
              <p className="text-cyan-400 font-bold">{skills?.length || 0}</p>
            </div>
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Backend Mode</p>
              <p className="text-cyan-400 font-bold">{skillsHealth?.mode || "unknown"}</p>
            </div>
          </div>
        </Card>

        {/* Skills Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Your CLAW Skills</h2>
          <Button
            onClick={() => setShowCreateSkill(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Skill
          </Button>
        </div>

        <Card className="bg-black/50 border-cyan-500/30 p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, tag, author wallet, hash"
              className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SkillStatus | "all")}
              className="bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
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
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
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
          <Card className="bg-black/50 border-cyan-500/30 p-8 text-center">
            <p className="text-gray-400">Loading skills...</p>
          </Card>
        ) : skills && skills.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {skills.map((skill) => (
              <Card
                key={skill.id}
                className={`bg-[#0a0a0c] transition p-6 ${
                  skill.status === "active"
                    ? "border border-[#3bff96]/60 hover:border-[#3bff96]"
                    : skill.status === "deprecated"
                      ? "border border-gray-600/60 hover:border-gray-500"
                      : "border border-cyan-500/30 hover:border-cyan-500/60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-cyan-300">{skill.name}</h3>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        skill.status === "active"
                          ? "bg-[#3bff96]/20 text-[#86ffc1]"
                          : skill.status === "deprecated"
                            ? "bg-gray-500/20 text-gray-300"
                            : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      {skill.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  {skill.description || "No description"}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-black/30 rounded p-2">
                    <p className="text-gray-500">Published by</p>
                    <p className="text-cyan-300 truncate">{skill.authorWallet}</p>
                  </div>
                  <div className="bg-black/30 rounded p-2">
                    <p className="text-gray-500">Current version</p>
                    <p className="text-cyan-300">{skill.currentVersion}</p>
                  </div>
                  <div className="bg-black/30 rounded p-2">
                    <p className="text-gray-500">Last used</p>
                    <p className="text-cyan-300">
                      {skill.lastUsedAt ? new Date(skill.lastUsedAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded p-2">
                    <p className="text-gray-500">Success rate</p>
                    <p className="text-cyan-300">{skill.successRate}%</p>
                  </div>
                  <div className="bg-black/30 rounded p-2">
                    <p className="text-gray-500">Usage</p>
                    <p className="text-cyan-300">{skill.usageCount}</p>
                  </div>
                  <div className="bg-black/30 rounded p-2">
                    <p className="text-gray-500">Reputation</p>
                    <p className="text-cyan-300">{skill.reputationScore}</p>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {skill.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-cyan-700/70 text-cyan-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-gray-400 mb-4">
                  <span>Hash: {skill.contentHash.slice(0, 10)}...{skill.contentHash.slice(-8)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-700/70 text-cyan-200 h-7"
                    onClick={() => copy(skill.contentHash)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Link href={`/skills/${skill.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-500 text-cyan-400 text-xs"
                    >
                      View Details
                    </Button>
                  </Link>
                  {skill.explorerUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-500 text-cyan-400 text-xs"
                      onClick={() => window.open(skill.explorerUrl, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Explorer
                    </Button>
                  ) : null}
                </div>
                <div className="mt-3 flex gap-2">
                  {skill.status !== "active" ? (
                    <Button
                      size="sm"
                      className="bg-[#3bff96] hover:bg-[#5dffac] text-black"
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
                      className="border-gray-500 text-gray-300"
                      onClick={async () => {
                        await deprecateMutation.mutateAsync({ id: skill.id });
                        await invalidateSkills();
                      }}
                    >
                      Deprecate
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-700 text-cyan-300"
                    onClick={async () => {
                      await verifyMutation.mutateAsync({ id: skill.id });
                      await invalidateSkills();
                    }}
                  >
                    Verify
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-black/50 border-cyan-500/30 p-8 text-center mb-8">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No skills yet. Publish one to get started.</p>
          </Card>
        )}

        {/* Create Skill Form */}
        {showCreateSkill && (
          <Card className="bg-black/50 border-cyan-500/30 p-6 mb-8">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">
              Create New CLAW Skill
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., policy-gated-planner"
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                  placeholder="Describe what this skill does..."
                  rows={3}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillTags}
                  onChange={(e) => setSkillTags(e.target.value)}
                  placeholder="planner, memory, policy"
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Author Wallet
                </label>
                <input
                  type="text"
                  value={authorWallet}
                  onChange={(e) => setAuthorWallet(e.target.value)}
                  placeholder="Enter publishing wallet"
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateSkill}
                  disabled={publishSkillMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
                >
                  {publishSkillMutation.isPending ? "Publishing..." : "Publish"}
                </Button>
                <Button
                  onClick={() => setShowCreateSkill(false)}
                  variant="outline"
                  className="border-cyan-500 text-cyan-400"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-black/50 border-cyan-500/30 p-8">
          <h3 className="text-xl font-bold text-cyan-300 mb-4">Verification & Provenance</h3>
          <p className="text-gray-400 mb-6">
            Every skill points to a current immutable version account. Open a skill to inspect full
            lineage, compare revisions, and verify hashes.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 justify-start"
              onClick={() => setLocation("/receipts")}
            >
              <Link2 className="w-4 h-4 mr-2" />
              View Receipts
            </Button>
            <Button
              className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 justify-start"
              onClick={() => setShowCreateSkill(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Publish New Versioned Skill
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

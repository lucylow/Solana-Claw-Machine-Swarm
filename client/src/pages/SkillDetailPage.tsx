import { useAuth } from "@/_core/hooks/useAuth";
import {
  LoadingSkeleton,
  SkillAssetTimeline,
  SolanaStatusBadge,
  StoryLoopStrip,
} from "@/components/command-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  GitCompare,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";

export default function SkillDetailPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/skills/:id");
  const skillId = match ? params.id : "";
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  const { data: skill, isLoading } = trpc.skills.byId.useQuery(
    { id: skillId },
    { enabled: !!user && Boolean(skillId) },
  );
  const { data: versions } = trpc.skills.versions.useQuery(
    { id: skillId },
    { enabled: !!user && Boolean(skillId) },
  );
  const verifyMutation = trpc.skills.verify.useMutation();

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="mx-auto max-w-5xl">
          <LoadingSkeleton label="Loading skill provenance..." />
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-gray-300">Skill not found.</p>
        <Button className="mt-4" onClick={() => setLocation("/skills")}>
          Back to Skills
        </Button>
      </div>
    );
  }

  const currentVersion = versions?.find(
    (version) => version.version === skill.currentVersion,
  );
  const previousVersion = compareVersionId
    ? versions?.find((version) => version.id === compareVersionId)
    : versions?.find(
        (version) => version.versionAccount === skill.previousVersionAccount,
      );

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      <header className="border-b border-cyan-500/30 bg-black/80">
        <div className="container flex items-center justify-between py-4">
          <Button
            variant="outline"
            className="border-cyan-500 text-cyan-300"
            onClick={() => setLocation("/skills")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="border border-cyan-500/60 text-cyan-300 bg-cyan-500/10">
              Current version {skill.currentVersion}
            </Badge>
            <Badge className="border border-[#3bff96]/60 text-[#86ffc1] bg-[#3bff96]/10">
              {skill.status}
            </Badge>
            <SolanaStatusBadge label="Published asset" active />
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-8">
        <StoryLoopStrip activeStep={1} />
        <Card className="bg-[#0a0a0d] border border-cyan-500/40 p-6">
          <h1 className="text-2xl font-bold text-cyan-200">{skill.name}</h1>
          <p className="text-gray-400 mt-2">
            {skill.description || "No description."}
          </p>
          <div className="grid md:grid-cols-3 gap-3 mt-5 text-sm">
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Published by</p>
              <p className="text-cyan-300 break-all">{skill.authorWallet}</p>
            </div>
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Last used</p>
              <p className="text-cyan-300">
                {skill.lastUsedAt
                  ? new Date(skill.lastUsedAt).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Success rate</p>
              <p className="text-cyan-300">{skill.successRate}%</p>
            </div>
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Usage count</p>
              <p className="text-cyan-300">{skill.usageCount}</p>
            </div>
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Reputation</p>
              <p className="text-cyan-300">{skill.reputationScore}</p>
            </div>
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Published at</p>
              <p className="text-cyan-300">
                {new Date(skill.publishedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-cyan-700/70 text-cyan-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-3 text-xs">
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Content hash</p>
              <p className="text-cyan-300 break-all">{skill.contentHash}</p>
            </div>
            <div className="bg-black/40 rounded p-3">
              <p className="text-gray-500">Version account</p>
              <p className="text-cyan-300 break-all">
                {skill.currentVersionAccount}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-cyan-500 text-cyan-300"
              onClick={() =>
                navigator.clipboard.writeText(skill.currentVersionAccount)
              }
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Account
            </Button>
            {skill.explorerUrl ? (
              <Button
                variant="outline"
                className="border-cyan-500 text-cyan-300"
                onClick={() => window.open(skill.explorerUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open on Explorer
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="border-[#3bff96]/60 text-[#86ffc1]"
              onClick={() => verifyMutation.mutate({ id: skill.id })}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verify On-Chain
            </Button>
          </div>
          {verifyMutation.data ? (
            <p className="mt-3 text-xs text-gray-300">
              Verification:{" "}
              {verifyMutation.data.verified ? "verified" : "mismatch"} (
              {verifyMutation.data.reason})
            </p>
          ) : null}
        </Card>

        <Card className="bg-[#09090c] border border-cyan-500/30 p-6">
          <h2 className="text-xl font-semibold text-cyan-200 mb-4">
            Version history
          </h2>
          <SkillAssetTimeline versions={versions ?? []} />
          <div className="mt-3 flex flex-wrap gap-2">
            {versions?.map((version) => (
              <Button
                key={version.id}
                size="sm"
                variant="outline"
                className="border-cyan-700/70 text-cyan-300"
                onClick={() => setCompareVersionId(version.id)}
              >
                <GitCompare className="w-3 h-3 mr-1" />
                Compare v{version.version}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="bg-[#09090c] border border-cyan-500/30 p-6">
          <h2 className="text-xl font-semibold text-cyan-200 mb-4">
            Compare versions
          </h2>
          {currentVersion && previousVersion ? (
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-black/40 rounded p-3 border border-white/10">
                <p className="text-cyan-300 font-semibold">
                  Current (v{currentVersion.version})
                </p>
                <p className="text-gray-300 mt-1">
                  {currentVersion.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Hash: {currentVersion.hash}
                </p>
              </div>
              <div className="bg-black/40 rounded p-3 border border-white/10">
                <p className="text-gray-300 font-semibold">
                  Compared (v{previousVersion.version})
                </p>
                <p className="text-gray-300 mt-1">
                  {previousVersion.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Hash: {previousVersion.hash}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              No prior version available yet.
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}

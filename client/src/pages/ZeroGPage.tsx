import { useCallback, useEffect, useMemo, useState } from "react";
import { ZeroGArtifactCard } from "@/components/zerog/ZeroGArtifactCard";
import { ZeroGBridgeCard } from "@/components/zerog/ZeroGBridgeCard";
import { ZeroGComputeCard } from "@/components/zerog/ZeroGComputeCard";
import { ZeroGHealthBanner } from "@/components/zerog/ZeroGHealthBanner";
import { ZeroGProofGraph } from "@/components/zerog/ZeroGProofGraph";
import { ZeroGStatusPanel } from "@/components/zerog/ZeroGStatusPanel";
import { Button } from "@/components/ui/button";
import { getClientZeroGConfig } from "@/lib/zerog/config";
import type {
  ZeroGBridgeState,
  ZeroGComputeJob,
  ZeroGHealthResponse,
  ZeroGProofGraphResponse,
  ZeroGStorageArtifact,
} from "@/lib/zerog/types";
import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

async function fetchApi<T>(path: string): Promise<T | null> {
  const response = await fetch(path);
  if (!response.ok) return null;
  const body = (await response.json()) as { ok: boolean; data: T };
  return body.data;
}

export default function ZeroGPage() {
  const clientCfg = getClientZeroGConfig();
  const [health, setHealth] = useState<ZeroGHealthResponse | null>(null);
  const [bridge, setBridge] = useState<ZeroGBridgeState | null>(null);
  const [artifacts, setArtifacts] = useState<ZeroGStorageArtifact[]>([]);
  const [jobs, setJobs] = useState<ZeroGComputeJob[]>([]);
  const [graph, setGraph] = useState<ZeroGProofGraphResponse | null>(null);
  const [network, setNetwork] = useState<{
    ogChainId: number;
    bridgeProvider: string;
    tokenMetadataDisclaimer: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [nextHealth, nextBridge, nextArtifacts, nextJobs, nextGraph, net] =
      await Promise.all([
        fetchApi<ZeroGHealthResponse>("/api/zerog/health"),
        fetchApi<ZeroGBridgeState>("/api/zerog/bridge/status"),
        fetchApi<ZeroGStorageArtifact[]>("/api/zerog/artifacts"),
        fetchApi<ZeroGComputeJob[]>("/api/zerog/compute/jobs"),
        fetchApi<ZeroGProofGraphResponse>("/api/zerog/proof-graph"),
        fetchApi<{
          ogChainId: number;
          bridgeProvider: string;
          tokenMetadataDisclaimer: string;
        }>("/api/zerog/network"),
      ]);
    setHealth(nextHealth);
    setBridge(nextBridge);
    setArtifacts(nextArtifacts || []);
    setJobs(nextJobs || []);
    setGraph(nextGraph);
    setNetwork(net);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(
    () => ({
      artifacts: artifacts.length,
      jobs: jobs.length,
      receipts: graph?.receipts.length || 0,
      links: graph?.links.length || 0,
    }),
    [
      artifacts.length,
      graph?.links.length,
      graph?.receipts.length,
      jobs.length,
    ],
  );

  const disclaimer =
    network?.tokenMetadataDisclaimer ?? clientCfg.tokenMetadataDisclaimer;

  return (
    <div className="min-h-screen bg-[#02060a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(59,255,150,0.14),transparent_35%),radial-gradient(circle_at_88%_18%,rgba(120,244,225,0.1),transparent_32%)]" />
      <div className="container relative space-y-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard?section=zerog-sidecar">
              <Button
                variant="ghost"
                size="sm"
                className="mb-3 -ml-2 gap-1 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Solana command center
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              0G infrastructure audit
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Solana remains the identity and proof layer. 0G is the modular
              sidecar for durable artifacts, compute, data availability, and
              bridge-aware references—orchestrated by the backend, verified from
              this surface.
            </p>
          </div>
          <div className="rounded-2xl border border-[#3bff96]/25 bg-[#3bff96]/5 px-4 py-3 text-xs text-[#c8ffe3]">
            <div className="flex items-center gap-2 font-medium text-white">
              <Shield className="h-4 w-4 text-[#3bff96]" />
              Proof posture
            </div>
            <p className="mt-2 text-[11px] text-slate-300">
              Solana layer says:{" "}
              <span className="text-[#8efad0]">
                “this happened — here is the Solana proof.”
              </span>
            </p>
            <p className="mt-1 text-[11px] text-slate-300">
              0G says:{" "}
              <span className="text-[#8efad0]">
                “here is the durable artifact / compute output.”
              </span>
            </p>
          </div>
        </div>

        <section className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 md:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              0G chain (bridge target)
            </p>
            <p className="mt-1 font-mono text-lg text-white">
              {network?.ogChainId ?? clientCfg.ogChainId}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Bridge surface
            </p>
            <p className="mt-1 text-sm text-slate-200">
              {network?.bridgeProvider ?? clientCfg.bridgeProvider}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Environment
            </p>
            <p className="mt-1 text-sm text-slate-200">
              {health?.config.environment ?? clientCfg.environment}
            </p>
          </div>
        </section>

        <ZeroGHealthBanner health={health} />
        <ZeroGStatusPanel
          health={health}
          bridge={bridge}
          onRunDemo={async () => {
            await fetch("/api/zerog/demo/run", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            await refresh();
          }}
        />

        <div className="grid gap-2 text-xs md:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
            artifacts: {summary.artifacts}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
            compute jobs: {summary.jobs}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
            solana receipts: {summary.receipts}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
            cross-links: {summary.links}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Stored artifacts
            </h2>
            {artifacts.length ? (
              artifacts
                .slice(0, 6)
                .map((artifact) => (
                  <ZeroGArtifactCard key={artifact.id} artifact={artifact} />
                ))
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-slate-500">
                No artifacts yet. Run the sidecar demo or trigger an autonomy
                reflection from the app to populate storage refs.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Compute + bridge
            </h2>
            <ZeroGBridgeCard bridge={bridge} tokenDisclaimer={disclaimer} />
            {jobs.slice(0, 4).map((job) => (
              <ZeroGComputeCard key={job.id} job={job} />
            ))}
            {!jobs.length ? (
              <p className="text-xs text-slate-500">
                Compute jobs appear after demo or summarization runs.
              </p>
            ) : null}
          </div>
        </div>

        <ZeroGProofGraph graph={graph} />
      </div>
    </div>
  );
}

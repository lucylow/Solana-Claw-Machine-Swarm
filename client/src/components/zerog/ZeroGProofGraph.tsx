import { getClientZeroGConfig } from "@/lib/zerog/config";
import {
  artifactExplorerUrl,
  computeExplorerUrl,
  daExplorerUrl,
} from "@/lib/zerog/explorer";
import { formatHash } from "@/lib/zerog/format";
import type { ZeroGProofGraphResponse } from "@/lib/zerog/types";
import { ExternalLink } from "lucide-react";

const NODE_W = 118;
const NODE_H = 44;

const LAYOUT: Array<{
  id: string;
  label: string;
  role: string;
  x: number;
  y: number;
}> = [
  {
    id: "wallet",
    label: "Solana wallet",
    role: "identity + session",
    x: 16,
    y: 24,
  },
  { id: "skill", label: "Skill", role: "registry choice", x: 150, y: 24 },
  { id: "plan", label: "Plan", role: "artifact", x: 284, y: 24 },
  { id: "execution", label: "Execution", role: "agent run", x: 418, y: 24 },
  {
    id: "reflection",
    label: "Reflection",
    role: "full payload",
    x: 552,
    y: 24,
  },
  { id: "memory", label: "Memory", role: "next-turn linkage", x: 16, y: 132 },
  {
    id: "storage",
    label: "0G storage",
    role: "durable artifact",
    x: 150,
    y: 132,
  },
  {
    id: "compute",
    label: "0G compute",
    role: "summarize / normalize",
    x: 284,
    y: 132,
  },
  { id: "da", label: "0G DA", role: "availability ref", x: 418, y: 132 },
  {
    id: "receipt",
    label: "Solana receipt",
    role: "compact proof",
    x: 552,
    y: 132,
  },
  {
    id: "explorer",
    label: "Verify",
    role: "explorer + replay",
    x: 360,
    y: 220,
  },
];

const EDGES: Array<{ from: string; to: string; label: string }> = [
  { from: "wallet", to: "skill", label: "authorizes" },
  { from: "skill", to: "plan", label: "plans" },
  { from: "plan", to: "execution", label: "runs" },
  { from: "execution", to: "reflection", label: "learns" },
  { from: "reflection", to: "memory", label: "influences" },
  { from: "reflection", to: "storage", label: "full artifact" },
  { from: "storage", to: "compute", label: "process" },
  { from: "storage", to: "da", label: "DA ref" },
  { from: "da", to: "receipt", label: "anchor hash" },
  { from: "receipt", to: "explorer", label: "verify" },
];

function centerOf(id: string) {
  const n = LAYOUT.find((item) => item.id === id)!;
  return { cx: n.x + NODE_W / 2, cy: n.y + NODE_H / 2 };
}

export function ZeroGProofGraph({
  graph,
}: {
  graph: ZeroGProofGraphResponse | null;
}) {
  const config = getClientZeroGConfig();
  const latestLink = graph?.links[0];
  const latestReceipt = graph?.receipts[0];
  const latestArtifact = graph?.artifacts[0];
  const latestJob = graph?.computeJobs[0];
  const latestDa = graph?.availability[0];

  const storageUrl = latestArtifact?.storageRef
    ? artifactExplorerUrl(config, latestArtifact.storageRef)
    : undefined;
  const computeUrl = latestJob?.computeRef
    ? computeExplorerUrl(config, latestJob.computeRef)
    : undefined;
  const daUrl = latestDa?.availabilityRef
    ? daExplorerUrl(config, latestDa.availabilityRef)
    : undefined;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#060b10]/95 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">
          Solana proof layer + 0G modular sidecar
        </h3>
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
          replayable · hash-linked
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        Heavy narrative and artifacts:{" "}
        <span className="text-[#7dffc4]">0G</span>. Canonical identity and
        compact proofs: <span className="text-[#7dffc4]">Solana</span>.
      </p>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox="0 0 688 268" className="h-auto min-w-[640px] w-full">
          <defs>
            <linearGradient id="zg-edge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59,255,150,0.35)" />
              <stop offset="100%" stopColor="rgba(120,244,225,0.35)" />
            </linearGradient>
          </defs>
          {EDGES.map((edge) => {
            const a = centerOf(edge.from);
            const b = centerOf(edge.to);
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke="url(#zg-edge)"
                  strokeWidth={1.25}
                />
                <text
                  x={(a.cx + b.cx) / 2}
                  y={(a.cy + b.cy) / 2 - 4}
                  fill="rgba(148,163,184,0.9)"
                  fontSize={9}
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
          {LAYOUT.map((node) => {
            const active =
              (node.id === "storage" && latestArtifact) ||
              (node.id === "compute" && latestJob) ||
              (node.id === "da" && latestDa) ||
              (node.id === "receipt" && latestReceipt) ||
              (node.id === "reflection" && latestLink);
            return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={
                    active ? "rgba(59,255,150,0.08)" : "rgba(15,23,42,0.65)"
                  }
                  stroke={
                    active ? "rgba(59,255,150,0.45)" : "rgba(255,255,255,0.12)"
                  }
                  strokeWidth={1}
                />
                <text
                  x={12}
                  y={20}
                  fill="#e2e8f0"
                  fontSize={11}
                  fontWeight={600}
                >
                  {node.label}
                </text>
                <text x={12} y={34} fill="rgba(148,163,184,0.95)" fontSize={9}>
                  {node.role}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-slate-300 md:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Latest link
          </p>
          <p>status: {latestLink?.status || "unlinked"}</p>
          <p>
            content hash:{" "}
            {latestLink ? formatHash(latestLink.contentHash, 6) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            0G refs
          </p>
          <p>storage: {latestArtifact?.storageRef || "—"}</p>
          <p>compute: {latestJob?.computeRef || "—"}</p>
          <p>DA: {latestDa?.availabilityRef || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Solana proof
          </p>
          <p>
            tx:{" "}
            {latestReceipt?.txSignature
              ? formatHash(latestReceipt.txSignature, 8)
              : "not anchored"}
          </p>
          <p>
            summary hash:{" "}
            {latestReceipt ? formatHash(latestReceipt.summaryHash, 6) : "—"}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Open explorers
          </p>
          <div className="flex flex-wrap gap-2">
            {storageUrl ? (
              <a
                href={storageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#78f4e1] hover:underline"
              >
                artifact <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-slate-500">artifact: n/a</span>
            )}
            {computeUrl ? (
              <a
                href={computeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#78f4e1] hover:underline"
              >
                compute <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {daUrl ? (
              <a
                href={daUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#78f4e1] hover:underline"
              >
                DA <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {latestReceipt?.txSignature ? (
              <a
                href={`https://explorer.solana.com/tx/${latestReceipt.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#78f4e1] hover:underline"
              >
                Solana tx <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import type {
  SolanaIdentityReceipt,
  SolanaMemorySummary,
  SolanaSkillSummary,
} from "@/solana/identityTypes";

type Props = {
  skills: SolanaSkillSummary[];
  memories: SolanaMemorySummary[];
  receipts: SolanaIdentityReceipt[];
};

function formatAgo(value?: number | string) {
  if (!value) return "just now";
  const ts = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ts)) return "just now";
  const seconds = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(input: string, length: number) {
  if (!input) return "";
  return input.length > length ? `${input.slice(0, length - 1)}…` : input;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-black/30 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h4 className="text-cyan-200 font-semibold">{title}</h4>
        <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function SolanaIdentityDashboard({ skills, memories, receipts }: Props) {
  const [tab, setTab] = useState<"skills" | "memory" | "receipts">("skills");

  const sortedReceipts = useMemo(
    () => [...receipts].sort((a, b) => b.createdAt - a.createdAt),
    [receipts],
  );

  const tabClass = (active: boolean) =>
    active
      ? "rounded-full border border-cyan-400 bg-cyan-500/20 px-3 py-1 text-sm text-cyan-100"
      : "rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:border-slate-400";

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-black/25 p-4 md:p-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={tabClass(tab === "skills")}
          onClick={() => setTab("skills")}
        >
          Skills
        </button>
        <button
          className={tabClass(tab === "memory")}
          onClick={() => setTab("memory")}
        >
          Memory
        </button>
        <button
          className={tabClass(tab === "receipts")}
          onClick={() => setTab("receipts")}
        >
          Receipts
        </button>
      </div>

      {tab === "skills" ? (
        <Section title="Saved skills" count={skills.length}>
          {skills.length ? (
            skills.map((skill) => (
              <article
                className="rounded-xl border border-cyan-500/10 bg-black/40 p-3"
                key={skill.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-cyan-100">{skill.name}</strong>
                  <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-100">
                    v{skill.version}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {truncate(skill.description, 160)}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    usage {skill.usageCount}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    score {skill.score.toFixed(2)}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    {skill.status}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="text-sm text-slate-400">No skills yet.</div>
          )}
        </Section>
      ) : null}

      {tab === "memory" ? (
        <Section title="Saved memories" count={memories.length}>
          {memories.length ? (
            memories.map((memory) => (
              <article
                className="rounded-xl border border-cyan-500/10 bg-black/40 p-3"
                key={memory.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-cyan-100">{memory.title}</strong>
                  <span className="text-xs text-slate-400">
                    {formatAgo(memory.createdAt)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {truncate(memory.summary, 180)}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    {memory.kind}
                  </span>
                  {memory.rootCause ? (
                    <span className="rounded-full border border-slate-600 px-2 py-0.5">
                      root cause stored
                    </span>
                  ) : null}
                  {memory.correctiveAdvice ? (
                    <span className="rounded-full border border-slate-600 px-2 py-0.5">
                      advice stored
                    </span>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="text-sm text-slate-400">No memories yet.</div>
          )}
        </Section>
      ) : null}

      {tab === "receipts" ? (
        <Section title="On-chain receipts" count={sortedReceipts.length}>
          {sortedReceipts.length ? (
            sortedReceipts.map((receipt) => (
              <article
                className="rounded-xl border border-cyan-500/10 bg-black/40 p-3"
                key={receipt.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-cyan-100">{receipt.summary}</strong>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      receipt.status === "confirmed"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : receipt.status === "failed"
                          ? "border-red-500/40 bg-red-500/10 text-red-200"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {receipt.status}
                  </span>
                </div>
                <code className="mt-2 block text-xs text-slate-300">
                  {truncate(receipt.receiptHash, 42)}
                </code>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    tx {truncate(receipt.txHash || "pending", 20)}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    {formatAgo(receipt.createdAt)}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    {receipt.labels.join(", ")}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="text-sm text-slate-400">No receipts yet.</div>
          )}
        </Section>
      ) : null}
    </div>
  );
}

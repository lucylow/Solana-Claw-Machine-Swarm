import { useMemo, useState } from "react";
import type {
  SolanaDiscoveryProfile,
  SolanaDiscoveryRow,
} from "@/solana/identityTypes";

type Props = {
  profiles: SolanaDiscoveryProfile[];
  skills: SolanaDiscoveryRow[];
  walletAddress?: string | null;
};

function pctFromBps(value: number) {
  return `${(value / 100).toFixed(1)}%`;
}

export function SolanaDiscoverySurface({
  profiles,
  skills,
  walletAddress,
}: Props) {
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const rankedSkills = useMemo(() => {
    let rows = [...skills];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) =>
        [row.slug, row.name, row.category, row.language, ...(row.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    if (verifiedOnly) {
      rows = rows.filter((row) => row.trustScoreBps >= 5000);
    }
    return rows
      .sort((a, b) => {
        if (b.discoveryScoreBps !== a.discoveryScoreBps)
          return b.discoveryScoreBps - a.discoveryScoreBps;
        if (b.trustScoreBps !== a.trustScoreBps)
          return b.trustScoreBps - a.trustScoreBps;
        if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
        return b.updatedAt - a.updatedAt;
      })
      .map((row, idx) => ({ ...row, lastRank: idx + 1 }));
  }, [skills, query, verifiedOnly]);

  const topProfiles = useMemo(
    () =>
      [...profiles]
        .sort((a, b) => b.discoveryScoreBps - a.discoveryScoreBps)
        .slice(0, 8),
    [profiles],
  );

  return (
    <section className="rounded-3xl border border-cyan-500/20 bg-black/30 p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-cyan-400">
            Solana discovery
          </div>
          <h3 className="mt-1 text-2xl font-bold text-cyan-100">
            Which Solana skill assets are reliable?
          </h3>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Ranking blends successful runs, repeated skill usage, reflection
            quality, Solana wallet–authored provenance, and published versions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills, tags, category..."
            className="h-10 w-[260px] rounded-md border border-cyan-500/30 bg-black/50 px-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <button
            className={`h-10 rounded-md border px-3 text-sm ${
              verifiedOnly
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                : "border-slate-600 bg-transparent text-slate-300"
            }`}
            onClick={() => setVerifiedOnly((value) => !value)}
          >
            Verified only
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-3">
          {rankedSkills.length ? (
            rankedSkills.map((skill) => (
              <article
                key={skill.skillAddress}
                className="rounded-2xl border border-cyan-500/20 bg-black/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-cyan-400">
                      {skill.slug}
                    </div>
                    <h4 className="mt-1 text-lg font-semibold text-cyan-100">
                      {skill.name}
                    </h4>
                  </div>
                  <div className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-sm text-cyan-100">
                    {pctFromBps(skill.discoveryScoreBps)}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    trust {pctFromBps(skill.trustScoreBps)}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    usage {skill.usageCount}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    success {skill.successCount}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    versions {skill.versionCount}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    reflection {pctFromBps(skill.avgReflectionQualityBps)}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    {skill.category}
                  </span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5">
                    {skill.language}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-cyan-800/70 px-2 py-0.5 text-xs text-cyan-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-700 bg-black/30 p-4 text-sm text-slate-400">
              No skills matched this discovery filter.
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-4">
            <div className="text-xs uppercase tracking-wider text-cyan-400">
              Wallet profile
            </div>
            <div className="mt-2 text-sm text-slate-300 break-all">
              {walletAddress || "Connect Solana wallet"}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Solana wallet verification is the identity root. Discovery scores
              only matter when authorship is real.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-4">
            <div className="text-xs uppercase tracking-wider text-cyan-400">
              Which wallets have real usage?
            </div>
            <div className="mt-3 space-y-3">
              {topProfiles.map((profile) => (
                <div
                  key={profile.walletAddress}
                  className="border-t border-slate-700/80 pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="text-sm font-semibold text-cyan-100">
                    {profile.walletAddress.slice(0, 4)}…
                    {profile.walletAddress.slice(-4)}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    trust {pctFromBps(profile.trustScoreBps)} · discovery{" "}
                    {pctFromBps(profile.discoveryScoreBps)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    usage {profile.usageCount} · published{" "}
                    {profile.publishedVersionCount} versions
                  </div>
                </div>
              ))}
              {!topProfiles.length ? (
                <div className="text-xs text-slate-400">
                  No wallet profiles yet.
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

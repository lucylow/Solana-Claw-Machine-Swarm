import { Button } from "@/components/ui/button";
import {
  SWARM_JUDGING_CRITERIA,
  SWARM_SUBMISSION_ASSETS,
  SWARM_SUBMISSION_LINKS,
  calculateSwarmSubmissionScore,
  type SwarmSubmissionAsset,
} from "@shared/swarmSubmission";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Film,
  Github,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "wouter";

const readiness = calculateSwarmSubmissionScore({
  innovation: 95,
  agenticSophistication: 92,
  traction: 84,
});

const statusCopy: Record<
  SwarmSubmissionAsset["status"],
  { label: string; className: string }
> = {
  ready: {
    label: "Ready",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  },
  "needs-live-link": {
    label: "Add final link",
    className: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  },
  "demo-mode": {
    label: "Demo labeled",
    className: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  },
};

const reviewLinks = SWARM_SUBMISSION_LINKS.slice(0, 4);
const requiredAssets = SWARM_SUBMISSION_ASSETS.slice(0, 4);

function LinkIcon({ href }: { href: string }) {
  if (href.includes("github"))
    return <Github className="h-4 w-4" aria-hidden />;
  if (href.includes("proof"))
    return <ShieldCheck className="h-4 w-4" aria-hidden />;
  if (href.includes("demo")) return <Film className="h-4 w-4" aria-hidden />;
  return <ReceiptText className="h-4 w-4" aria-hidden />;
}

export default function SubmissionPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-18rem] top-[-16rem] h-[38rem] w-[38rem] rounded-full bg-[#14f195]/20 blur-3xl" />
        <div className="absolute right-[-16rem] top-20 h-[34rem] w-[34rem] rounded-full bg-[#8b5cf6]/20 blur-3xl" />
        <div className="absolute bottom-[-18rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-[#38bdf8]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_top,black,transparent_68%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-white"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#14f195] text-black shadow-lg shadow-[#14f195]/20">
              <LayoutDashboard className="h-4 w-4" aria-hidden />
            </span>
            CLAW MACHINE
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/demo/full-story">
              <Button
                size="sm"
                variant="ghost"
                className="hidden text-slate-200 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                Replay
              </Button>
            </Link>
            <Link href="/dashboard?section=overview&demo=1">
              <Button
                size="sm"
                className="rounded-full bg-white px-4 font-semibold text-black hover:bg-[#dfffee]"
              >
                Launch demo
              </Button>
            </Link>
          </div>
        </nav>

        <section className="grid items-center gap-10 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14f195]/25 bg-[#14f195]/10 px-3 py-1.5 text-xs font-medium text-[#c9ffe8] shadow-lg shadow-[#14f195]/10">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              SWARM submission-ready Solana agent demo
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Agents that leave receipts, not mystery.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Claw Machine turns wallet identity, skill execution, memory, and
              proof anchoring into a judgeable Solana workflow. This page is the
              clean entry point for SWARM reviewers: open the demo, inspect the
              proofs, and see exactly how the product maps to the rubric.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard?section=overview&demo=1">
                <Button className="h-12 rounded-full bg-[#14f195] px-6 text-base font-semibold text-black shadow-xl shadow-[#14f195]/20 hover:bg-[#6dffc1]">
                  Open working demo
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/proofs">
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  View proofs
                </Button>
              </Link>
            </div>
          </div>

          <aside className="relative rounded-[2rem] border border-white/12 bg-white/[0.08] p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0c1024]/95 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Submission scorecard
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Internal readiness model
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#14f195]/15 text-[#14f195]">
                  <Trophy className="h-6 w-6" aria-hidden />
                </div>
              </div>

              <div className="grid gap-5 py-6 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="relative grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#14f195_0deg,#14f195_320deg,rgba(255,255,255,0.10)_320deg)] p-2">
                  <div className="grid h-full w-full place-items-center rounded-full bg-[#0c1024]">
                    <div className="text-center">
                      <p className="text-5xl font-semibold tracking-tight">
                        {readiness.total}
                      </p>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        ready
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {readiness.breakdown.map((item) => {
                    const criterion = SWARM_JUDGING_CRITERIA.find(
                      (c) => c.id === item.criterion,
                    );
                    return (
                      <div key={item.criterion}>
                        <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                          <span>{criterion?.label}</span>
                          <span>{item.weightedPoints} pts</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#14f195] to-[#38bdf8]"
                            style={{ width: `${item.normalizedScore}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm leading-6 text-slate-300">
                  Built for a fast judge walkthrough: wallet identity, skill
                  choice, execution trail, proof state, and receipt inspection.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {SWARM_JUDGING_CRITERIA.map((criterion) => (
            <article
              key={criterion.id}
              className="group rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#14f195]/30 hover:bg-white/[0.08]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-[#14f195]">
                  <CircleDot className="h-5 w-5" aria-hidden />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                  {criterion.weight}%
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                {criterion.label}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {criterion.evidence[0]}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#14f195]">
              Judge path
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Four clicks, full story.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Use these links in order if you want the quickest SWARM review.
            </p>
            <div className="mt-6 space-y-3">
              {reviewLinks.map((link, index) => {
                const content = (
                  <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-[#14f195]/35 hover:bg-[#14f195]/10">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#14f195]">
                      <LinkIcon href={link.href} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-white">
                        {index + 1}. {link.label}
                        {!link.internal ? (
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                        {link.detail}
                      </span>
                    </span>
                  </span>
                );

                return link.internal ? (
                  <Link key={link.label} href={link.href}>
                    {content}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#f7fff9] p-6 text-[#09111f] shadow-2xl shadow-[#14f195]/10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Submission checklist
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              What Frontier needs.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {requiredAssets.map((asset) => (
                <article
                  key={asset.title}
                  className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusCopy[asset.status].className}`}
                    >
                      {statusCopy[asset.status].label}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{asset.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {asset.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

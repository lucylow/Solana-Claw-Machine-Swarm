import { cn } from "@/lib/utils";
import {
  buildCommandTimelineSafe,
  type CommandTimelineEvent,
  type CommandTimelineStatus,
} from "@shared/commandCenterTimeline";
import type { SwarmSectionId } from "@shared/swarm";
import { COMMAND_SIDE_NAV_ITEMS, SOLANA_COPY } from "@shared/copy";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  Brush,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Link2,
  MemoryStick,
  Orbit,
  PlayCircle,
  Radio,
  ReceiptText,
  Scale,
  SearchCode,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "wouter";

const ACCENT = "#14f195";
const ACCENT_TEAL = "#38d7d0";

export function StatusChip({
  label,
  tone = "neutral",
  pulse,
  className,
  title,
}: {
  label: string;
  tone?: "neutral" | "live" | "proof" | "warn";
  pulse?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-wider",
        tone === "neutral" && "border-white/10 bg-black/50 text-slate-400",
        tone === "live" && "border-[#14f195]/45 bg-[#14f195]/10 text-[#c8ffe8]",
        tone === "proof" && "border-cyan-400/40 bg-cyan-500/10 text-cyan-100",
        tone === "warn" && "border-amber-400/35 bg-amber-500/10 text-amber-100",
        className,
      )}
    >
      {pulse ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14f195] opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14f195]" />
        </span>
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function ProofBadge({
  verified,
  className,
}: {
  verified: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        verified
          ? "border-[#14f195]/50 bg-[#14f195]/15 text-[#c8ffe8] shadow-[0_0_14px_rgba(20,241,149,0.2)]"
          : "border-white/12 bg-black/40 text-slate-500",
        className,
      )}
    >
      {verified ? SOLANA_COPY.proof.anchored : SOLANA_COPY.proof.pending}
    </span>
  );
}

export function MissionPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a0e14]/95 to-[#06080c]/98 shadow-[0_20px_50px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CommandTopRail({
  title,
  subtitle,
  chips,
}: {
  title: string;
  subtitle: string;
  /** Extra status row rendered after chips */
  chips: ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[#14f195]/15 bg-[#020403]/90 shadow-[0_1px_0_rgba(20,241,149,0.08),0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      role="banner"
    >
      <div className="relative border-b border-white/[0.04] bg-[#040507]/85 px-4 py-3 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#14f195]/70 to-transparent" />
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#14f195]/30 bg-[#0a120e] shadow-[0_0_18px_rgba(20,241,149,0.18)] transition hover:border-[#14f195]/55"
              aria-label="Solana command center · landing"
            >
              <Sparkles className="h-4 w-4 text-[#14f195]" aria-hidden />
            </Link>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="min-w-0"
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#14f195]/90">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#14f195] shadow-[0_0_8px_rgba(20,241,149,0.7)]" />
                Solana · SWARM · 0G memory · explorer proof
              </p>
              <h1 className="mt-1 truncate text-base font-semibold tracking-tight text-slate-50 sm:text-lg">
                {title}
              </h1>
              <p className="mt-0.5 line-clamp-1 max-w-3xl text-[11px] leading-relaxed text-slate-500">
                {subtitle}
              </p>
            </motion.div>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-[#14f195]/35 bg-[#14f195] px-4 py-2 text-[11px] font-semibold text-black shadow-[0_0_24px_rgba(20,241,149,0.24)] transition hover:bg-[#6cffbf]"
          >
            {SOLANA_COPY.navigation.landing}
          </Link>
        </div>
      </div>
      <div className="cc-scroll mx-auto flex max-w-[1920px] items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6">
        {chips}
      </div>
    </header>
  );
}

const NAV_ICONS: Record<
  SwarmSectionId,
  ComponentType<{ className?: string }>
> = {
  overview: Orbit,
  "live-run": Activity,
  skills: SearchCode,
  memory: MemoryStick,
  reflections: Brain,
  receipts: ReceiptText,
  "proof-explorer": GitBranch,
  agents: Bot,
  reputation: Scale,
  "openclaw-bridge": Link2,
  "demo-mode": PlayCircle,
  "proof-graph": ShieldCheck,
  "zerog-sidecar": Database,
  settings: Settings,
};

const NAV = COMMAND_SIDE_NAV_ITEMS.map((item) => ({
  ...item,
  icon: NAV_ICONS[item.id],
}));

export function CommandSideNav({
  section,
  dashboardPath = "/dashboard",
}: {
  section: SwarmSectionId;
  /** Base path for wouter links; query `section` selects the mode. */
  dashboardPath?: string;
}) {
  return (
    <nav
      className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#020305]/95 px-2 py-2 sm:flex-col sm:w-[72px] sm:border-b-0 sm:border-r sm:px-1.5 sm:py-3 xl:w-48 xl:px-2"
      aria-label="Command center modes"
    >
      {NAV.map((item) => {
        const active = section === item.id;
        const href = `${dashboardPath}?section=${encodeURIComponent(item.id)}`;
        return (
          <Link
            key={item.id}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={`${item.label}${active ? ", current section" : ""}`}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-xl border px-2 py-2 text-left transition hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14f195]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020305] sm:w-full sm:px-2",
              active
                ? "border-[#14f195]/40 bg-[#14f195]/12 text-[#d4ffe9] shadow-[inset_0_0_0_1px_rgba(20,241,149,0.12)]"
                : "border-transparent bg-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-300",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs",
                active
                  ? "border-[#14f195]/35 bg-black/40"
                  : "border-white/10 bg-black/30",
              )}
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate text-xs font-medium">
                {item.label}
              </span>
              <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-slate-600 group-hover:text-slate-500">
                {item.short}
              </span>
            </span>
            <span className="font-mono text-[10px] text-slate-600 xl:hidden">
              {item.short}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

const PHASE_ICONS: Record<CommandTimelineEvent["phase"], LucideIcon> = {
  wallet: Wallet,
  skill: SearchCode,
  plan: Brush,
  execute: Cpu,
  outcome: Activity,
  reflection: Brain,
  memory: MemoryStick,
  zerog_storage: Database,
  zerog_da: Layers,
  receipt: ReceiptText,
  reputation: Scale,
  next: ShieldCheck,
};

function statusVisual(status: CommandTimelineStatus): {
  /** ring color around icon */
  ring: string;
  /** icon background */
  bg: string;
  /** icon text color */
  fg: string;
  /** dot color along the rail */
  dot: string;
  /** label text color */
  label: string;
  /** detail text color */
  detail: string;
  /** connector color to next event */
  connector: string;
} {
  if (status === "complete") {
    return {
      ring: "border-[#14f195]/55 shadow-[0_0_14px_rgba(20,241,149,0.32)]",
      bg: "bg-[#14f195]/12",
      fg: "text-[#bcffd9]",
      dot: "bg-[#14f195] shadow-[0_0_10px_rgba(20,241,149,0.55)]",
      label: "text-[#cffce3]",
      detail: "text-slate-400",
      connector: `linear-gradient(90deg, ${ACCENT}88, ${ACCENT_TEAL}55)`,
    };
  }
  if (status === "active") {
    return {
      ring: "border-[#38d7d0]/65 shadow-[0_0_16px_rgba(56,215,208,0.4)]",
      bg: "bg-[#38d7d0]/15",
      fg: "text-[#bdf6f0]",
      dot: "bg-[#38d7d0] shadow-[0_0_12px_rgba(56,215,208,0.55)] animate-pulse",
      label: "text-[#bdf6f0]",
      detail: "text-slate-400",
      connector: `linear-gradient(90deg, ${ACCENT_TEAL}77, rgba(255,255,255,0.06) 80%)`,
    };
  }
  if (status === "failed") {
    return {
      ring: "border-rose-400/55 shadow-[0_0_12px_rgba(251,113,133,0.35)]",
      bg: "bg-rose-500/10",
      fg: "text-rose-200",
      dot: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.4)]",
      label: "text-rose-200",
      detail: "text-rose-300/70",
      connector: "rgba(251,113,133,0.25)",
    };
  }
  return {
    ring: "border-white/10",
    bg: "bg-black/40",
    fg: "text-slate-600",
    dot: "bg-slate-700",
    label: "text-slate-500",
    detail: "text-slate-600",
    connector: "rgba(255,255,255,0.06)",
  };
}

export function LiveTimelineStrip({
  events,
}: {
  events: CommandTimelineEvent[];
}) {
  const completed = events.filter((e) => e.status === "complete").length;
  const active = events.find((e) => e.status === "active");
  const failed = events.find((e) => e.status === "failed");
  const total = events.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="z-20 border-t border-white/[0.08] bg-[#020305]/95 backdrop-blur-sm"
      role="region"
      aria-label="Execution timeline: wallet through Solana receipt"
    >
      <div className="mx-auto max-w-[1920px] px-3 py-3 sm:px-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[#14f195]/30 bg-[#14f195]/10">
              <Radio className="h-3 w-3 text-[#14f195]" aria-hidden />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
              Execution spine · proof narrative
            </p>
            <span className="hidden text-[10px] text-slate-600 sm:inline">
              wallet → skill → plan → execute → reflect → memory → 0G storage /
              DA → Solana receipt → reputation
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-500">
              <span className="font-mono tabular-nums text-[#bcffd9]">
                {completed}
              </span>
              <span className="text-slate-600">/</span>
              <span className="font-mono tabular-nums text-slate-400">
                {total}
              </span>
              <span className="ml-1 text-slate-600">phases</span>
            </span>
            <span className="h-2 w-24 overflow-hidden rounded-full bg-white/5">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-[#14f195] to-[#38d7d0] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </span>
            {failed ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-1.5 py-0.5 text-rose-200">
                <XCircle className="h-3 w-3" aria-hidden /> degraded ·{" "}
                {failed.label}
              </span>
            ) : active ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#38d7d0]/30 bg-[#38d7d0]/10 px-1.5 py-0.5 text-[#bdf6f0]">
                <span
                  className="cc-pulse inline-block h-1.5 w-1.5 rounded-full bg-[#38d7d0]"
                  aria-hidden
                />
                live · {active.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#14f195]/25 bg-[#14f195]/8 px-1.5 py-0.5 text-[#bcffd9]">
                <CheckCircle2 className="h-3 w-3" aria-hidden /> nominal
              </span>
            )}
          </div>
        </div>
        <div className="cc-scroll relative flex gap-0 overflow-x-auto pb-2 pt-1">
          {/* central rail */}
          <div className="pointer-events-none absolute left-3 right-3 top-[24px] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
          <ol
            className="flex min-w-max items-stretch gap-1.5"
            aria-label="Live agent execution phases"
          >
            {events.map((ev, i) => {
              const v = statusVisual(ev.status);
              const Icon = PHASE_ICONS[ev.phase] ?? Activity;
              return (
                <motion.li
                  key={ev.id}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative flex w-[140px] shrink-0 flex-col items-center gap-1.5 px-1"
                  aria-label={`${ev.label}: ${ev.status}${ev.detail ? `. ${ev.detail}` : ""}`}
                >
                  {/* icon node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-2xl border transition",
                        v.ring,
                        v.bg,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", v.fg)} aria-hidden />
                      {ev.status === "complete" ? (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#14f195] bg-[#0a140e]">
                          <CheckCircle2
                            className="h-2.5 w-2.5 text-[#14f195]"
                            aria-hidden
                          />
                        </span>
                      ) : null}
                      {ev.status === "active" ? (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center">
                          <span className="absolute inset-0 animate-ping rounded-full bg-[#38d7d0]/45" />
                          <span className="relative block h-2 w-2 rounded-full bg-[#38d7d0]" />
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={cn("mt-1 h-1.5 w-1.5 rounded-full", v.dot)}
                      aria-hidden
                    />
                  </div>

                  {/* connector to next */}
                  {i < events.length - 1 ? (
                    <span
                      className="pointer-events-none absolute left-[calc(50%+28px)] top-[24px] hidden h-px w-[calc(100%-56px)] sm:block"
                      style={{ background: v.connector }}
                      aria-hidden
                    />
                  ) : null}

                  <p
                    className={cn(
                      "mt-0.5 text-center text-[10px] font-semibold uppercase tracking-wide",
                      v.label,
                    )}
                  >
                    {ev.label}
                  </p>
                  <p
                    className={cn(
                      "line-clamp-2 px-0.5 text-center text-[10px] leading-tight",
                      v.detail,
                    )}
                  >
                    {ev.detail || "—"}
                  </p>
                  {ev.proofRef ? (
                    <span className="mt-0.5 inline-flex max-w-full items-center gap-0.5 truncate rounded border border-[#14f195]/25 bg-[#14f195]/5 px-1 py-0.5 font-mono text-[9px] text-[#bcffd9]">
                      <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                      <span className="truncate">{ev.proofRef}</span>
                    </span>
                  ) : null}
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

export type { CommandTimelineEvent } from "@shared/commandCenterTimeline";

export function CommandCenterShell({
  children,
  top,
  right,
  timelineInput,
  section,
  dashboardPath,
}: {
  children: ReactNode;
  top: ReactNode;
  right: ReactNode;
  timelineInput: Parameters<typeof buildCommandTimelineSafe>[0];
  section: SwarmSectionId;
  dashboardPath?: string;
}) {
  const { events } = buildCommandTimelineSafe(timelineInput);
  return (
    <div className="cc-stage relative flex min-h-screen flex-col overflow-hidden text-slate-100">
      {top}
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <CommandSideNav section={section} dashboardPath={dashboardPath} />
        <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
          <main className="cc-scroll min-h-[50vh] flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:min-h-0 lg:max-h-[calc(100vh-7.6rem)]">
            {children}
          </main>
          <aside className="cc-scroll w-full shrink-0 border-t border-white/[0.06] bg-[#030508]/92 shadow-[inset_1px_0_0_rgba(20,241,149,0.05)] lg:w-[min(100%,360px)] lg:max-w-[360px] lg:border-l lg:border-t-0 lg:overflow-y-auto lg:max-h-[calc(100vh-7.6rem)]">
            {right}
          </aside>
        </div>
      </div>
      <LiveTimelineStrip events={events} />
    </div>
  );
}

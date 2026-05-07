import { cn } from "@/lib/utils";
import { buildCommandTimeline, type CommandTimelineEvent, type CommandTimelineStatus } from "@shared/commandCenterTimeline";
import type { SwarmSectionId } from "@shared/swarm";
import { COMMAND_SIDE_NAV_ITEMS, SOLANA_COPY } from "@shared/copy";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  Database,
  GitBranch,
  Link2,
  MemoryStick,
  Orbit,
  ReceiptText,
  Scale,
  SearchCode,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "wouter";

const ACCENT = "#14f195";
const ACCENT_TEAL = "#38d7d0";

export function StatusChip({
  label,
  tone = "neutral",
  pulse,
  className,
}: {
  label: string;
  tone?: "neutral" | "live" | "proof" | "warn";
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-wider",
        tone === "neutral" && "border-white/10 bg-black/50 text-slate-400",
        tone === "live" && "border-[#14f195]/45 bg-[#14f195]/10 text-[#c8ffe8]",
        tone === "proof" && "border-cyan-400/40 bg-cyan-500/10 text-cyan-100",
        tone === "warn" && "border-amber-400/35 bg-amber-500/10 text-amber-100",
        className
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

export function ProofBadge({ verified, className }: { verified: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        verified
          ? "border-[#14f195]/50 bg-[#14f195]/15 text-[#c8ffe8] shadow-[0_0_14px_rgba(20,241,149,0.2)]"
          : "border-white/12 bg-black/40 text-slate-500",
        className
      )}
    >
      {verified ? SOLANA_COPY.proof.anchored : SOLANA_COPY.proof.pending}
    </span>
  );
}

export function MissionPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a0e14]/95 to-[#06080c]/98 shadow-[0_20px_50px_rgba(0,0,0,0.55)]",
        className
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
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#030406]/90 backdrop-blur-md">
      <div className="border-b border-white/[0.04] bg-[#050507]/80 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#14f195]/90">Solana · autonomous agents</p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">{title}</h1>
                    <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">{subtitle}</p>
            </motion.div>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-slate-400 transition hover:border-[#14f195]/35 hover:text-[#14f195]"
          >
            {SOLANA_COPY.navigation.landing}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1920px] items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:thin]">
        {chips}
      </div>
    </header>
  );
}

const NAV_ICONS: Record<SwarmSectionId, ComponentType<{ className?: string }>> = {
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
  "proof-graph": ShieldCheck,
  "zerog-sidecar": Database,
  settings: Settings,
};

const NAV = COMMAND_SIDE_NAV_ITEMS.map(item => ({
  ...item,
  icon: NAV_ICONS[item.id],
}));

export function CommandSideNav({
  section,
  onSection,
}: {
  section: SwarmSectionId;
  onSection: (id: SwarmSectionId) => void;
}) {
  return (
    <nav
      className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#020305]/95 px-2 py-2 sm:flex-col sm:w-[76px] sm:border-b-0 sm:border-r sm:px-1.5 sm:py-4 xl:w-52 xl:px-2"
      aria-label="Command center modes"
    >
      {NAV.map(item => {
        const active = section === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSection(item.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-xl border px-2 py-2 text-left transition sm:w-full sm:px-2",
              active
                ? "border-[#14f195]/40 bg-[#14f195]/12 text-[#d4ffe9] shadow-[inset_0_0_0_1px_rgba(20,241,149,0.12)]"
                : "border-transparent bg-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-300"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs",
                active ? "border-[#14f195]/35 bg-black/40" : "border-white/10 bg-black/30"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
            </span>
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate text-xs font-medium">{item.label}</span>
              <span className="block truncate text-[10px] uppercase tracking-wider text-slate-600 group-hover:text-slate-500">
                mode
              </span>
            </span>
            <span className="font-mono text-[10px] text-slate-600 xl:hidden">{item.short}</span>
          </button>
        );
      })}
    </nav>
  );
}

function timelineDot(status: CommandTimelineStatus) {
  if (status === "complete") return "bg-[#14f195] shadow-[0_0_10px_rgba(20,241,149,0.45)]";
  if (status === "active") return "bg-[#38d7d0] shadow-[0_0_12px_rgba(56,215,208,0.4)] animate-pulse";
  if (status === "failed") return "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.35)]";
  return "bg-slate-700";
}

export function LiveTimelineStrip({ events }: { events: CommandTimelineEvent[] }) {
  return (
    <div className="z-20 border-t border-white/[0.08] bg-[#020305]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1920px] px-3 py-3 sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Execution spine · proof narrative</p>
          <span className="text-[10px] text-slate-600">{ACCENT} · live sequence</span>
        </div>
        <div className="relative flex gap-0 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
          <div className="pointer-events-none absolute left-0 right-0 top-[14px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex min-w-max gap-1">
            {events.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex w-[112px] shrink-0 flex-col items-center gap-1.5 px-1"
              >
                <div className={cn("relative z-10 h-2.5 w-2.5 rounded-full", timelineDot(ev.status))} />
                {i < events.length - 1 ? (
                  <span
                    className="pointer-events-none absolute left-[calc(50%+28px)] top-[9px] hidden h-px w-[calc(100%-56px)] sm:block"
                    style={{
                      background:
                        ev.status === "complete"
                          ? `linear-gradient(90deg, ${ACCENT}55, ${ACCENT_TEAL}33)`
                          : "rgba(255,255,255,0.06)",
                    }}
                  />
                ) : null}
                <span className="text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">{ev.label}</span>
                <span className="line-clamp-2 text-center text-[9px] leading-tight text-slate-600">{ev.detail}</span>
              </motion.div>
            ))}
          </div>
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
  onSection,
}: {
  children: ReactNode;
  top: ReactNode;
  right: ReactNode;
  timelineInput: Parameters<typeof buildCommandTimeline>[0];
  section: SwarmSectionId;
  onSection: (id: SwarmSectionId) => void;
}) {
  const events = buildCommandTimeline(timelineInput);
  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#050607] text-slate-100"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(20,241,149,0.07), transparent 50%),
          radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56,215,208,0.06), transparent 40%),
          linear-gradient(180deg, #050607 0%, #020304 100%)
        `,
      }}
    >
      {top}
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <CommandSideNav section={section} onSection={onSection} />
        <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
          <main className="min-h-[50vh] flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:min-h-0 lg:max-h-[calc(100vh-8rem)]">{children}</main>
          <aside className="w-full shrink-0 border-t border-white/[0.06] bg-[#030508]/90 lg:w-[min(100%,380px)] lg:max-w-[380px] lg:border-l lg:border-t-0 lg:overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
            {right}
          </aside>
        </div>
      </div>
      <LiveTimelineStrip events={events} />
    </div>
  );
}

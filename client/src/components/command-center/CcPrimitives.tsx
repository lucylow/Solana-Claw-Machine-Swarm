import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, ShieldCheck } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

/* =============================================================================
 * Solana Command Center — visual primitives.
 *
 * These are deliberately small, opinionated building blocks that unify how
 * proof, live, pending, and idle states are rendered across the surface.
 *
 * Tokens:
 *   #14f195  — Solana green, primary verified accent.
 *   #38d7d0  — Teal, live execution accent.
 *   #fcc04b  — Amber, pending / policy-gated.
 *   #fb7185  — Rose, failed / degraded.
 * ============================================================================= */

export type CcTone = "idle" | "live" | "proof" | "warn" | "fail" | "info";

const TONE_RING: Record<CcTone, string> = {
  idle: "ring-white/10",
  live: "ring-[#38d7d0]/45",
  proof: "ring-[#14f195]/45",
  warn: "ring-amber-400/35",
  fail: "ring-rose-500/35",
  info: "ring-sky-400/30",
};

const TONE_FILL: Record<CcTone, string> = {
  idle: "bg-slate-600/60",
  live: "bg-[#38d7d0]",
  proof: "bg-[#14f195]",
  warn: "bg-amber-300",
  fail: "bg-rose-400",
  info: "bg-sky-300",
};

const TONE_TEXT: Record<CcTone, string> = {
  idle: "text-slate-400",
  live: "text-[#bdf6f0]",
  proof: "text-[#c8ffe8]",
  warn: "text-amber-100",
  fail: "text-rose-100",
  info: "text-sky-100",
};

const TONE_GLOW: Record<CcTone, string> = {
  idle: "",
  live: "shadow-[0_0_18px_rgba(56,215,208,0.35)]",
  proof: "shadow-[0_0_18px_rgba(20,241,149,0.4)]",
  warn: "shadow-[0_0_14px_rgba(252,192,75,0.25)]",
  fail: "shadow-[0_0_14px_rgba(251,113,133,0.3)]",
  info: "",
};

/**
 * Glowing status dot. Use for stage rails, telemetry rows, micro-status chips.
 * `pulse` should be reserved for in-flight steps.
 */
export function CcStatusDot({
  tone = "idle",
  pulse = false,
  size = "md",
  className,
}: {
  tone?: CcTone;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-3 w-3" : "h-2 w-2";
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 rounded-full",
        dim,
        TONE_FILL[tone],
        TONE_GLOW[tone],
        className,
      )}
    >
      {pulse ? (
        <span
          className={cn(
            "absolute inset-0 inline-flex animate-ping rounded-full opacity-50",
            TONE_FILL[tone],
          )}
        />
      ) : null}
    </span>
  );
}

/**
 * Premium glass panel. Replaces the ad-hoc `MissionPanel` styling so all
 * panels share consistent depth, border, and shadow vocabulary.
 */
export function CcPanel({
  className,
  tone = "idle",
  glow = false,
  children,
}: {
  className?: string;
  tone?: CcTone;
  glow?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-gradient-to-br from-[#0b1118]/95 via-[#070b10]/96 to-[#040609]/98 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.035)]",
        tone === "idle" && "border-white/[0.08]",
        tone === "live" && "border-[#38d7d0]/25",
        tone === "proof" && "border-[#14f195]/25",
        tone === "warn" && "border-amber-400/25",
        tone === "fail" && "border-rose-500/25",
        tone === "info" && "border-sky-400/20",
        glow && tone === "proof" && "cc-proof-glow",
        glow && tone === "live" && "cc-live-glow",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section header used inside panels. Gives every block a consistent
 * "kicker · title · status" scaffold so the page reads as a single document.
 */
export function CcSectionHeader({
  kicker,
  title,
  status,
  icon: Icon,
  className,
}: {
  kicker?: string;
  title: string;
  status?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-2",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon ? (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-[#14f195]">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <div className="min-w-0">
          {kicker ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87f7d0]/80">
              {kicker}
            </p>
          ) : null}
          <p className="mt-0.5 text-sm font-semibold tracking-tight text-slate-50">
            {title}
          </p>
        </div>
      </div>
      {status ? <div className="shrink-0">{status}</div> : null}
    </div>
  );
}

/**
 * Compact metric tile with a glowing micro-bar. Used to surface autonomy /
 * proof / memory counts in the right rail and hero.
 */
export function CcMetric({
  label,
  value,
  delta,
  tone = "idle",
  ratio,
  className,
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: CcTone;
  /** 0..1 fill ratio for the micro-bar */
  ratio?: number;
  className?: string;
}) {
  const fillPct = Math.max(0, Math.min(1, ratio ?? 0)) * 100;
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/38 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition hover:border-[#14f195]/25 hover:bg-black/48",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-lg font-semibold tabular-nums",
          tone === "proof" && "text-[#bcffd9]",
          tone === "live" && "text-[#bdf6f0]",
          tone === "warn" && "text-amber-200",
          tone === "fail" && "text-rose-200",
          tone === "idle" && "text-slate-100",
          tone === "info" && "text-sky-100",
        )}
      >
        {value}
      </p>
      {delta ? (
        <p className="mt-0.5 text-[10px] text-slate-500">{delta}</p>
      ) : null}
      {ratio != null ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className={cn("h-full rounded-full", TONE_FILL[tone])}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Cinematic mini-loop visualization. Renders an orbiting ring of the eight
 * canonical agent stages (wallet → skill → plan → execute → reflect → memory
 * → receipt → reputation) with the active stage glowing.
 *
 * Used in the hero and the landing page to convey "this is a live system,
 * not a static dashboard" in under three seconds.
 */
const ORBIT_NODES: Array<{ id: string; label: string; short: string }> = [
  { id: "wallet", label: "Solana wallet", short: "WAL" },
  { id: "skill", label: "Skill", short: "SK" },
  { id: "plan", label: "Plan", short: "PL" },
  { id: "execute", label: "Execute", short: "EX" },
  { id: "reflect", label: "Reflect", short: "RX" },
  { id: "memory", label: "Memory", short: "MEM" },
  { id: "receipt", label: "Receipt", short: "RCP" },
  { id: "reputation", label: "Reputation", short: "REP" },
];

export function CcMiniLoopOrbit({
  activeIndex = 0,
  size = 220,
  className,
  caption = "live system",
}: {
  /** 0..7 — which stage of the eight-stage loop is currently active. */
  activeIndex?: number;
  size?: number;
  className?: string;
  caption?: string;
}) {
  const radius = size * 0.42;
  const safeIdx =
    ((activeIndex % ORBIT_NODES.length) + ORBIT_NODES.length) %
    ORBIT_NODES.length;

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Solana agent loop · wallet, skill, plan, execute, reflect, memory, receipt, reputation"
    >
      {/* outer ring */}
      <svg
        className="absolute inset-0 cc-orbit"
        viewBox={`0 0 ${size} ${size}`}
        style={{ transformOrigin: "center" }}
      >
        <defs>
          <linearGradient id="cc-orbit-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14f195" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38d7d0" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#14f195" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#cc-orbit-grad)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
      </svg>

      {/* nodes */}
      {ORBIT_NODES.map((node, i) => {
        const angle = (i / ORBIT_NODES.length) * Math.PI * 2 - Math.PI / 2;
        const cx = size / 2 + Math.cos(angle) * radius;
        const cy = size / 2 + Math.sin(angle) * radius;
        const active = i === safeIdx;
        const done = i < safeIdx;
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: cx, top: cy }}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-[8px] font-bold tracking-wider transition",
                active &&
                  "border-[#14f195] bg-[#14f195]/15 text-[#c8ffe8] shadow-[0_0_18px_rgba(20,241,149,0.45)]",
                done && "border-[#14f195]/45 bg-[#14f195]/10 text-[#a4f5cd]",
                !active &&
                  !done &&
                  "border-white/15 bg-black/50 text-slate-500",
              )}
            >
              {node.short}
            </div>
          </div>
        );
      })}

      {/* center insignia */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14f195]/45 bg-[#14f195]/12 text-[#c8ffe8] shadow-[0_0_28px_rgba(20,241,149,0.34)]"
          >
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </motion.div>
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#87f7d0]/85">
            Solana
          </p>
          <p className="text-[10px] text-slate-400">{caption}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Heading-row "narrative bar" placed above complex modules to reinforce
 * where in the agent story the user is.
 */
export function CcNarrativeBar({
  steps,
  activeIndex,
  className,
}: {
  steps: readonly string[];
  activeIndex: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2",
        className,
      )}
    >
      {steps.map((label, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium",
                done && "bg-[#14f195]/14 text-[#c8ffe8]",
                active &&
                  "bg-[#38d7d0]/15 text-[#bdf6f0] shadow-[0_0_12px_rgba(56,215,208,0.3)]",
                !done && !active && "text-slate-600",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-3 w-3" aria-hidden />
              ) : active ? (
                <Activity className="h-3 w-3" aria-hidden />
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-700" />
              )}
              <span className="truncate">{label}</span>
            </span>
            {i < steps.length - 1 ? (
              <span aria-hidden className="text-slate-700">
                ·
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * "Why believe this?" evidence row — a single horizontally-scanning band
 * of proof artifact tags (tx, hash, storage ref). Encourages every claim
 * to be backed by a verifiable artifact in the UI itself.
 */
export function CcEvidenceBand({
  items,
  className,
}: {
  items: Array<{ kind: string; value: string; href?: string }>;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item) => {
        const inner = (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-slate-400",
              item.href &&
                "transition hover:border-[#14f195]/30 hover:text-[#c8ffe8]",
            )}
          >
            <span className="text-[#87f7d0]/80">{item.kind}</span>
            <span className="truncate max-w-[180px]">{item.value}</span>
          </span>
        );
        return item.href ? (
          <a
            key={`${item.kind}-${item.value}`}
            href={item.href}
            target="_blank"
            rel="noreferrer"
          >
            {inner}
          </a>
        ) : (
          <span key={`${item.kind}-${item.value}`}>{inner}</span>
        );
      })}
    </div>
  );
}

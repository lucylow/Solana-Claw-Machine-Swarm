import {
  ArrowRight,
  BookOpen,
  Cpu,
  Database,
  ExternalLink,
  GitBranch,
  Layers,
  LayoutGrid,
  Link2,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";
import { shortenAddress } from "@/lib/solana/format";
import {
  DEMO_AGENT_PLAN,
  DEMO_CHAIN_RECEIPT,
  DEMO_REFLECTION,
  DEMO_SKILLS,
} from "@shared/solana/demoCanonical";
import { STORY_LOOP_LABELS } from "@shared/copy";
import { StoryLoopRail } from "@/components/command-center/StoryLoopRail";
import { DappShell } from "./DappShell";
import { DappActionPanel } from "./DappActionPanel";
import { DappActivityTimeline } from "./DappActivityTimeline";
import type { DappActivityItem } from "./DappActivityTimeline";
import { DappBalanceCard } from "./DappBalanceCard";
import { DappCopyButton } from "./DappCopyButton";
import { DappEmptyState } from "./DappEmptyState";
import { DappExplorerLink } from "./DappExplorerLink";
import { DappOnchainTag } from "./DappOnchainTag";
import { DappProofPanel } from "./DappProofPanel";
import { DappSectionHeader } from "./DappSectionHeader";
import { DappWalletSummary } from "./DappWalletSummary";
import { useDappChainState } from "./useDappChainState";

/**
 * Solana dApp landing page.
 *
 * The hero is a wallet-first action surface (DappActionPanel) with the
 * proof rail in the same view, so the "wallet → action → tx → proof" loop
 * is visible above the fold instead of buried beneath marketing copy.
 */
export default function DappLanding() {
  const [, setLocation] = useLocation();
  const wallet = useSolanaWalletContext();
  const state = useDappChainState();

  const sessionVerified = state.sessionStatus === "verified";

  const liveReceipts = wallet.txHistory.length > 0 ? wallet.txHistory : [DEMO_CHAIN_RECEIPT];
  const demoIds = wallet.txHistory.length === 0 ? [DEMO_CHAIN_RECEIPT.id] : [];

  const landingStoryIndex = useMemo(() => {
    if (!state.connected) return 0;
    if (!sessionVerified) return 1;
    if (state.proofStatus === "verified") return STORY_LOOP_LABELS.length - 1;
    if (state.txSignature) return Math.min(7, STORY_LOOP_LABELS.length - 2);
    return 4;
  }, [state.connected, sessionVerified, state.proofStatus, state.txSignature]);

  const activity = useMemo<DappActivityItem[]>(() => {
    const fallback: DappActivityItem = {
      id: "fixture-receipt",
      kind: "receipt_anchored",
      status: "complete",
      title: "Sample receipt anchored",
      detail: "Demo fixture · sign your wallet to begin a live run.",
      txSignature: DEMO_CHAIN_RECEIPT.txSignature,
      account: DEMO_CHAIN_RECEIPT.account,
      timestamp: DEMO_CHAIN_RECEIPT.createdAt,
      demo: true,
    };

    const live: DappActivityItem[] = [
      {
        id: "wallet",
        kind: "wallet_connect",
        status: state.connected ? "complete" : "active",
        title: state.connected ? "Wallet connected" : "Connect a Solana wallet",
        detail: state.walletName ?? "Phantom · Solflare · Backpack",
        timestamp: undefined,
      },
      {
        id: "session",
        kind: "session_verify",
        status: sessionVerified
          ? "complete"
          : state.connected
            ? "active"
            : "pending",
        title: sessionVerified ? "Session verified" : "Sign the session message",
        detail: sessionVerified
          ? "Backend bearer attached to your wallet identity."
          : "Sign a human-readable message to authorize on-chain actions.",
      },
      {
        id: "skill",
        kind: "skill_selected",
        status: "pending",
        title: "Choose a published skill",
        detail: "Skills carry author wallet, content hash, and reputation.",
      },
      {
        id: "tx",
        kind: "tx_submitted",
        status: state.txSignature ? "complete" : "pending",
        title: state.txSignature
          ? "Last transaction submitted"
          : "Transaction submitted",
        detail: state.txSignature
          ? `sig ${state.txSignature.slice(0, 10)}…`
          : "The signed transaction goes to the cluster.",
        txSignature: state.txSignature,
      },
      {
        id: "anchor",
        kind: "receipt_anchored",
        status: state.txSignature ? "complete" : "pending",
        title: "Receipt anchored on Solana",
        detail: "Compact summary hash + storage ref settle on Solana.",
      },
      fallback,
    ];

    return live;
  }, [
    sessionVerified,
    state.connected,
    state.txSignature,
    state.walletName,
  ]);

  const heroDescription =
    "Connect a Solana wallet, sign a session, choose a published skill, and watch the on-chain receipt land in real time. Every action surface here is wallet-aware and explorer-verifiable.";

  const navLinks = (
    <nav className="flex items-center gap-1 text-[12px]">
      {[
        { href: "/skills", label: "Actions", Icon: LayoutGrid },
        { href: "/receipts", label: "Receipts", Icon: ReceiptText },
        { href: "/proofs", label: "Proofs", Icon: ShieldCheck },
        { href: "/onchain", label: "Onchain", Icon: Link2 },
        { href: "/how-it-works", label: "Docs", Icon: BookOpen },
      ].map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/[0.04] hover:text-[#d6ffe9]"
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );

  const sideRail = (
    <>
      <DappBalanceCard />
      <DappWalletSummary variant="block" />
      <DappProofPanel
        receipts={liveReceipts}
        cluster={state.cluster}
        proofStatus={state.proofStatus}
        demoIds={demoIds}
        description="Receipts are first-class objects: hash, signature, PDA, storage ref."
        extension={
          <Link
            href="/proofs"
            className="mt-2 inline-flex items-center gap-1 self-start rounded-full border border-[#14f195]/30 bg-[#14f195]/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[#d6ffe9] transition hover:bg-[#14f195]/12"
          >
            Open proof explorer
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      />
      <DappActivityTimeline
        items={activity}
        cluster={state.cluster}
        title="Onchain loop"
        description="The dApp story, end-to-end."
      />
    </>
  );

  return (
    <DappShell
      brand="CLAW MACHINE · SWARM"
      brandHref="/"
      topNav={navLinks}
      topRightSlot={
        <Button
          size="sm"
          variant="outline"
          className="hidden border-white/15 bg-white/[0.04] text-[11px] text-slate-200 hover:border-[#14f195]/40 hover:text-[#d6ffe9] sm:inline-flex"
          onClick={() => setLocation("/dashboard?section=overview")}
        >
          <Cpu className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Command center
        </Button>
      }
      sideRail={sideRail}
    >
      <DappActionPanel
        eyebrow="Solana dApp · live action surface"
        title="Connect wallet, sign session, run an onchain skill"
        description={heroDescription}
        Icon={Workflow}
        scope="onchain"
        primaryAction={{
          label: state.connected
            ? sessionVerified
              ? "Open command center"
              : "Sign session to continue"
            : "Connect Solana wallet",
          onClick: () => {
            if (state.connected && sessionVerified) {
              setLocation("/dashboard?section=overview");
              return;
            }
            wallet.connectAndVerify().catch(() => undefined);
          },
          busy: state.busy,
          walletHint:
            "Wallet connection is required for any onchain action — the dApp will read balance, sign a session, and produce verifiable receipts.",
        }}
        secondaryAction={
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-white/15 bg-white/[0.04] text-[11px] text-slate-200 hover:border-[#14f195]/40 hover:text-[#d6ffe9]"
            onClick={() => setLocation("/demo/hub")}
          >
            <PlayCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Replay demo loop
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionStat
            label="Wallet"
            value={
              state.walletAddress
                ? shortenAddress(state.walletAddress, 4, 4)
                : "Not connected"
            }
            tone={state.connected ? "good" : "neutral"}
          >
            {state.walletName ? (
              <span className="text-[10px] text-slate-400">{state.walletName}</span>
            ) : null}
            {state.walletAddress ? (
              <DappCopyButton
                value={state.walletAddress}
                label="Copy"
                variant="ghost"
              />
            ) : null}
          </ActionStat>
          <ActionStat
            label="Cluster"
            value={state.cluster}
            tone={state.wrongCluster ? "warn" : "good"}
          />
          <ActionStat
            label="Balance"
            value={
              state.balanceSol
                ? `${Number(state.balanceSol).toFixed(4)} SOL`
                : "—"
            }
            tone={state.connected ? "good" : "neutral"}
          />
          <ActionStat
            label="Session"
            value={sessionVerified ? "Verified" : state.sessionStatus}
            tone={sessionVerified ? "good" : "warn"}
            uppercase
          />
          <ActionStat
            label="Last signature"
            value={
              state.txSignature
                ? `${state.txSignature.slice(0, 6)}…${state.txSignature.slice(-4)}`
                : "—"
            }
            tone={state.txSignature ? "good" : "neutral"}
          >
            {state.txSignature ? (
              <DappExplorerLink
                kind="tx"
                value={state.txSignature}
                cluster={state.cluster}
                label="Open"
                variant="inline"
              />
            ) : null}
          </ActionStat>
          <ActionStat
            label="Proof"
            value={state.proofStatus}
            tone={
              state.proofStatus === "verified"
                ? "good"
                : state.proofStatus === "demo_only"
                  ? "demo"
                  : "warn"
            }
            uppercase
          />
        </div>
      </DappActionPanel>

      <section className="space-y-3" aria-labelledby="landing-story-heading">
        <h2 id="landing-story-heading" className="sr-only">
          Full Solana agent loop from wallet to explorer
        </h2>
        <StoryLoopRail
          activeIndex={landingStoryIndex}
          labels={STORY_LOOP_LABELS}
          className="border-[#14f195]/15 bg-[#060a0f]/90"
        />
        <p className="text-center text-[11px] text-slate-500">
          Wallet (on-chain identity) → verified session (backend) → plan and execution → reflection and memory
          (off-chain narrative) → compact receipt and PDA on Solana → Solana Explorer.
        </p>
      </section>

      <section className="space-y-4">
        <DappSectionHeader
          eyebrow="dApp loop"
          title="Wallet → action → transaction → receipt"
          description="Six explicit steps surface the same way on every page so the dApp story is consistent. No hidden state, no toast-only notifications."
          actions={
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-white/15 bg-white/[0.04] text-[11px] text-slate-200 hover:border-[#14f195]/40 hover:text-[#d6ffe9]"
              onClick={() => setLocation("/dashboard?section=overview")}
            >
              Open command center
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </Button>
          }
        />
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "1 · Connect wallet",
              detail: "Phantom, Solflare, Backpack — adapter-agnostic.",
              Icon: Wallet,
            },
            {
              label: "2 · Sign session",
              detail: "Bearer token bound to your Solana public key.",
              Icon: ShieldCheck,
            },
            {
              label: "3 · Choose action",
              detail: "Published skills with hash + reputation.",
              Icon: Sparkles,
            },
            {
              label: "4 · Sign + submit",
              detail: "Transaction lifecycle visible in real time.",
              Icon: GitBranch,
            },
            {
              label: "5 · Anchor receipt",
              detail: "Compact summary hash + PDA on Solana.",
              Icon: ReceiptText,
            },
            {
              label: "6 · Verify on Explorer",
              detail: "One-click open into Solana Explorer.",
              Icon: ExternalLink,
            },
          ].map((step) => (
            <article
              key={step.label}
              className="group flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#070b11]/95 to-[#040608]/95 p-4 transition hover:border-[#14f195]/30 hover:shadow-[0_18px_36px_rgba(20,241,149,0.08)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#14f195]/30 bg-[#14f195]/10 text-[#9cf6d8]">
                <step.Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7dccb8]">
                {step.label}
              </p>
              <p className="text-[11px] leading-snug text-slate-300">
                {step.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <DappSectionHeader
          eyebrow="Featured action"
          title="Pick a skill, run a verified loop"
          description="Each skill is a published asset with author wallet, content hash, and reputation. Selecting one starts a transaction-aware execution flow."
          actions={
            <Link
              href="/skills"
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-[#14f195]/40 hover:text-[#d6ffe9]"
            >
              Browse all actions
            </Link>
          }
        />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DEMO_SKILLS.slice(0, 3).map((skill) => (
            <article
              key={skill.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#070b11]/95 to-[#040608]/95 p-4 transition hover:border-[#14f195]/30"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#14f195]/35 bg-[#14f195]/10 text-[#9cf6d8]">
                  <Layers className="h-4 w-4" aria-hidden />
                </span>
                <DappOnchainTag scope="onchain" size="sm" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{skill.name}</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">
                  {skill.description}
                </p>
              </div>
              <dl className="grid gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
                <div className="flex items-center justify-between gap-2">
                  <dt>Author</dt>
                  <dd>
                    <DappCopyButton
                      value={skill.authorWallet}
                      label={shortenAddress(skill.authorWallet, 4, 4)}
                      variant="ghost"
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Hash</dt>
                  <dd className="font-mono text-slate-300">
                    {skill.contentHash}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Reputation</dt>
                  <dd className="text-[#9cf6d8]">{skill.reputationScore}</dd>
                </div>
              </dl>
              <Button
                size="sm"
                variant="outline"
                className="mt-1 rounded-full border-[#14f195]/40 bg-[#14f195]/[0.06] text-[11px] text-[#d6ffe9] hover:bg-[#14f195]/12"
                onClick={() => setLocation(`/skills/${skill.id}`)}
              >
                Open action
                <ArrowRight className="ml-1 h-3 w-3" aria-hidden />
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#070b11]/95 to-[#040608]/95 p-5">
          <DappSectionHeader
            eyebrow="Plan receipt"
            title="Latest plan · auditable from goal to anchor"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
            {DEMO_AGENT_PLAN.summary}
          </p>
          <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                Plan hash
              </p>
              <p className="mt-0.5 font-mono text-slate-200">
                {DEMO_AGENT_PLAN.planHash}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                Anchor signature
              </p>
              <p className="mt-0.5 font-mono text-slate-200">
                {DEMO_AGENT_PLAN.solana?.txSignature
                  ? shortenAddress(DEMO_AGENT_PLAN.solana.txSignature, 8, 8)
                  : "—"}
              </p>
            </div>
          </div>
          {DEMO_AGENT_PLAN.solana?.txSignature ? (
            <div className="mt-3">
              <DappExplorerLink
                kind="tx"
                value={DEMO_AGENT_PLAN.solana.txSignature}
                cluster={state.cluster}
                label="Verify anchor on Solana Explorer"
              />
            </div>
          ) : null}
        </article>

        <article className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#070b11]/95 to-[#040608]/95 p-5">
          <DappSectionHeader
            eyebrow="Reflection"
            title="Why the last action mattered"
          />
          <p className="text-[12px] leading-snug text-slate-300">
            {DEMO_REFLECTION.summary}
          </p>
          <p className="rounded-lg border border-[#14f195]/25 bg-[#14f195]/[0.06] px-3 py-2 text-[11px] text-[#d6ffe9]">
            Next action · {DEMO_REFLECTION.nextAction}
          </p>
          <DappEmptyState
            title="Memory + reflection feed"
            description="Open the command center to inspect every memory write and reflection chain."
            tone="default"
            Icon={Database}
            action={
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 text-[11px] text-slate-200 hover:border-[#14f195]/40 hover:text-[#d6ffe9]"
                onClick={() => setLocation("/dashboard?section=memory")}
              >
                Open memory feed
              </Button>
            }
          />
        </article>
      </section>
    </DappShell>
  );
}

function ActionStat({
  label,
  value,
  tone = "neutral",
  uppercase = false,
  children,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "neutral" | "demo";
  uppercase?: boolean;
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "border-[#14f195]/35 bg-[#14f195]/[0.06] text-[#d6ffe9]"
      : tone === "warn"
        ? "border-amber-400/40 bg-amber-500/[0.06] text-amber-100"
        : tone === "demo"
          ? "border-violet-400/40 bg-violet-500/[0.06] text-violet-100"
          : "border-white/10 bg-white/[0.04] text-slate-200";
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-semibold ${uppercase ? "uppercase tracking-wide" : ""}`}
      >
        {value}
      </p>
      {children ? (
        <div className="mt-1 text-[11px] opacity-80">{children}</div>
      ) : null}
    </div>
  );
}

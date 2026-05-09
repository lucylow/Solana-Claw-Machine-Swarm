import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Layers,
  Menu,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";
import { shortenAddress } from "@/lib/solana/format";
import { useDappChainState } from "./useDappChainState";

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
    >
      {children}
    </Link>
  );
}

function StepCard({
  number,
  title,
  description,
  active,
  complete,
  Icon,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
  complete?: boolean;
  Icon: LucideIcon;
}) {
  return (
    <article
      className={`rounded-3xl border p-6 transition ${
        complete
          ? "border-[#14f195]/35 bg-[#14f195]/10"
          : active
            ? "border-violet-400/35 bg-violet-500/10"
            : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Step {number}
        </span>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            complete
              ? "bg-[#14f195]/15 text-[#9cf6d8]"
              : active
                ? "bg-violet-500/15 text-violet-100"
                : "bg-white/8 text-slate-400"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

function FeatureCard({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: LucideIcon;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#14f195]/10 text-[#9cf6d8]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

export default function DappLanding() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const wallet = useSolanaWalletContext();
  const state = useDappChainState();
  const sessionVerified = state.sessionStatus === "verified";

  const connectPhantom = () => {
    wallet.connectAndVerify().catch(() => undefined);
  };

  const openDapp = () => {
    setMobileMenuOpen(false);
    setLocation("/dashboard?section=overview&demo=1");
  };

  const walletLabel = state.walletAddress
    ? shortenAddress(state.walletAddress, 4, 4)
    : "Not connected";

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070c] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[#14f195]/12 blur-3xl" />
        <div className="absolute right-[-10rem] top-64 h-[28rem] w-[28rem] rounded-full bg-violet-600/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,241,149,0.08),transparent_34%),linear-gradient(180deg,rgba(5,7,12,0)_0%,#05070c_78%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070c]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#14f195]/25 bg-[#14f195]/10 text-[#9cf6d8]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-[#9cf6d8]">
                Solana Claw Machine
              </span>
              <span className="block text-xs text-slate-500">SWARM demo</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] p-1 md:flex">
            <NavLink href="/">Home</NavLink>
            <a
              href="#how-it-works"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
            >
              How it works
            </a>
            <button
              type="button"
              onClick={openDapp}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
            >
              Launch dApp
            </button>
            <NavLink href="/submission">Submit</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={connectPhantom}
              className="rounded-full bg-[#14f195] px-5 text-sm font-semibold text-[#03120b] shadow-[0_0_28px_rgba(20,241,149,0.22)] hover:bg-[#7fffd0]"
            >
              <Wallet className="mr-2 h-4 w-4" aria-hidden />
              {state.connected ? walletLabel : "Connect Phantom"}
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 md:hidden"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <nav className="border-t border-white/10 px-5 py-4 md:hidden" aria-label="Mobile navigation">
            <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-2">
              <Link onClick={() => setMobileMenuOpen(false)} href="/" className="rounded-2xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
                Home
              </Link>
              <a onClick={() => setMobileMenuOpen(false)} href="#how-it-works" className="rounded-2xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
                How it works
              </a>
              <button type="button" onClick={openDapp} className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/10">
                Launch dApp
              </button>
              <Link onClick={() => setMobileMenuOpen(false)} href="/submission" className="rounded-2xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
                Submit
              </Link>
            </div>
          </nav>
        ) : null}
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.06fr_0.94fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#14f195]/25 bg-[#14f195]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9cf6d8]">
            <span className="h-2 w-2 rounded-full bg-[#14f195]" />
            Solana devnet · video-ready
          </div>
          <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            A clean Solana claw-machine agent demo.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Start with the landing page, connect Phantom, then open the dApp to show an agent action, Solana transaction receipt, memory write, and explorer-verifiable proof.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={connectPhantom}
              className="rounded-full bg-[#14f195] px-7 text-base font-semibold text-[#03120b] shadow-[0_0_40px_rgba(20,241,149,0.24)] hover:bg-[#7fffd0]"
            >
              <Wallet className="mr-2 h-5 w-5" aria-hidden />
              {state.connected ? "Phantom connected" : "Connect Phantom"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={openDapp}
              className="rounded-full border-white/15 bg-white/[0.04] px-7 text-base text-white hover:border-[#14f195]/40 hover:bg-white/[0.07]"
            >
              Open dApp
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-[#14f195]" aria-hidden />
              Normal landing page first
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-[#14f195]" aria-hidden />
              Phantom before dApp
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-[#14f195]" aria-hidden />
              Explorer proof path
            </span>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#080d14] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Current step
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {sessionVerified
                    ? "Ready for dApp"
                    : state.connected
                      ? "Sign Phantom session"
                      : "Connect Phantom"}
                </h2>
              </div>
              <span className="rounded-full border border-[#14f195]/25 bg-[#14f195]/10 px-3 py-1 text-xs font-semibold text-[#9cf6d8]">
                {state.cluster}
              </span>
            </div>

            <div className="mt-7 space-y-3">
              {[
                ["Wallet", walletLabel],
                ["Session", sessionVerified ? "Verified" : state.sessionStatus],
                ["Proof", state.proofStatus],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                >
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={openDapp}
              className="mt-6 w-full rounded-full bg-white px-5 text-[#05070c] hover:bg-[#dfffee]"
              disabled={state.busy}
            >
              Open demo dashboard
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          </div>
        </aside>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-5 py-16 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9cf6d8]">
            Simple recording flow
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">
            Three screens that make sense.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400">
            The public website now explains the product before opening the technical dApp dashboard. This keeps the video easy to follow for judges and viewers.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StepCard
            number="01"
            title="Landing page"
            description="Explain the Solana claw-machine agent, SWARM submission, and proof story in normal website language."
            Icon={Sparkles}
            complete
          />
          <StepCard
            number="02"
            title="Connect Phantom"
            description="Use Phantom as the Solana identity layer before opening the working dApp experience."
            Icon={Wallet}
            active={!sessionVerified}
            complete={state.connected}
          />
          <StepCard
            number="03"
            title="Open the dApp"
            description="Run the proof-linked demo loop, show receipts, and open Solana Explorer from the dashboard."
            Icon={Cpu}
            active
            complete={sessionVerified}
          />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Solana-native flow"
            description="The UI frames wallet identity, devnet status, transaction receipts, and explorer verification around Solana, not Ethereum."
            Icon={ShieldCheck}
          />
          <FeatureCard
            title="Agent action loop"
            description="The dashboard can still show skill selection, execution, reflection, memory, and proof anchoring after the clean landing page."
            Icon={Workflow}
          />
          <FeatureCard
            title="Submission ready"
            description="Navigation includes a dedicated submission page and a clean recording path for SWARM judges."
            Icon={Layers}
          />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-10 lg:px-8">
        <div className="rounded-[2rem] border border-[#14f195]/20 bg-[#14f195]/10 p-8 text-center md:p-12">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
            Ready to record the working Solana frontend?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Start here, connect Phantom, then enter the dApp dashboard when you are ready to demonstrate the full proof-linked loop.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={connectPhantom}
              className="rounded-full bg-[#14f195] px-7 text-[#03120b] hover:bg-[#7fffd0]"
            >
              Connect Phantom
            </Button>
            <Link
              href="/dashboard?section=overview&demo=1"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white transition hover:border-[#14f195]/40 hover:bg-white/[0.07]"
            >
              Open demo dashboard
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

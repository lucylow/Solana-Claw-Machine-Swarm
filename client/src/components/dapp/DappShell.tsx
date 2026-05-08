import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDappChainState } from "./useDappChainState";
import { DappTopBar } from "./DappTopBar";
import { DappMobileNav } from "./DappMobileNav";

/**
 * Solana dApp application shell.
 *
 * Stacks (top → bottom):
 *  - sticky DappTopBar with wallet, cluster, and tx lifecycle
 *  - optional cluster mismatch / degraded banner
 *  - main content (children) on the left
 *  - optional side rail for proof / receipts / balances
 *  - optional sticky activity timeline at the bottom of the viewport
 *  - mobile bottom nav (sm:hidden)
 *
 * Use it instead of a generic `<div className="container">…</div>` so every
 * primary page inherits the same wallet-first chrome.
 */
export function DappShell({
  children,
  topNav,
  topRightSlot,
  brand,
  brandHref,
  sideRail,
  sideRailPosition = "right",
  bottomBar,
  contentClassName,
  shellClassName,
  /** When true, the side rail collapses below the main content on small screens. */
  collapseRailOnMobile = true,
}: {
  children: ReactNode;
  topNav?: ReactNode;
  topRightSlot?: ReactNode;
  brand?: ReactNode;
  brandHref?: string;
  sideRail?: ReactNode;
  sideRailPosition?: "left" | "right";
  bottomBar?: ReactNode;
  contentClassName?: string;
  shellClassName?: string;
  collapseRailOnMobile?: boolean;
}) {
  const state = useDappChainState();

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col bg-[#04060a] text-slate-100",
        shellClassName
      )}
      style={{
        backgroundImage: `
          radial-gradient(ellipse 110% 70% at 50% -10%, rgba(20,241,149,0.08), transparent 55%),
          radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56,215,208,0.06), transparent 45%),
          radial-gradient(ellipse 60% 40% at 0% 100%, rgba(20,121,190,0.06), transparent 45%),
          linear-gradient(180deg, #04060a 0%, #02030a 100%)
        `,
      }}
    >
      <DappTopBar nav={topNav} rightSlot={topRightSlot} brand={brand} brandHref={brandHref} />

      {state.wrongCluster ? (
        <div className="border-b border-amber-400/30 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-100">
          <p className="mx-auto max-w-[1600px]">
            <strong className="font-semibold">Cluster mismatch.</strong> Wallet
            cluster does not match this dApp. Switch your wallet to{" "}
            <span className="font-mono">{state.cluster}</span> to unlock signing.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <div className="border-b border-rose-400/30 bg-rose-500/5 px-4 py-2 text-[11px] text-rose-100">
          <p className="mx-auto max-w-[1600px]">
            <strong className="font-semibold">Wallet error.</strong> {state.error}
          </p>
        </div>
      ) : null}

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row"
      >
        {sideRailPosition === "left" && sideRail ? (
          <aside
            className={cn(
              "w-full shrink-0 lg:max-w-[380px]",
              collapseRailOnMobile && "order-2 lg:order-none"
            )}
          >
            {sideRail}
          </aside>
        ) : null}
        <div
          className={cn(
            "min-w-0 flex-1 space-y-6",
            collapseRailOnMobile && sideRail ? "order-1 lg:order-none" : "",
            contentClassName
          )}
        >
          {children}
        </div>
        {sideRailPosition === "right" && sideRail ? (
          <aside
            className={cn(
              "w-full shrink-0 space-y-4 lg:max-w-[380px]",
              collapseRailOnMobile && "order-2 lg:order-none"
            )}
          >
            {sideRail}
          </aside>
        ) : null}
      </main>

      {bottomBar ? (
        <div className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-[#020306]/90 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 py-2 sm:px-6">
            {bottomBar}
          </div>
        </div>
      ) : null}

      <div className="h-16 sm:h-0" aria-hidden />
      <DappMobileNav />
    </div>
  );
}

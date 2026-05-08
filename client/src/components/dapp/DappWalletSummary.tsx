import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  ChevronDown,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldQuestion,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shortenAddress } from "@/lib/solana/format";
import { DappCopyButton } from "./DappCopyButton";
import { DappExplorerLink } from "./DappExplorerLink";
import { useDappChainState } from "./useDappChainState";

function WalletAvatar({ address, size = 28 }: { address?: string; size?: number }) {
  const seed = address ?? "no-wallet";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  const a = (Math.abs(h) % 360) | 0;
  const b = (a + 60) % 360;
  return (
    <span
      className="inline-flex shrink-0 rounded-full ring-2 ring-[#14f195]/30"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from ${a}deg, hsl(${a} 80% 55%), hsl(${b} 85% 60%), hsl(${a} 80% 55%))`,
      }}
      aria-hidden
    />
  );
}

/**
 * Wallet identity + session control surface.
 *
 * Inline mode (default) is dApp-style: avatar + truncated address + verify state
 * with a dropdown for copy/explorer/disconnect.
 *
 * Block mode renders a full dossier card.
 */
export function DappWalletSummary({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "block";
  className?: string;
}) {
  const wallet = useSolanaWalletContext();
  const state = useDappChainState();
  const [open, setOpen] = useState(false);

  const sessionVerified = state.sessionStatus === "verified";

  if (!state.connected) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          size="sm"
          className="rounded-full bg-[#14f195] font-semibold text-black shadow-[0_0_18px_rgba(20,241,149,0.35)] hover:bg-[#3bff96]"
          onClick={() => wallet.connectAndVerify().catch(() => undefined)}
          aria-label="Connect Solana wallet"
        >
          {state.busy ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Wallet className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          )}
          Connect wallet
        </Button>
        <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:inline">
          Solana wallet required
        </span>
      </div>
    );
  }

  if (variant === "block") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[#14f195]/30 bg-gradient-to-br from-[#0a120e]/95 to-[#06090c]/98 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <WalletAvatar address={state.walletAddress} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7dccb8]">
              {state.walletName ?? "Solana wallet"}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-white">
              {shortenAddress(state.walletAddress, 6, 6)}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              sessionVerified
                ? "border-[#14f195]/50 bg-[#14f195]/10 text-[#d6ffe9]"
                : "border-amber-400/40 bg-amber-500/10 text-amber-100"
            )}
          >
            {sessionVerified ? (
              <ShieldCheck className="h-3 w-3" aria-hidden />
            ) : (
              <ShieldQuestion className="h-3 w-3" aria-hidden />
            )}
            {sessionVerified ? "Session verified" : "Sign session"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {state.walletAddress ? (
            <DappCopyButton value={state.walletAddress} label="Copy address" />
          ) : null}
          <DappExplorerLink
            kind="address"
            value={state.walletAddress}
            cluster={state.cluster}
            label="Open wallet"
            variant="inline"
          />
          <Button
            size="sm"
            variant="outline"
            className="border-[#14f195]/35 bg-transparent text-[11px] text-[#d6ffe9] hover:bg-[#14f195]/10"
            onClick={() => wallet.connectAndVerify().catch(() => undefined)}
            disabled={state.busy}
          >
            {state.busy ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
            )}
            {sessionVerified ? "Refresh session" : "Sign session"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-400/30 text-[11px] text-rose-100 hover:bg-rose-500/10"
            onClick={() => wallet.disconnectWallet().catch(() => undefined)}
          >
            <LogOut className="mr-1 h-3 w-3" aria-hidden />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-1 pr-2.5 transition hover:border-[#14f195]/45 hover:bg-[#14f195]/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14f195]/60",
            className
          )}
          aria-label="Wallet menu"
        >
          <WalletAvatar address={state.walletAddress} />
          <span className="flex flex-col items-start leading-tight">
            <span className="font-mono text-[11px] text-slate-100">
              {shortenAddress(state.walletAddress, 4, 4)}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide">
              {sessionVerified ? (
                <ShieldCheck className="h-2.5 w-2.5 text-[#3bff96]" aria-hidden />
              ) : (
                <ShieldQuestion className="h-2.5 w-2.5 text-amber-300" aria-hidden />
              )}
              <span
                className={cn(
                  sessionVerified ? "text-[#9cf6d8]" : "text-amber-200"
                )}
              >
                {sessionVerified ? "Verified" : "Unverified"}
              </span>
            </span>
          </span>
          <ChevronDown
            className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-[#9cf6d8]"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-50 min-w-[19rem] rounded-2xl border border-white/10 bg-[#070b11] p-2 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7dccb8]">
          {state.walletName ?? "Solana wallet"}
        </DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <p className="font-mono text-xs text-slate-100">
            {shortenAddress(state.walletAddress, 6, 6)}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
            {state.balanceSol ? `${Number(state.balanceSol).toFixed(4)} SOL` : "—"} ·{" "}
            {state.cluster}
          </p>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          asChild
          className="cursor-pointer focus:bg-white/10 focus:text-white"
          onSelect={(e) => {
            e.preventDefault();
            if (state.walletAddress) {
              navigator.clipboard
                .writeText(state.walletAddress)
                .catch(() => undefined);
            }
            setOpen(false);
          }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-xs"
          >
            <span className="text-slate-400">Copy address</span>
          </button>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="cursor-pointer focus:bg-white/10 focus:text-white"
          onSelect={(e) => e.preventDefault()}
        >
          <a
            href={
              state.walletAddress
                ? `${state.explorerBaseUrl}/address/${state.walletAddress}?cluster=${state.cluster}`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-xs"
          >
            <span className="text-slate-400">Open on Solana Explorer</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="cursor-pointer focus:bg-white/10 focus:text-white"
          onSelect={(e) => {
            e.preventDefault();
            wallet.refreshBalance().catch(() => undefined);
          }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-xs"
          >
            <span className="text-slate-400">Refresh balance</span>
          </button>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          asChild
          className="cursor-pointer focus:bg-white/10 focus:text-white"
          onSelect={(e) => {
            e.preventDefault();
            wallet.connectAndVerify().catch(() => undefined);
          }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-[#9cf6d8]"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            {sessionVerified ? "Refresh signed session" : "Sign session message"}
          </button>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="cursor-pointer focus:bg-rose-500/10 focus:text-rose-100"
          onSelect={(e) => {
            e.preventDefault();
            wallet.disconnectWallet().catch(() => undefined);
          }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-rose-100"
          >
            <LogOut className="h-3 w-3" aria-hidden />
            Disconnect
          </button>
        </DropdownMenuItem>

        <div className="mt-1 border-t border-white/5 pt-2">
          <WalletMultiButton className="!h-8 !w-full !justify-center !rounded-lg !bg-white/[0.04] !text-[11px] !font-medium !text-slate-300 hover:!bg-white/[0.08]" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

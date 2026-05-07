import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { addressExplorerUrl } from "@/lib/solana/explorer";
import { formatSolBalance, shortenAddress } from "@/lib/solana/format";
import { WalletModalButton } from "@solana/wallet-adapter-react-ui";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { SolanaCopyButton } from "./SolanaCopyButton";
import { SolanaExplorerLink } from "./SolanaExplorerLink";
import { SolanaNetworkBadge } from "./SolanaNetworkBadge";
import { SolanaSessionBanner } from "./SolanaSessionBanner";

export function SolanaWalletPanel({ showDebug = false }: { showDebug?: boolean }) {
  const w = useSolanaWallet();

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#050a10]/95 to-[#070f18]/95 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Solana wallet · command surface</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Identity & session</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Connect a Solana wallet, verify a signed session, then publish skills, run agents, and anchor receipts with explorer
            proofs.
          </p>
        </div>
        <SolanaNetworkBadge cluster={w.cluster} wrong={w.walletState.connectionStatus === "wrong_cluster"} />
      </div>

      <SolanaSessionBanner
        verified={w.walletState.isSessionVerified}
        wrongCluster={w.walletState.connectionStatus === "wrong_cluster"}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Wallet</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <WalletModalButton className="wallet-adapter-button-trigger rounded-lg bg-[#3bff96] px-4 py-2 text-sm font-semibold text-black hover:bg-[#7dffbf]" />
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-slate-100"
              onClick={() => w.disconnectWallet()}
              disabled={!w.walletAddress}
            >
              Disconnect
            </Button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-200">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
                {w.walletName ?? "No adapter"}
              </Badge>
              {w.walletState.isSessionVerified ? (
                <Badge className="border-[#3bff96]/45 bg-[#3bff96]/15 text-[#e7fff3]">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
                  Session verified
                </Badge>
              ) : (
                <Badge variant="outline" className="border-cyan-400/35 text-cyan-100">
                  Session required
                </Badge>
              )}
            </div>
            <p className="font-mono text-base text-[#c9ffe8]">{w.walletAddress ? shortenAddress(w.walletAddress) : "—"}</p>
            <div className="flex flex-wrap gap-2">
              {w.walletAddress ? <SolanaCopyButton text={w.walletAddress} label="Copy address" /> : null}
              {w.walletAddress ? (
                <SolanaExplorerLink
                  kind="address"
                  value={w.walletAddress}
                  cluster={w.cluster}
                  label="Wallet on explorer"
                  buildUrl={addressExplorerUrl}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Balance · RPC</p>
          <div className="mt-3 flex items-center gap-3">
            <p className="text-3xl font-semibold text-white">{formatSolBalance(w.balanceSol)}</p>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="border-white/15"
              onClick={() => void w.refreshBalance()}
              disabled={!w.walletAddress || w.walletState.isBalanceLoading}
              aria-label="Refresh balance"
            >
              {w.walletState.isBalanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            RPC · <span className="font-mono text-slate-300">{w.rpcUrl}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-cyan-500 text-black hover:bg-cyan-400"
              disabled={
                !w.walletAddress || w.state === "signing" || w.state === "session_verifying" || w.state === "connecting"
              }
              onClick={() => w.connectAndVerify().catch(() => undefined)}
            >
              {w.state === "signing" || w.state === "session_verifying" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing…
                </>
              ) : (
                "Sign Solana session"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/35 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Permissions (backend attestation)</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(w.walletState.permissions).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
              <span className="text-xs text-slate-400">{k}</span>
              <Badge className={v ? "bg-[#3bff96]/15 text-[#d8ffe9]" : "bg-white/5 text-slate-400"}>{v ? "allowed" : "denied"}</Badge>
            </div>
          ))}
        </div>
      </div>

      {w.error ? (
        <div className="rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-50">
          <p className="font-semibold">Wallet or session error</p>
          <p className="mt-1 text-red-100/90">{w.error}</p>
          <p className="mt-2 text-xs text-red-200/80">Retry connect or signing from your Solana wallet extension.</p>
        </div>
      ) : null}

      {showDebug ? (
        <pre className="max-h-44 overflow-auto rounded-lg bg-black/60 p-3 text-[11px] text-slate-300">{JSON.stringify(w.walletState.diagnostics, null, 2)}</pre>
      ) : null}
    </div>
  );
}

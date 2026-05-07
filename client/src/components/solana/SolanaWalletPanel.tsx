import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";
import { addressExplorerUrl, txExplorerUrl } from "@/lib/solana/explorer";
import { shortenAddress } from "@/lib/solana/format";
import { SOLANA_COPY } from "@shared/copy";
import type { ZeroGIntegrationStatus } from "@shared/zerog";
import { ChevronDown, ChevronUp, Copy, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SolanaWalletPanel({ compact = false }: { compact?: boolean }) {
  const wallet = useSolanaWallet();
  const snap = wallet.walletState;
  const [zgIntegration, setZgIntegration] = useState<ZeroGIntegrationStatus | null>(null);

  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/zerog/integration");
        const body = (await res.json()) as { ok: boolean; data?: ZeroGIntegrationStatus };
        if (!cancelled && body.ok && body.data) setZgIntegration(body.data);
      } catch {
        if (!cancelled) setZgIntegration(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function copyAddress() {
    if (!snap.publicKey) return;
    await navigator.clipboard.writeText(snap.publicKey);
    toast.success(SOLANA_COPY.wallet.toastAddressCopied);
  }

  return (
    <section
      className={`rounded-2xl border border-[#3bff96]/25 bg-[#070b11]/95 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.45)] ${
        compact ? "p-3" : "p-5"
      }`}
      aria-label="Solana wallet panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-[#3bff96]/35 bg-[#3bff96]/10">
            <Wallet className="h-4 w-4 text-[#8cf8d4]" aria-hidden />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8ceada]">{SOLANA_COPY.wallet.panelTitle}</p>
            <p className="mt-1 font-mono text-sm text-white">
              {snap.publicKey ? shortenAddress(snap.publicKey, 6, 6) : SOLANA_COPY.wallet.notConnected}
            </p>
            <p className="text-[11px] text-slate-500">{wallet.walletName ?? "Adapter"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-100">
            {SOLANA_COPY.wallet.clusterBadge}: {snap.cluster}
          </span>
          {snap.isSessionVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#3bff96]/40 bg-[#3bff96]/10 px-2 py-0.5 text-[11px] text-[#c9ffe7]">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              {SOLANA_COPY.wallet.sessionVerifiedChip}
            </span>
          ) : (
            <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100">
              Solana session: {snap.sessionStatus}
            </span>
          )}
        </div>
      </div>

      <dl className={`mt-4 grid gap-3 text-xs ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
          <dt className="text-slate-500">{SOLANA_COPY.wallet.connectionState}</dt>
          <dd className="mt-0.5 capitalize text-slate-100">{snap.connectionStatus.replaceAll("_", " ")}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
          <dt className="text-slate-500">{SOLANA_COPY.wallet.balanceLabel}</dt>
          <dd className="mt-0.5 font-mono text-slate-100">
            {snap.balanceSol !== null ? `${snap.balanceSol} SOL` : snap.isBalanceLoading ? "…" : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
          <dt className="text-slate-500">{SOLANA_COPY.wallet.latestSignature}</dt>
          <dd className="mt-0.5 truncate font-mono text-[11px] text-slate-300">
            {snap.lastTxSignature ? shortenAddress(snap.lastTxSignature, 8, 6) : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-violet-500/20 bg-black/35 px-3 py-2">
          <dt className="text-slate-500">0G Storage + DA</dt>
          <dd className="mt-0.5 text-[11px] leading-snug text-slate-100">
            <span className="font-semibold capitalize text-[#c4b5fd]">{zgIntegration?.mode ?? "loading…"}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span>{zgIntegration?.storage.available ? "Storage path up" : "Storage path down"}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span>{zgIntegration?.da.available ? "DA path up" : "DA path down"}</span>
          </dd>
          {zgIntegration?.storage.lastUploadAt ? (
            <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
              Upload {zgIntegration.storage.lastUploadAt.slice(0, 19)}Z
            </p>
          ) : null}
          {zgIntegration?.da.lastRootHash ? (
            <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
              DA root {zgIntegration.da.lastRootHash.slice(0, 28)}…
            </p>
          ) : null}
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <WalletMultiButton className="wallet-adapter-button-trigger !rounded-lg !bg-[#132018] !font-semibold !text-[#c9ffe7]" />
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-slate-100"
          disabled={!snap.publicKey}
          onClick={() => copyAddress()}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {SOLANA_COPY.wallet.copyAddress}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-[#3bff96]/45 text-[#c9ffe7]"
          disabled={!snap.publicKey}
          onClick={() => window.open(addressExplorerUrl(snap.publicKey!, snap.cluster), "_blank", "noopener,noreferrer")}
        >
          {SOLANA_COPY.wallet.explorerAccount}
        </Button>
        {snap.lastTxSignature ? (
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-500/45 text-cyan-100"
            onClick={() =>
              window.open(txExplorerUrl(snap.lastTxSignature!, snap.cluster), "_blank", "noopener,noreferrer")
            }
          >
            {SOLANA_COPY.wallet.explorerTx}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="border-white/15 text-slate-200"
          disabled={!snap.publicKey || snap.isBalanceLoading}
          onClick={() => wallet.refreshBalance().catch(() => undefined)}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {SOLANA_COPY.wallet.refreshSolBalance}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-500/35 text-amber-100"
          disabled={!snap.publicKey}
          onClick={() => wallet.clearSession().catch(() => undefined)}
        >
          {SOLANA_COPY.wallet.clearCachedSession}
        </Button>
        <Button
          size="sm"
          className="bg-[#3bff96] text-black hover:bg-[#6bffbc]"
          onClick={() => wallet.connectAndVerify().catch(() => undefined)}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {snap.isSessionVerified ? SOLANA_COPY.wallet.signSolanaSessionAgain : SOLANA_COPY.wallet.connectVerify}
        </Button>
      </div>

      {!compact ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{SOLANA_COPY.wallet.permissionsTitle}</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-[#7dccb8] hover:text-[#b8ffe0]"
              onClick={() => setDebugOpen(!debugOpen)}
            >
              Debug state
              {debugOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
            <li>Publish skill (Solana program): {snap.permissions.canPublishSkill ? "yes" : "needs verified session"}</li>
            <li>Execute task: {snap.permissions.canExecuteTask ? "yes" : "needs verified session"}</li>
            <li>Anchor Solana receipt: {snap.permissions.canAnchorReceipt ? "yes" : "needs verified session"}</li>
          </ul>
          {debugOpen ? (
            <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/50 p-2 text-[10px] leading-relaxed text-slate-400">
              {JSON.stringify(snap, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

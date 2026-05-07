import { ExplorerLinkButton, SolanaStatusBadge } from "@/components/command-center/CommandCenterComponents";
import { addressExplorerUrl } from "@/lib/solana/explorer";
import { shortenAddress } from "@/lib/solana/format";
import { cn } from "@/lib/utils";
import { DEMO_WALLET } from "@shared/demoFixtures";
import { Copy, Wallet } from "lucide-react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";

export function DemoWalletCard({ presentationMode, glow }: { presentationMode?: boolean; glow?: boolean }) {
  const { walletConnectedDemo, setWalletConnectedDemo } = useDemo();

  return (
    <DemoPanel glow={glow} presentationMode={presentationMode} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#8ceada]">Solana wallet (demo)</p>
          <h3 className={cn("mt-1 font-semibold text-white", presentationMode ? "text-2xl" : "text-lg")}>
            Identity surface
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Connect simulates the first real action. After connect, signing and receipts stay Solana-native in copy and
            explorer links.
          </p>
        </div>
        <Wallet className="h-6 w-6 text-[#3bff96]" />
      </div>

      {!walletConnectedDemo ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-black/30 p-6 text-center">
          <p className="text-sm text-slate-300">Solana wallet disconnected (demo)</p>
          <p className="mt-2 text-xs text-slate-500">
            The demo simulates connect + sign once you continue — no funds move in mock mode.
          </p>
          <button
            type="button"
            onClick={() => setWalletConnectedDemo(true)}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#3bff96] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#6bffbc]"
          >
            Connect Solana wallet (demo)
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SolanaStatusBadge label="Connected · devnet" active />
            <SolanaStatusBadge label="Solana" active subtle />
            <SolanaStatusBadge label="Signing idle" subtle />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-xs text-slate-500">Address</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm text-white">{shortenAddress(DEMO_WALLET.address, 8, 8)}</span>
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  onClick={() => navigator.clipboard.writeText(DEMO_WALLET.address)}
                  aria-label="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-xs text-slate-500">SOL balance (mock)</p>
              <p className="mt-1 text-sm font-medium text-white">{DEMO_WALLET.balanceSol.toFixed(4)} SOL</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-xs text-slate-500">Cluster</p>
              <p className="mt-1 text-sm text-white">{DEMO_WALLET.cluster}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-xs text-slate-500">Solana receipts (mock tally)</p>
              <p className="mt-1 text-xs text-slate-300">3 receipts anchored today · 2 skills ranked in discovery</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExplorerLinkButton
              payload={{ label: "Open on Solana Explorer", url: addressExplorerUrl(DEMO_WALLET.address) }}
            />
            <button
              type="button"
              onClick={() => setWalletConnectedDemo(false)}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              Disconnect (demo)
            </button>
          </div>
        </div>
      )}
    </DemoPanel>
  );
}

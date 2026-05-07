import { Button } from "@/components/ui/button";
import { useSolanaWallet } from "@/hooks/solana/useSolanaWallet";

export function SolanaWalletDebug() {
  const w = useSolanaWallet();
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-black/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Solana wallet diagnostics</p>
        <Button type="button" size="sm" variant="outline" className="border-white/15 text-xs" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
      <pre className="mt-3 max-h-56 overflow-auto text-[11px] text-slate-300">{JSON.stringify(w.walletState, null, 2)}</pre>
    </div>
  );
}

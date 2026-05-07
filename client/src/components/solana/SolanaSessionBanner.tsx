import { cn } from "@/lib/utils";

export function SolanaSessionBanner({
  verified,
  wrongCluster,
  message,
}: {
  verified: boolean;
  wrongCluster: boolean;
  message?: string | null;
}) {
  if (wrongCluster) {
    return (
      <div
        className={cn(
          "rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-50",
          "flex flex-col gap-1"
        )}
        role="status"
      >
        <p className="font-semibold">Solana cluster mismatch</p>
        <p className="text-amber-100/85">
          Switch your wallet RPC to match this command center, then refresh the verified session.
        </p>
      </div>
    );
  }

  if (!verified) {
    return (
      <div
        className={cn(
          "rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50",
          "flex flex-col gap-1"
        )}
        role="status"
      >
        <p className="font-semibold">Solana session pending</p>
        <p className="text-cyan-100/85">
          Sign the human-readable verification message to authorize publishing, execution, and receipt anchoring for this
          wallet.
        </p>
        {message ? <p className="mt-2 whitespace-pre-wrap rounded-lg bg-black/30 p-3 font-mono text-xs">{message}</p> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[#3bff96]/40 bg-[#3bff96]/10 px-4 py-3 text-sm text-[#eafff4]",
        "flex flex-col gap-1"
      )}
      role="status"
    >
      <p className="font-semibold">Solana session verified</p>
      <p className="text-[#d5ffe9]/90">Backend attestation active — receipts and registry writes can use your wallet authority.</p>
    </div>
  );
}

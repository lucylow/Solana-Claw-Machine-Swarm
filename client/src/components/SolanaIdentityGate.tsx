import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import type { useSolanaIdentity } from "@/solana/useSolanaIdentity";

type IdentityState = ReturnType<typeof useSolanaIdentity>;

function formatAgo(value?: number | string) {
  if (!value) return "just now";
  const ts = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ts)) return "just now";
  const seconds = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SolanaIdentityGate({ identity }: { identity: IdentityState }) {
  return (
    <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-black via-slate-950 to-black p-6 md:p-8 shadow-[0_0_80px_rgba(34,211,238,0.15)]">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Solana-native identity gateway
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-cyan-100">
            Connect Solana wallet. Sign challenge. Become the agent.
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-300">
            CLAW binds session identity directly to your Solana wallet, verifies ownership with a signed challenge, then immediately loads your
            saved skills, memory, and Solana-anchored receipts.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <WalletMultiButton />
            <button
              className="inline-flex h-11 items-center rounded-md bg-cyan-500 px-4 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!identity.wallet.publicKey || identity.loading}
              onClick={() => {
                identity.connectAndVerify().catch(() => undefined);
              }}
            >
              {identity.loading ? "Verifying..." : "Sign & Verify"}
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-400/40 bg-transparent px-4 text-cyan-200 transition hover:bg-cyan-400/10"
              onClick={() => {
                identity.refreshIdentity().catch(() => undefined);
              }}
              disabled={!identity.wallet.publicKey || identity.loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              className="inline-flex h-11 items-center rounded-md border border-slate-600 px-4 text-slate-300 transition hover:border-slate-400"
              onClick={identity.disconnectIdentity}
            >
              Reset identity
            </button>
          </div>

          {identity.error ? (
            <div className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {identity.error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-200">
              status: {identity.status}
            </span>
            {identity.challenge?.issuedAt ? (
              <span className="rounded-full border border-slate-600 bg-slate-800/50 px-2 py-1 text-slate-300">
                challenge {formatAgo(identity.challenge.issuedAt)}
              </span>
            ) : null}
            {identity.profile?.verifiedAt ? (
              <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                verified {formatAgo(identity.profile.verifiedAt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-cyan-400">Identity badge</div>
              <h3 className="mt-1 text-lg font-semibold text-cyan-100">
                {identity.profile?.displayName || "Solana wallet–linked agent"}
              </h3>
            </div>
            <div
              className={`mt-1 h-3.5 w-3.5 rounded-full ${
                identity.status === "verified"
                  ? "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]"
                  : "bg-slate-500"
              }`}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-400">Solana wallet (adapter)</div>
              <div className="font-medium text-slate-100 break-all">
                {identity.wallet.publicKey?.toBase58() ?? "Not connected"}
              </div>
              {identity.cachedWalletHint ? (
                <div className="mt-1 text-[11px] text-amber-200">
                  Last known wallet (cached):{" "}
                  <span className="font-mono text-amber-100">{identity.cachedWalletHint}</span>
                </div>
              ) : null}
            </div>
            <div>
              <div className="text-slate-400">Reputation</div>
              <div className="font-semibold text-cyan-100">
                {(identity.profile?.reputation ?? 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Skills</div>
              <div className="font-semibold text-cyan-100">{identity.skills.length}</div>
            </div>
            <div>
              <div className="text-slate-400">Memories</div>
              <div className="font-semibold text-cyan-100">{identity.memories.length}</div>
            </div>
            <div>
              <div className="text-slate-400">Solana receipts</div>
              <div className="font-semibold text-cyan-100">{identity.receipts.length}</div>
            </div>
            <div>
              <div className="text-slate-400">State</div>
              <div className="inline-flex items-center gap-1.5 font-semibold text-cyan-100">
                <ShieldCheck className="h-4 w-4" />
                {identity.status}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-cyan-500/20 pt-3">
            <div className="text-slate-400 text-xs">Latest profile hash</div>
            <code className="mt-1 block text-xs text-slate-200 break-all">
              {identity.receipts[0]?.profileHash || "pending"}
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}

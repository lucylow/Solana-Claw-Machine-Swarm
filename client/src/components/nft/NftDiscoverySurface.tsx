import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { NftMintRecord } from "@shared/nft/types";
import { useMemo, useState } from "react";

export default function NftDiscoverySurface({
  mints = [],
}: {
  mints?: NftMintRecord[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mints;
    return mints.filter((m) =>
      [m.name, m.symbol, m.nftType, m.description, ...(m.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [mints, query]);

  return (
    <Card className="border-white/10 bg-[#070b11]/90 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">
            Discovery
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            NFTs in the CLAW ecosystem
          </h2>
        </div>
        <Input
          placeholder="Search NFTs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs border-white/10 bg-white/5"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filtered.map((nft) => (
          <article
            key={nft.mint}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <strong className="text-[#ddffe8]">{nft.name}</strong>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                {nft.nftType}
              </span>
            </div>
            <p className="mt-2 break-all font-mono text-xs text-slate-500">
              {nft.mint}
            </p>
            <p className="mt-2 text-sm text-slate-400">{nft.description}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}

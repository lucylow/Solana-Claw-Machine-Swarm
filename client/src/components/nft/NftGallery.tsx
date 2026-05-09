import { Card } from "@/components/ui/card";
import type { NftMintRecord } from "@shared/nft/types";

export default function NftGallery({
  mints = [],
}: {
  mints?: NftMintRecord[];
}) {
  return (
    <Card className="border-white/10 bg-[#070b11]/90 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">
            NFTs
          </p>
          <h2 className="mt-1 text-xl font-semibold">Recent mints</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
          {mints.length} items
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {mints.map((nft) => (
          <article
            key={nft.mint}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <strong className="text-[#ddffe8]">{nft.name}</strong>
              <span className="shrink-0 rounded-full border border-[#3bff96]/30 px-2 py-0.5 text-xs text-[#b8ffe0]">
                {nft.nftType}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{nft.symbol}</p>
            <p className="mt-1 text-xs text-slate-400">
              Owner: {nft.owner.slice(0, 4)}…{nft.owner.slice(-4)}
            </p>
            <p className="mt-1 break-all text-xs text-slate-500">{nft.uri}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {nft.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#3bff96]/25 bg-[#3bff96]/10 px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

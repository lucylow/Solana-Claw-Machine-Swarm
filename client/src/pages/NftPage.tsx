import NftDiscoverySurface from "@/components/nft/NftDiscoverySurface";
import NftGallery from "@/components/nft/NftGallery";
import NftMintPanel from "@/components/nft/NftMintPanel";
import { Button } from "@/components/ui/button";
import { nftApi } from "@/nft/nftApi";
import type { NftMintRecord } from "@shared/nft/types";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function NftPage() {
  const [, setLocation] = useLocation();
  const [mints, setMints] = useState<NftMintRecord[]>([]);

  const refreshMints = useCallback(async () => {
    try {
      const list = await nftApi.getMints();
      setMints(list);
    } catch {
      setMints([]);
    }
  }, []);

  useEffect(() => {
    void refreshMints();
  }, [refreshMints]);

  return (
    <div className="min-h-screen bg-[#030507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(36,208,170,0.12),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(20,120,160,0.12),transparent_40%)]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#b8ffe0]"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Home
            </Button>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">
                CLAW MACHINE
              </p>
              <h1 className="text-lg font-semibold">Solana NFT module</h1>
            </div>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      <main className="container relative z-10 space-y-6 py-8">
        <NftMintPanel
          onMinted={() => {
            void refreshMints();
          }}
        />
        <NftGallery mints={mints} />
        <NftDiscoverySurface mints={mints} />
      </main>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nftApi } from "@/nft/nftApi";
import type { NftMintRecord } from "@shared/nft/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";

const NFT_TYPES: { value: NftMintRecord["nftType"]; label: string }[] = [
  { value: "badge", label: "Badge" },
  { value: "membership", label: "Membership" },
  { value: "achievement", label: "Achievement" },
  { value: "receipt", label: "Receipt" },
  { value: "collectible", label: "Collectible" },
];

export default function NftMintPanel({ onMinted }: { onMinted?: (m: NftMintRecord) => void }) {
  const wallet = useWallet();
  const [collection, setCollection] = useState<Awaited<ReturnType<typeof nftApi.getCollection>>>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "CLAW Badge #1",
    symbol: "CLAW",
    uri: "https://example.com/metadata.json",
    description: "A CLAW MACHINE Solana NFT.",
    nftType: "badge" as NftMintRecord["nftType"],
    tags: "claw,machine,solana",
  });

  async function loadCollection() {
    setLoading(true);
    setMessage("");
    try {
      const data = await nftApi.getCollection();
      setCollection(data);
    } catch (e) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  async function createCollection() {
    setLoading(true);
    setMessage("");
    try {
      const data = await nftApi.createCollection({
        name: "CLAW Collection",
        symbol: "CLAW",
        uri: "https://example.com/collection.json",
        description: "CLAW MACHINE NFT collection",
        maxSupply: 1000,
      });
      setCollection(data);
      setMessage("Collection created.");
    } catch (e) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  async function mint() {
    if (!wallet.publicKey) {
      setMessage("Connect a wallet first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await nftApi.mint({
        owner: wallet.publicKey.toBase58(),
        name: form.name,
        symbol: form.symbol,
        uri: form.uri,
        description: form.description,
        nftType: form.nftType,
        tags: form.tags
          .split(",")
          .map(s => s.trim())
          .filter(Boolean),
      });
      setMessage(`Minted ${data.name}`);
      onMinted?.(data);
    } catch (e) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  async function freeze() {
    setLoading(true);
    setMessage("");
    try {
      const data = await nftApi.freeze();
      setCollection(data);
      setMessage("Collection frozen.");
    } catch (e) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  const shortPk = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}…${wallet.publicKey.toBase58().slice(-4)}`
    : "No wallet";

  return (
    <Card className="border-white/10 bg-[#070b11]/90 p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">Solana NFT</p>
          <h2 className="mt-1 text-xl font-semibold">Mint a CLAW NFT</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Demo flow uses a local catalog backed by <code className="text-[#9dfbf5]">data/claw-nft.json</code>. Wire{" "}
            <code className="text-[#9dfbf5]">ClawNftClient</code> to your deployed program for real mints.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{shortPk}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" className="border-white/20" disabled={loading} onClick={() => loadCollection()}>
          Load collection
        </Button>
        <Button className="bg-[#3bff96] text-black hover:bg-[#6bffbc]" disabled={loading} onClick={() => createCollection()}>
          Create collection
        </Button>
        <Button className="bg-[#38d7d0] text-black hover:bg-[#6bf5ee]" disabled={loading} onClick={() => mint()}>
          Mint NFT
        </Button>
        <Button variant="destructive" disabled={loading} onClick={() => freeze()}>
          Freeze collection
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border-white/10 bg-white/5"
          />
        </div>
        <div className="space-y-2">
          <Label>Symbol</Label>
          <Input
            value={form.symbol}
            onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
            className="border-white/10 bg-white/5"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Metadata URI</Label>
          <Input
            value={form.uri}
            onChange={e => setForm(f => ({ ...f, uri: e.target.value }))}
            className="border-white/10 bg-white/5"
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            value={form.nftType}
            onChange={e => setForm(f => ({ ...f, nftType: e.target.value as NftMintRecord["nftType"] }))}
            className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            {NFT_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="border-white/10 bg-white/5"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Tags (comma-separated)</Label>
          <Input
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="border-white/10 bg-white/5"
          />
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-[#3bff96]/25 bg-[#3bff96]/10 px-4 py-3 text-sm text-[#d1ffe8]">
          {message}
        </div>
      ) : null}

      {collection ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong>{collection.name}</strong>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
              {collection.totalMinted}/{collection.maxSupply}
            </span>
          </div>
          <p className="mt-2 break-all text-xs text-slate-400">Mint: {collection.collectionMint}</p>
          <p className="mt-1 text-xs text-slate-400">Frozen: {String(collection.frozen)}</p>
        </div>
      ) : null}
    </Card>
  );
}

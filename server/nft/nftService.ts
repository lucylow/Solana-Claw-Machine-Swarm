import { Keypair } from "@solana/web3.js";
import type { CreateNftCollectionRequest, CreateNftRequest, NftMintRecord } from "@shared/nft/types";
import { NftStore } from "./nftStore";

export class NftService {
  constructor(private readonly store: NftStore) {}

  getCollection() {
    return this.store.getCollection() ?? null;
  }

  async createCollection(input: CreateNftCollectionRequest) {
    const now = Date.now();
    const collectionMint = Keypair.generate().publicKey;

    const collection = {
      ...input,
      totalMinted: 0,
      frozen: false,
      createdAt: now,
      updatedAt: now,
      collectionMint: collectionMint.toBase58(),
    };

    await this.store.setCollection(collection);
    return collection;
  }

  async mint(input: CreateNftRequest) {
    const collection = this.store.getCollection();
    if (!collection) throw new Error("Collection not initialized");
    if (collection.frozen) throw new Error("Collection is frozen");
    if (collection.totalMinted >= collection.maxSupply) throw new Error("Max supply reached");

    const now = Date.now();
    const mint = Keypair.generate().publicKey.toBase58();

    const record: NftMintRecord = {
      mint,
      owner: input.owner,
      collectionMint: collection.collectionMint || "",
      nftType: input.nftType,
      name: input.name,
      symbol: input.symbol,
      uri: input.uri,
      description: input.description,
      tags: input.tags,
      createdAt: now,
    };

    await this.store.addMint(record);
    return record;
  }

  async freezeCollection() {
    const collection = this.store.getCollection();
    if (!collection) throw new Error("Collection not initialized");
    const next = { ...collection, frozen: true, updatedAt: Date.now() };
    await this.store.setCollection(next);
    return next;
  }

  listMints() {
    return this.store.listMints();
  }

  listMintsByOwner(owner: string) {
    return this.store.listMintsByOwner(owner);
  }

  getMint(mint: string) {
    return this.store.getByMint(mint);
  }
}

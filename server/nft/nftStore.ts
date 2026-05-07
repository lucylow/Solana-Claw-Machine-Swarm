import fs from "fs/promises";
import path from "path";
import type { NftCollectionState, NftMintRecord } from "@shared/nft/types";

type State = {
  collection?: NftCollectionState;
  mints: NftMintRecord[];
};

const EMPTY: State = { mints: [] };

export class NftStore {
  private state: State = structuredClone(EMPTY);

  constructor(private readonly filePath?: string) {}

  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw) as State;
    } catch {
      this.state = structuredClone(EMPTY);
    }
  }

  private async persist() {
    if (!this.filePath) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  async setCollection(collection: NftCollectionState) {
    this.state.collection = collection;
    await this.persist();
    return collection;
  }

  getCollection() {
    return this.state.collection;
  }

  async addMint(record: NftMintRecord) {
    this.state.mints.unshift(record);
    this.state.collection = this.state.collection
      ? {
          ...this.state.collection,
          totalMinted: this.state.collection.totalMinted + 1,
          updatedAt: Date.now(),
        }
      : this.state.collection;
    await this.persist();
    return record;
  }

  listMints() {
    return [...this.state.mints];
  }

  listMintsByOwner(owner: string) {
    return this.state.mints.filter(m => m.owner === owner);
  }

  getByMint(mint: string) {
    return this.state.mints.find(m => m.mint === mint);
  }
}

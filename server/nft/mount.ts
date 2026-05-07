import express from "express";
import path from "path";
import { registerNftRoutes } from "./nftRoutes";
import { NftService } from "./nftService";
import { NftStore } from "./nftStore";

export async function mountNft(app: express.Express) {
  const store = new NftStore(path.join(process.cwd(), "data", "claw-nft.json"));
  await store.init();

  const service = new NftService(store);
  registerNftRoutes(app, service);

  return { store, service };
}

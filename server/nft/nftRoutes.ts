import type { Express } from "express";
import { NftService } from "./nftService";

export function registerNftRoutes(app: Express, nftService: NftService) {
  app.post("/api/nft/collection/create", async (req, res) => {
    try {
      const data = await nftService.createCollection(req.body);
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "create_collection_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.get("/api/nft/collection", (_req, res) => {
    res.json({ ok: true, data: nftService.getCollection() });
  });

  app.post("/api/nft/mint", async (req, res) => {
    try {
      const data = await nftService.mint(req.body);
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "mint_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.get("/api/nft/mints", (_req, res) => {
    res.json({ ok: true, data: nftService.listMints() });
  });

  app.get("/api/nft/mints/:owner", (req, res) => {
    res.json({ ok: true, data: nftService.listMintsByOwner(req.params.owner) });
  });

  app.get("/api/nft/mint/:mint", (req, res) => {
    const data = nftService.getMint(req.params.mint);
    if (!data)
      return res.status(404).json({ ok: false, error: "mint_not_found" });
    res.json({ ok: true, data });
  });

  app.post("/api/nft/freeze", async (_req, res) => {
    try {
      const data = await nftService.freezeCollection();
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "freeze_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
}

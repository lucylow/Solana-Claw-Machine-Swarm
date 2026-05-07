import path from "path";
import type { Express } from "express";
import { DaoStore } from "./daoStore";
import { DaoService } from "./daoService";
import { registerDaoRoutes } from "./daoRoutes";

export async function mountDao(app: Express) {
  const store = new DaoStore(path.join(process.cwd(), "data", "claw-dao.json"));
  await store.init();

  const service = new DaoService(store);
  await service.bootstrap();

  registerDaoRoutes(app, service);
  return { store, service };
}

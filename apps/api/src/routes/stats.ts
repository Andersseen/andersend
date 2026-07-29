import { getDashboardStats } from "@andersseen/database";
import { Hono } from "hono";
import type { AppEnv } from "../types";

export const statsRoute = new Hono<AppEnv>();

statsRoute.get("/", async (c) => {
  const stats = await getDashboardStats(c.env.DB, c.get("projectId"));
  return c.json(stats);
});

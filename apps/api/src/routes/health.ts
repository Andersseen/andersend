import type { HealthResponse } from "@andersseen/contracts";
import { Hono } from "hono";
import { readEmailProvider } from "../lib/provider-factory";
import type { AppEnv } from "../types";

export const healthRoute = new Hono<AppEnv>();

healthRoute.get("/", async (c) => {
  let database: HealthResponse["database"] = "connected";
  try {
    await c.env.DB.prepare("SELECT 1").first();
  } catch {
    database = "error";
  }

  const body: HealthResponse = {
    name: "andersend",
    status: database === "connected" ? "ok" : "error",
    environment: c.env.ENVIRONMENT,
    provider: readEmailProvider(c.env) === "cloudflare" ? "cloudflare" : "mock",
    timestamp: new Date().toISOString(),
    database,
  };

  return c.json(body, database === "connected" ? 200 : 503);
});

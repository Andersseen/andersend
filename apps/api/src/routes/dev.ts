import { buildSeedStatements } from "@andersseen/database/seed";
import { Hono } from "hono";
import { AppError } from "../lib/errors";
import { isProduction } from "../lib/environment";
import type { AppEnv } from "../types";

export const devRoute = new Hono<AppEnv>();

/**
 * Resets and reseeds local data. Returns 404 (not 403) in production so the
 * route's existence isn't disclosed at all outside local development.
 */
devRoute.post("/reset", async (c) => {
  if (isProduction(c.env)) {
    throw new AppError("not_found", "Not found");
  }

  const statements = await buildSeedStatements();
  const prepared = statements.map((statement) => c.env.DB.prepare(statement.sql).bind(...statement.params));
  await c.env.DB.batch(prepared);

  return c.json({ status: "reseeded" });
});

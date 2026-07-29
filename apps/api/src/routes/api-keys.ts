import { listApiKeys } from "@andersseen/database";
import { Hono } from "hono";
import type { AppEnv } from "../types";

export const apiKeysRoute = new Hono<AppEnv>();

apiKeysRoute.get("/", async (c) => {
  const keys = await listApiKeys(c.env.DB, c.get("projectId"));
  return c.json({
    data: keys.map((key) => ({
      id: key.id,
      projectId: key.project_id,
      name: key.name,
      prefix: key.prefix,
      lastUsedAt: key.last_used_at,
      createdAt: key.created_at,
      revokedAt: key.revoked_at,
    })),
  });
});

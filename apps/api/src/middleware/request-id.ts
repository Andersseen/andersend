import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";

export const requestIdMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const id = crypto.randomUUID();
  c.set("requestId", id);
  c.header("X-Request-Id", id);
  await next();
});

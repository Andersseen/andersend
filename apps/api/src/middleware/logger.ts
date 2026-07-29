import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";

export const requestLoggerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  await next();

  console.log(
    JSON.stringify({
      level: "info",
      requestId: c.get("requestId"),
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    }),
  );
});

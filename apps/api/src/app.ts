import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { requestLoggerMiddleware } from "./middleware/logger";
import { requestIdMiddleware } from "./middleware/request-id";
import { apiKeysRoute } from "./routes/api-keys";
import { devRoute } from "./routes/dev";
import { emailsRoute } from "./routes/emails";
import { healthRoute } from "./routes/health";
import { statsRoute } from "./routes/stats";
import { templatesRoute } from "./routes/templates";
import type { AppEnv } from "./types";

const DEFAULT_CORS_ORIGINS = ["http://localhost:5173"];

/** `CORS_ORIGINS` is a comma-separated allow-list; unset/empty falls back to the local dashboard. */
export function readCorsOrigins(env: Env): string[] {
  const raw: string = env.CORS_ORIGINS;
  const configured = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_CORS_ORIGINS;
}

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", requestIdMiddleware);
  app.use("*", requestLoggerMiddleware);
  app.use(
    "*",
    cors({
      origin: (origin, c) =>
        readCorsOrigins(c.env).includes(origin) ? origin : null,
      allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  );
  app.onError(errorHandler);

  app.route("/health", healthRoute);

  app.use("/v1/*", authMiddleware);
  app.route("/v1/stats", statsRoute);
  app.route("/v1/emails", emailsRoute);
  app.route("/v1/templates", templatesRoute);
  app.route("/v1/api-keys", apiKeysRoute);
  app.route("/v1/dev", devRoute);

  return app;
}

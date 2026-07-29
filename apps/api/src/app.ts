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

const DASHBOARD_LOCAL_ORIGIN = "http://localhost:5173";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", requestIdMiddleware);
  app.use("*", requestLoggerMiddleware);
  app.use(
    "*",
    cors({
      origin: DASHBOARD_LOCAL_ORIGIN,
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

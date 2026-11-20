import { touchApiKeyLastUsed } from "@andersseen/database";
import { createMiddleware } from "hono/factory";
import { CompositeApiKeyAuthProvider } from "../lib/auth-provider";
import { AppError } from "../lib/errors";
import type { AppEnv } from "../types";

const authProvider = new CompositeApiKeyAuthProvider();

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;

  if (!token) {
    throw new AppError(
      "unauthorized",
      "Missing or malformed Authorization header",
    );
  }

  const result = await authProvider.authenticate(token, c.env);
  if (!result) {
    throw new AppError("unauthorized", "Invalid API key");
  }

  if (result.apiKeyId) {
    // Off the request's critical path: the response doesn't wait for this write.
    c.executionCtx.waitUntil(
      touchApiKeyLastUsed(c.env.DB, result.apiKeyId, new Date().toISOString()),
    );
  }

  c.set("projectId", result.projectId);
  await next();
});

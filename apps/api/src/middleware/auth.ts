import { createMiddleware } from "hono/factory";
import { DevApiKeyAuthProvider } from "../lib/auth-provider";
import { AppError } from "../lib/errors";
import type { AppEnv } from "../types";

const authProvider = new DevApiKeyAuthProvider();

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;

  if (!token) {
    throw new AppError("unauthorized", "Missing or malformed Authorization header");
  }

  const result = await authProvider.authenticate(token, c.env);
  if (!result) {
    throw new AppError("unauthorized", "Invalid API key");
  }

  c.set("projectId", result.projectId);
  await next();
});

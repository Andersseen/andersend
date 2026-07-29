import { API_ERROR_STATUS } from "@andersseen/contracts";
import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "../lib/errors";
import type { AppEnv } from "../types";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get("requestId") ?? "unknown";

  if (err instanceof AppError) {
    const status = API_ERROR_STATUS[err.code] as ContentfulStatusCode;
    return c.json(
      { error: { code: err.code, message: err.message, requestId, details: err.details } },
      status,
    );
  }

  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      message: err.message,
      stack: err.stack,
    }),
  );

  return c.json(
    { error: { code: "internal_error", message: "Something went wrong", requestId } },
    500,
  );
};

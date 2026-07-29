import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { AppError } from "./errors";

/**
 * Wraps `@hono/zod-validator` so every validation failure produces our
 * standard `ApiError` envelope instead of the library's default response.
 */
export function validate<T extends ZodType>(target: "json" | "query" | "param", schema: T) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new AppError("validation_error", "Request validation failed", result.error.issues);
    }
  });
}

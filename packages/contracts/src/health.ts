import { z } from "zod";

export const EMAIL_PROVIDERS = ["mock", "cloudflare"] as const;
export const emailProviderSchema = z.enum(EMAIL_PROVIDERS);
export type EmailProviderName = z.infer<typeof emailProviderSchema>;

export const healthResponseSchema = z.object({
  name: z.literal("andersend"),
  status: z.enum(["ok", "error"]),
  environment: z.string(),
  provider: emailProviderSchema,
  timestamp: z.string(),
  database: z.enum(["connected", "error"]),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

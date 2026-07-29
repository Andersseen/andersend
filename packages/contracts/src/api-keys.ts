import { z } from "zod";

export const apiKeySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  prefix: z.string(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const apiKeyListResponseSchema = z.object({
  data: z.array(apiKeySchema),
});

export type ApiKeyListResponse = z.infer<typeof apiKeyListResponseSchema>;

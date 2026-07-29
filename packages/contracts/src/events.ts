import { z } from "zod";

export const EMAIL_EVENT_TYPES = [
  "queued",
  "processing",
  "sent",
  "delivered",
  "failed",
] as const;

export const emailEventTypeSchema = z.enum(EMAIL_EVENT_TYPES);

export type EmailEventType = z.infer<typeof emailEventTypeSchema>;

export const emailEventSchema = z.object({
  id: z.string(),
  emailId: z.string(),
  type: emailEventTypeSchema,
  payload: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});

export type EmailEvent = z.infer<typeof emailEventSchema>;

export const emailEventListResponseSchema = z.object({
  data: z.array(emailEventSchema),
});

export type EmailEventListResponse = z.infer<typeof emailEventListResponseSchema>;

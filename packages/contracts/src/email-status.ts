import { z } from "zod";

export const EMAIL_STATUSES = [
  "queued",
  "processing",
  "sent",
  "delivered",
  "failed",
] as const;

export const emailStatusSchema = z.enum(EMAIL_STATUSES);

export type EmailStatus = z.infer<typeof emailStatusSchema>;

/**
 * Valid forward transitions for the email lifecycle. Used by email-core to
 * reject out-of-order status updates when processing queue messages.
 */
export const EMAIL_STATUS_TRANSITIONS: Record<EmailStatus, EmailStatus[]> = {
  queued: ["processing", "failed"],
  processing: ["sent", "delivered", "failed"],
  sent: ["delivered", "failed"],
  delivered: [],
  failed: [],
};

export function canTransitionEmailStatus(
  from: EmailStatus,
  to: EmailStatus,
): boolean {
  if (from === to) return false;
  return EMAIL_STATUS_TRANSITIONS[from].includes(to);
}

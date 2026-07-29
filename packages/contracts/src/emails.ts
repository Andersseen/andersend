import { z } from "zod";
import { emailStatusSchema } from "./email-status";
import { paginatedResponseSchema, paginationQuerySchema } from "./pagination";
import { emailAddressSchema, slugSchema, templateVariablesSchema } from "./shared";

export const sendEmailRequestSchema = z
  .object({
    from: emailAddressSchema.optional(),
    to: z.array(emailAddressSchema).min(1).max(50),
    cc: z.array(emailAddressSchema).max(50).optional(),
    bcc: z.array(emailAddressSchema).max(50).optional(),
    replyTo: emailAddressSchema.optional(),
    subject: z.string().trim().min(1).max(998).optional(),
    template: slugSchema.optional(),
    variables: templateVariablesSchema.optional(),
    html: z.string().max(500_000).optional(),
    text: z.string().max(500_000).optional(),
  })
  .refine((value) => Boolean(value.template) || Boolean(value.subject), {
    message: "Either `template` or `subject` must be provided",
    path: ["subject"],
  })
  .refine(
    (value) => Boolean(value.template) || Boolean(value.html) || Boolean(value.text),
    {
      message: "Either `template` or `html`/`text` content must be provided",
      path: ["html"],
    },
  );

export type SendEmailRequest = z.infer<typeof sendEmailRequestSchema>;

export const sendEmailAcceptedResponseSchema = z.object({
  id: z.string(),
  status: emailStatusSchema,
});

export type SendEmailAcceptedResponse = z.infer<
  typeof sendEmailAcceptedResponseSchema
>;

export const emailResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  providerMessageId: z.string().nullable(),
  idempotencyKey: z.string().nullable(),
  from: emailAddressSchema,
  to: z.array(emailAddressSchema),
  cc: z.array(emailAddressSchema),
  bcc: z.array(emailAddressSchema),
  replyTo: emailAddressSchema.nullable(),
  subject: z.string(),
  templateId: z.string().nullable(),
  templateSlug: z.string().nullable(),
  variables: templateVariablesSchema.nullable(),
  html: z.string().nullable(),
  text: z.string().nullable(),
  status: emailStatusSchema,
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  queuedAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EmailResponse = z.infer<typeof emailResponseSchema>;

export const emailListQuerySchema = paginationQuerySchema.extend({
  status: emailStatusSchema.optional(),
  to: z.string().trim().min(1).optional(),
  template: slugSchema.optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

export type EmailListQuery = z.infer<typeof emailListQuerySchema>;

export const emailListResponseSchema = paginatedResponseSchema(emailResponseSchema);

export type EmailListResponse = z.infer<typeof emailListResponseSchema>;

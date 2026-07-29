import { z } from "zod";
import { slugSchema, templateVariablesSchema } from "./shared";

export const templateSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  slug: slugSchema,
  subject: z.string(),
  html: z.string(),
  text: z.string(),
  variables: templateVariablesSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Template = z.infer<typeof templateSchema>;

export const templateListResponseSchema = z.object({
  data: z.array(templateSchema),
});

export type TemplateListResponse = z.infer<typeof templateListResponseSchema>;

export const createTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  subject: z.string().trim().min(1).max(998),
  html: z.string().min(1).max(500_000),
  text: z.string().min(1).max(500_000),
  variables: templateVariablesSchema.default({}),
});

export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;

export const updateTemplateInputSchema = createTemplateInputSchema
  .omit({ slug: true })
  .partial();

export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;

export const previewTemplateInputSchema = z.object({
  variables: templateVariablesSchema.default({}),
});

export type PreviewTemplateInput = z.infer<typeof previewTemplateInputSchema>;

export const previewTemplateResponseSchema = z.object({
  subject: z.string(),
  html: z.string(),
  text: z.string(),
  missingVariables: z.array(z.string()),
});

export type PreviewTemplateResponse = z.infer<
  typeof previewTemplateResponseSchema
>;

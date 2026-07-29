import {
  createTemplateInputSchema,
  previewTemplateInputSchema,
  updateTemplateInputSchema,
} from "@andersseen/contracts";
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  listTemplates,
  updateTemplate,
} from "@andersseen/database";
import { renderTemplate } from "@andersseen/email-core";
import { Hono } from "hono";
import { AppError } from "../lib/errors";
import { validate } from "../lib/validation";
import type { AppEnv } from "../types";

export const templatesRoute = new Hono<AppEnv>();

templatesRoute.get("/", async (c) => {
  const templates = await listTemplates(c.env.DB, c.get("projectId"));
  return c.json({ data: templates });
});

templatesRoute.post("/", validate("json", createTemplateInputSchema), async (c) => {
  const input = c.req.valid("json");
  const template = await createTemplate(c.env.DB, c.get("projectId"), input);
  return c.json(template, 201);
});

templatesRoute.get("/:id", async (c) => {
  const template = await getTemplateById(c.env.DB, c.get("projectId"), c.req.param("id"));
  if (!template) throw new AppError("not_found", "Template not found");
  return c.json(template);
});

templatesRoute.put("/:id", validate("json", updateTemplateInputSchema), async (c) => {
  const input = c.req.valid("json");
  const template = await updateTemplate(c.env.DB, c.get("projectId"), c.req.param("id"), input);
  if (!template) throw new AppError("not_found", "Template not found");
  return c.json(template);
});

templatesRoute.delete("/:id", async (c) => {
  const deleted = await deleteTemplate(c.env.DB, c.get("projectId"), c.req.param("id"));
  if (!deleted) throw new AppError("not_found", "Template not found");
  return c.body(null, 204);
});

templatesRoute.post(
  "/:id/preview",
  validate("json", previewTemplateInputSchema),
  async (c) => {
    const template = await getTemplateById(c.env.DB, c.get("projectId"), c.req.param("id"));
    if (!template) throw new AppError("not_found", "Template not found");

    const { variables } = c.req.valid("json");
    const rendered = renderTemplate(template, { ...template.variables, ...variables });
    return c.json(rendered);
  },
);

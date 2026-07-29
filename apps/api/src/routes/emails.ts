import {
  buildPaginationMeta,
  DEFAULT_FROM_ADDRESS,
  emailListQuerySchema,
  sendEmailRequestSchema,
} from "@andersseen/contracts";
import {
  getEmailByIdempotencyKey,
  getEmailById,
  getTemplateBySlug,
  insertEmail,
  insertEmailEvent,
  listEmailEvents,
  listEmails,
} from "@andersseen/database";
import { renderTemplate, type EmailJob } from "@andersseen/email-core";
import { Hono } from "hono";
import { AppError } from "../lib/errors";
import { validate } from "../lib/validation";
import type { AppEnv } from "../types";

export const emailsRoute = new Hono<AppEnv>();

emailsRoute.post("/", validate("json", sendEmailRequestSchema), async (c) => {
  const projectId = c.get("projectId");
  const input = c.req.valid("json");
  const idempotencyKey = c.req.header("Idempotency-Key") ?? null;

  if (idempotencyKey) {
    const existing = await getEmailByIdempotencyKey(c.env.DB, projectId, idempotencyKey);
    if (existing) {
      return c.json({ id: existing.id, status: existing.status }, 202);
    }
  }

  let templateId: string | null = null;
  let templateSlug: string | null = null;
  let subject = input.subject ?? "";
  let html = input.html ?? "";
  let text = input.text ?? "";

  if (input.template) {
    const template = await getTemplateBySlug(c.env.DB, projectId, input.template);
    if (!template) {
      throw new AppError("validation_error", `Unknown template: ${input.template}`);
    }

    templateId = template.id;
    templateSlug = template.slug;
    const rendered = renderTemplate(template, { ...template.variables, ...input.variables });
    subject = input.subject ?? rendered.subject;
    html = input.html ?? rendered.html;
    text = input.text ?? rendered.text;
  }

  const email = await insertEmail(c.env.DB, {
    projectId,
    idempotencyKey,
    from: input.from ?? DEFAULT_FROM_ADDRESS,
    to: input.to,
    cc: input.cc ?? [],
    bcc: input.bcc ?? [],
    replyTo: input.replyTo ?? null,
    subject,
    templateId,
    templateSlug,
    variables: input.variables ?? null,
    html,
    text,
  });

  await insertEmailEvent(c.env.DB, email.id, "queued");

  const job: EmailJob = { emailId: email.id, projectId };
  await c.env.EMAIL_QUEUE.send(job);

  return c.json({ id: email.id, status: email.status }, 202);
});

emailsRoute.get("/", validate("query", emailListQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const projectId = c.get("projectId");
  const { data, total } = await listEmails(c.env.DB, projectId, query);

  return c.json({
    data,
    pagination: buildPaginationMeta(query.page, query.pageSize, total),
  });
});

emailsRoute.get("/:id", async (c) => {
  const email = await getEmailById(c.env.DB, c.get("projectId"), c.req.param("id"));
  if (!email) throw new AppError("not_found", "Email not found");
  return c.json(email);
});

emailsRoute.get("/:id/events", async (c) => {
  const email = await getEmailById(c.env.DB, c.get("projectId"), c.req.param("id"));
  if (!email) throw new AppError("not_found", "Email not found");

  const events = await listEmailEvents(c.env.DB, email.id);
  return c.json({ data: events });
});

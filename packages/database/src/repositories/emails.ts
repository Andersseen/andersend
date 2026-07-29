import type { EmailListQuery, EmailResponse, EmailStatus } from "@andersseen/contracts";
import { createId } from "../ids";
import { mapEmailRow } from "../mappers";
import type { EmailRow } from "../rows";

export const SELECT_EMAIL_COLUMNS = `
  emails.id, emails.project_id, emails.provider_message_id, emails.idempotency_key,
  emails.from_address, emails.to_addresses, emails.cc_addresses, emails.bcc_addresses,
  emails.reply_to, emails.subject, emails.template_id, templates.slug AS template_slug,
  emails.variables, emails.html, emails.text, emails.status, emails.error_code,
  emails.error_message, emails.queued_at, emails.sent_at, emails.delivered_at,
  emails.failed_at, emails.created_at, emails.updated_at
`;

export const FROM_EMAILS =
  "FROM emails LEFT JOIN templates ON templates.id = emails.template_id";

export interface InsertEmailParams {
  id?: string;
  projectId: string;
  idempotencyKey?: string | null;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string | null;
  subject: string;
  templateId?: string | null;
  templateSlug?: string | null;
  variables?: Record<string, unknown> | null;
  html: string | null;
  text: string | null;
}

export async function insertEmail(
  db: D1Database,
  params: InsertEmailParams,
): Promise<EmailResponse> {
  const id = params.id ?? createId("email");
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO emails (
         id, project_id, idempotency_key, from_address, to_addresses, cc_addresses,
         bcc_addresses, reply_to, subject, template_id, variables, html, text,
         status, queued_at, created_at, updated_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'queued', ?14, ?14, ?14)`,
    )
    .bind(
      id,
      params.projectId,
      params.idempotencyKey ?? null,
      params.from,
      JSON.stringify(params.to),
      JSON.stringify(params.cc ?? []),
      JSON.stringify(params.bcc ?? []),
      params.replyTo ?? null,
      params.subject,
      params.templateId ?? null,
      params.variables ? JSON.stringify(params.variables) : null,
      params.html,
      params.text,
      now,
    )
    .run();

  return {
    id,
    projectId: params.projectId,
    providerMessageId: null,
    idempotencyKey: params.idempotencyKey ?? null,
    from: params.from,
    to: params.to,
    cc: params.cc ?? [],
    bcc: params.bcc ?? [],
    replyTo: params.replyTo ?? null,
    subject: params.subject,
    templateId: params.templateId ?? null,
    templateSlug: params.templateSlug ?? null,
    variables: (params.variables ?? null) as EmailResponse["variables"],
    html: params.html,
    text: params.text,
    status: "queued",
    errorCode: null,
    errorMessage: null,
    queuedAt: now,
    sentAt: null,
    deliveredAt: null,
    failedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getEmailById(
  db: D1Database,
  projectId: string,
  id: string,
): Promise<EmailResponse | null> {
  const row = await db
    .prepare(
      `SELECT ${SELECT_EMAIL_COLUMNS} ${FROM_EMAILS} WHERE emails.project_id = ?1 AND emails.id = ?2`,
    )
    .bind(projectId, id)
    .first<EmailRow>();
  return row ? mapEmailRow(row) : null;
}

export async function getEmailByIdempotencyKey(
  db: D1Database,
  projectId: string,
  idempotencyKey: string,
): Promise<EmailResponse | null> {
  const row = await db
    .prepare(
      `SELECT ${SELECT_EMAIL_COLUMNS} ${FROM_EMAILS} WHERE emails.project_id = ?1 AND emails.idempotency_key = ?2`,
    )
    .bind(projectId, idempotencyKey)
    .first<EmailRow>();
  return row ? mapEmailRow(row) : null;
}

export interface ListEmailsResult {
  data: EmailResponse[];
  total: number;
}

export async function listEmails(
  db: D1Database,
  projectId: string,
  query: EmailListQuery,
): Promise<ListEmailsResult> {
  const conditions: string[] = ["emails.project_id = ?1"];
  const params: unknown[] = [projectId];
  let idx = 2;

  if (query.status) {
    conditions.push(`emails.status = ?${idx}`);
    params.push(query.status);
    idx++;
  }
  if (query.template) {
    conditions.push(`templates.slug = ?${idx}`);
    params.push(query.template);
    idx++;
  }
  if (query.to) {
    conditions.push(`emails.to_addresses LIKE ?${idx}`);
    params.push(`%${query.to}%`);
    idx++;
  }
  if (query.q) {
    conditions.push(`(emails.subject LIKE ?${idx} OR emails.to_addresses LIKE ?${idx})`);
    params.push(`%${query.q}%`);
    idx++;
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS count ${FROM_EMAILS} ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>();
  const total = countRow?.count ?? 0;

  const limitIdx = idx;
  params.push(query.pageSize);
  idx++;
  const offsetIdx = idx;
  params.push((query.page - 1) * query.pageSize);

  const result = await db
    .prepare(
      `SELECT ${SELECT_EMAIL_COLUMNS} ${FROM_EMAILS} ${whereClause}
       ORDER BY emails.created_at DESC
       LIMIT ?${limitIdx} OFFSET ?${offsetIdx}`,
    )
    .bind(...params)
    .all<EmailRow>();

  return { data: result.results.map(mapEmailRow), total };
}

export interface EmailStatusUpdate {
  status: EmailStatus;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  timestamp?: string;
}

const STATUS_TIMESTAMP_COLUMN: Partial<Record<EmailStatus, string>> = {
  queued: "queued_at",
  sent: "sent_at",
  delivered: "delivered_at",
  failed: "failed_at",
};

export async function updateEmailStatus(
  db: D1Database,
  id: string,
  update: EmailStatusUpdate,
): Promise<void> {
  const timestamp = update.timestamp ?? new Date().toISOString();
  const column = STATUS_TIMESTAMP_COLUMN[update.status];

  const sets = ["status = ?1", "updated_at = ?2"];
  const params: unknown[] = [update.status, timestamp];
  let idx = 3;

  if (column) {
    sets.push(`${column} = ?${idx}`);
    params.push(timestamp);
    idx++;
  }
  if (update.providerMessageId !== undefined) {
    sets.push(`provider_message_id = ?${idx}`);
    params.push(update.providerMessageId);
    idx++;
  }
  if (update.errorCode !== undefined) {
    sets.push(`error_code = ?${idx}`);
    params.push(update.errorCode);
    idx++;
  }
  if (update.errorMessage !== undefined) {
    sets.push(`error_message = ?${idx}`);
    params.push(update.errorMessage);
    idx++;
  }

  params.push(id);
  await db
    .prepare(`UPDATE emails SET ${sets.join(", ")} WHERE id = ?${idx}`)
    .bind(...params)
    .run();
}

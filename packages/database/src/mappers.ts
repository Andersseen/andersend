import type {
  ApiKey,
  EmailEvent,
  EmailEventType,
  EmailResponse,
  EmailStatus,
  Template,
  TemplateVariables,
} from "@andersseen/contracts";
import type { ApiKeyRow, EmailEventRow, EmailRow, TemplateRow } from "./rows";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseJsonRecord(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function mapTemplateRow(row: TemplateRow): Template {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    slug: row.slug,
    subject: row.subject,
    html: row.html,
    text: row.text,
    variables: (parseJsonRecord(row.variables) ?? {}) as TemplateVariables,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEmailRow(row: EmailRow): EmailResponse {
  return {
    id: row.id,
    projectId: row.project_id,
    providerMessageId: row.provider_message_id,
    idempotencyKey: row.idempotency_key,
    from: row.from_address,
    to: parseJsonArray(row.to_addresses),
    cc: parseJsonArray(row.cc_addresses),
    bcc: parseJsonArray(row.bcc_addresses),
    replyTo: row.reply_to,
    subject: row.subject,
    templateId: row.template_id,
    templateSlug: row.template_slug,
    variables: parseJsonRecord(row.variables) as EmailResponse["variables"],
    html: row.html,
    text: row.text,
    status: row.status as EmailStatus,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    queuedAt: row.queued_at,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    failedAt: row.failed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEmailEventRow(row: EmailEventRow): EmailEvent {
  return {
    id: row.id,
    emailId: row.email_id,
    type: row.type as EmailEventType,
    payload: parseJsonRecord(row.payload),
    createdAt: row.created_at,
  };
}

export function mapApiKeyRow(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    prefix: row.prefix,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

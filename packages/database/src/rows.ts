/** Raw D1 row shapes: snake_case columns, JSON-encoded array/object fields. */

export interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyRow {
  id: string;
  project_id: string;
  name: string;
  prefix: string;
  key_hash: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface TemplateRow {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  subject: string;
  html: string;
  text: string;
  variables: string;
  created_at: string;
  updated_at: string;
}

export interface EmailRow {
  id: string;
  project_id: string;
  provider_message_id: string | null;
  idempotency_key: string | null;
  from_address: string;
  to_addresses: string;
  cc_addresses: string;
  bcc_addresses: string;
  reply_to: string | null;
  subject: string;
  template_id: string | null;
  template_slug: string | null;
  variables: string | null;
  html: string | null;
  text: string | null;
  status: string;
  error_code: string | null;
  error_message: string | null;
  queued_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailEventRow {
  id: string;
  email_id: string;
  type: string;
  payload: string | null;
  created_at: string;
}

-- Array/object fields (to/cc/bcc addresses, template variables) are stored as
-- JSON strings and (de)serialized by the repository layer in
-- packages/database/src, matching D1's lack of a native array/JSON type.
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  provider_message_id TEXT,
  idempotency_key TEXT,
  from_address TEXT NOT NULL,
  to_addresses TEXT NOT NULL,
  cc_addresses TEXT NOT NULL DEFAULT '[]',
  bcc_addresses TEXT NOT NULL DEFAULT '[]',
  reply_to TEXT,
  subject TEXT NOT NULL,
  template_id TEXT REFERENCES templates(id),
  variables TEXT,
  html TEXT,
  text TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error_code TEXT,
  error_message TEXT,
  queued_at TEXT,
  sent_at TEXT,
  delivered_at TEXT,
  failed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emails_project_created ON emails(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_project_status ON emails(project_id, status);
CREATE INDEX IF NOT EXISTS idx_emails_template ON emails(template_id);

-- Idempotency keys only need to be unique per project, and are optional.
CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_idempotency
  ON emails(project_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Projects: the top-level owner of API keys, templates and emails.
-- Multi-tenancy is out of scope today (Andersend is single-project), but the
-- foreign keys already point at project_id so teams/organizations can be
-- layered on later without a data migration.
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

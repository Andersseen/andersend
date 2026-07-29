import { renderTemplate } from "@andersseen/email-core";
import { BUILT_IN_EMAIL_TEMPLATES } from "@andersseen/email-templates";
import {
  DEV_API_KEY_PLAINTEXT,
  DEV_API_KEY_PREFIX,
  DEV_PROJECT_ID,
  DEV_PROJECT_SLUG,
} from "./constants";
import { hashApiKey } from "./crypto";
import { createId } from "./ids";

export interface SeedStatement {
  sql: string;
  params: unknown[];
}

function insert(table: string, row: Record<string, unknown>): SeedStatement {
  const columns = Object.keys(row);
  const placeholders = columns.map((_, index) => `?${index + 1}`);
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params: columns.map((column) => row[column] ?? null),
  };
}

function deleteAll(table: string): SeedStatement {
  return { sql: `DELETE FROM ${table}`, params: [] };
}

interface SeedEmailPlan {
  dayOffset: number;
  hour: number;
  minute: number;
  to: string;
  templateSlug: string | null;
  raw?: { subject: string; html: string; text: string };
  status: "delivered" | "failed";
  errorCode?: string;
  errorMessage?: string;
}

const SEED_EMAIL_PLANS: SeedEmailPlan[] = [
  { dayOffset: 6, hour: 9, minute: 12, to: "alice@example.com", templateSlug: "welcome", status: "delivered" },
  { dayOffset: 6, hour: 14, minute: 3, to: "bob@example.com", templateSlug: "email-verification", status: "delivered" },
  { dayOffset: 6, hour: 18, minute: 45, to: "fail@example.com", templateSlug: "welcome", status: "failed", errorCode: "mock_delivery_failed", errorMessage: "Simulated delivery failure for fail@example.com" },
  { dayOffset: 5, hour: 10, minute: 20, to: "chen@example.com", templateSlug: "project-notification", status: "delivered" },
  { dayOffset: 5, hour: 16, minute: 55, to: "dana@example.com", templateSlug: "welcome", status: "delivered" },
  { dayOffset: 4, hour: 8, minute: 30, to: "erin@example.com", templateSlug: "email-verification", status: "delivered" },
  { dayOffset: 4, hour: 13, minute: 10, to: "alice@example.com", templateSlug: "project-notification", status: "delivered" },
  { dayOffset: 4, hour: 20, minute: 5, to: "fail@example.com", templateSlug: "project-notification", status: "failed", errorCode: "mock_delivery_failed", errorMessage: "Simulated delivery failure for fail@example.com" },
  { dayOffset: 3, hour: 9, minute: 40, to: "bob@example.com", templateSlug: "welcome", status: "delivered" },
  { dayOffset: 3, hour: 15, minute: 25, to: "chen@example.com", templateSlug: null, raw: { subject: "Andersend status update", html: "<p>All systems operational.</p>", text: "All systems operational." }, status: "delivered" },
  { dayOffset: 2, hour: 11, minute: 5, to: "dana@example.com", templateSlug: "email-verification", status: "delivered" },
  { dayOffset: 2, hour: 17, minute: 50, to: "erin@example.com", templateSlug: "project-notification", status: "delivered" },
  { dayOffset: 2, hour: 22, minute: 15, to: "fail@example.com", templateSlug: "email-verification", status: "failed", errorCode: "mock_delivery_failed", errorMessage: "Simulated delivery failure for fail@example.com" },
  { dayOffset: 1, hour: 8, minute: 5, to: "alice@example.com", templateSlug: "project-notification", status: "delivered" },
  { dayOffset: 1, hour: 12, minute: 45, to: "bob@example.com", templateSlug: "welcome", status: "delivered" },
  { dayOffset: 1, hour: 19, minute: 30, to: "chen@example.com", templateSlug: null, raw: { subject: "Weekly digest", html: "<p>Your weekly Andersend summary is ready.</p>", text: "Your weekly Andersend summary is ready." }, status: "delivered" },
  { dayOffset: 0, hour: 7, minute: 15, to: "dana@example.com", templateSlug: "welcome", status: "delivered" },
  { dayOffset: 0, hour: 9, minute: 50, to: "erin@example.com", templateSlug: "project-notification", status: "delivered" },
  { dayOffset: 0, hour: 11, minute: 30, to: "alice@example.com", templateSlug: "email-verification", status: "delivered" },
  { dayOffset: 0, hour: 13, minute: 0, to: "fail@example.com", templateSlug: "welcome", status: "failed", errorCode: "mock_delivery_failed", errorMessage: "Simulated delivery failure for fail@example.com" },
];

function atOffset(now: Date, dayOffset: number, hour: number, minute: number): Date {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

/**
 * Builds the full local seed dataset as parameterized SQL statements: one
 * project, one display-only dev API key, the three built-in templates, and
 * ~20 historical emails spread across the last 7 days (for the overview
 * chart). Statements are idempotent — existing rows are cleared first — so
 * this is safe to run against an already-seeded database.
 *
 * Both `scripts/seed-local.ts` (via `wrangler d1 execute --file`) and the
 * dev-only `/v1/dev/reset` route (via a direct `D1Database` binding) consume
 * this same function, so there is exactly one definition of "seed data".
 */
export async function buildSeedStatements(now: Date = new Date()): Promise<SeedStatement[]> {
  const nowIso = now.toISOString();
  const statements: SeedStatement[] = [
    deleteAll("email_events"),
    deleteAll("emails"),
    deleteAll("templates"),
    deleteAll("api_keys"),
    deleteAll("projects"),
  ];

  statements.push(
    insert("projects", {
      id: DEV_PROJECT_ID,
      name: "Andersseen Personal",
      slug: DEV_PROJECT_SLUG,
      created_at: nowIso,
      updated_at: nowIso,
    }),
  );

  statements.push(
    insert("api_keys", {
      id: "key_dev_local",
      project_id: DEV_PROJECT_ID,
      name: "Local development key",
      prefix: DEV_API_KEY_PREFIX,
      key_hash: await hashApiKey(DEV_API_KEY_PLAINTEXT),
      last_used_at: null,
      created_at: nowIso,
      revoked_at: null,
    }),
  );

  const templateIdBySlug = new Map<string, string>();
  for (const template of BUILT_IN_EMAIL_TEMPLATES) {
    const id = createId("tmpl");
    templateIdBySlug.set(template.slug, id);
    statements.push(
      insert("templates", {
        id,
        project_id: DEV_PROJECT_ID,
        name: template.name,
        slug: template.slug,
        subject: template.subject,
        html: template.html,
        text: template.text,
        variables: JSON.stringify(template.exampleVariables),
        created_at: nowIso,
        updated_at: nowIso,
      }),
    );
  }

  for (const plan of SEED_EMAIL_PLANS) {
    const createdAt = atOffset(now, plan.dayOffset, plan.hour, plan.minute);
    const queuedAt = createdAt;
    const processingEventAt = new Date(createdAt.getTime() + 500);
    const resolvedAt = new Date(createdAt.getTime() + 1_500);

    const template = plan.templateSlug
      ? BUILT_IN_EMAIL_TEMPLATES.find((item) => item.slug === plan.templateSlug)
      : null;
    const templateId = plan.templateSlug ? (templateIdBySlug.get(plan.templateSlug) ?? null) : null;

    const rendered = template
      ? renderTemplate(template, template.exampleVariables)
      : { subject: plan.raw?.subject ?? "", html: plan.raw?.html ?? "", text: plan.raw?.text ?? "" };

    const emailId = createId("email");
    const isDelivered = plan.status === "delivered";

    statements.push(
      insert("emails", {
        id: emailId,
        project_id: DEV_PROJECT_ID,
        provider_message_id: isDelivered ? `mock_${crypto.randomUUID()}` : null,
        idempotency_key: null,
        from_address: "Andersend <no-reply@andersseen.dev>",
        to_addresses: JSON.stringify([plan.to]),
        cc_addresses: "[]",
        bcc_addresses: "[]",
        reply_to: null,
        subject: rendered.subject,
        template_id: templateId,
        variables: template ? JSON.stringify(template.exampleVariables) : null,
        html: rendered.html,
        text: rendered.text,
        status: plan.status,
        error_code: plan.errorCode ?? null,
        error_message: plan.errorMessage ?? null,
        queued_at: queuedAt.toISOString(),
        sent_at: isDelivered ? resolvedAt.toISOString() : null,
        delivered_at: isDelivered ? resolvedAt.toISOString() : null,
        failed_at: isDelivered ? null : resolvedAt.toISOString(),
        created_at: createdAt.toISOString(),
        updated_at: resolvedAt.toISOString(),
      }),
    );

    statements.push(
      insert("email_events", {
        id: createId("evt"),
        email_id: emailId,
        type: "queued",
        payload: null,
        created_at: queuedAt.toISOString(),
      }),
      insert("email_events", {
        id: createId("evt"),
        email_id: emailId,
        type: "processing",
        payload: null,
        created_at: processingEventAt.toISOString(),
      }),
      insert("email_events", {
        id: createId("evt"),
        email_id: emailId,
        type: plan.status,
        payload: JSON.stringify(
          isDelivered
            ? { providerMessageId: "mock" }
            : { code: plan.errorCode, message: plan.errorMessage },
        ),
        created_at: resolvedAt.toISOString(),
      }),
    );
  }

  return statements;
}

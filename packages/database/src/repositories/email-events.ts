import type { EmailEvent, EmailEventType } from "@andersseen/contracts";
import { createId } from "../ids";
import { mapEmailEventRow } from "../mappers";
import type { EmailEventRow } from "../rows";

export async function insertEmailEvent(
  db: D1Database,
  emailId: string,
  type: EmailEventType,
  payload?: Record<string, unknown> | null,
): Promise<EmailEvent> {
  const id = createId("evt");
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO email_events (id, email_id, type, payload, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(id, emailId, type, payload ? JSON.stringify(payload) : null, now)
    .run();

  return { id, emailId, type, payload: payload ?? null, createdAt: now };
}

export async function listEmailEvents(
  db: D1Database,
  emailId: string,
): Promise<EmailEvent[]> {
  const result = await db
    .prepare("SELECT * FROM email_events WHERE email_id = ?1 ORDER BY created_at ASC")
    .bind(emailId)
    .all<EmailEventRow>();
  return result.results.map(mapEmailEventRow);
}

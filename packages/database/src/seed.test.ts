import { describe, expect, it } from "vitest";
import { DEV_API_KEY_PLAINTEXT, DEV_PROJECT_ID } from "./constants";
import { buildSeedStatements } from "./seed";

describe("buildSeedStatements", () => {
  it("clears every table before inserting, in FK-safe order", async () => {
    const statements = await buildSeedStatements(new Date("2026-07-29T12:00:00.000Z"));
    const deletes = statements.filter((statement) => statement.sql.startsWith("DELETE"));

    expect(deletes.map((statement) => statement.sql)).toEqual([
      "DELETE FROM email_events",
      "DELETE FROM emails",
      "DELETE FROM templates",
      "DELETE FROM api_keys",
      "DELETE FROM projects",
    ]);
  });

  it("seeds exactly one project and one dev api key", async () => {
    const statements = await buildSeedStatements(new Date("2026-07-29T12:00:00.000Z"));

    const projectInserts = statements.filter((s) => s.sql.startsWith("INSERT INTO projects"));
    const apiKeyInserts = statements.filter((s) => s.sql.startsWith("INSERT INTO api_keys"));

    expect(projectInserts).toHaveLength(1);
    expect(projectInserts[0]?.params).toContain(DEV_PROJECT_ID);
    expect(apiKeyInserts).toHaveLength(1);
    // The plaintext dev key is never persisted, only its hash.
    expect(apiKeyInserts[0]?.params).not.toContain(DEV_API_KEY_PLAINTEXT);
  });

  it("seeds the three built-in templates", async () => {
    const statements = await buildSeedStatements(new Date("2026-07-29T12:00:00.000Z"));
    const templateInserts = statements.filter((s) => s.sql.startsWith("INSERT INTO templates"));
    expect(templateInserts).toHaveLength(3);
  });

  it("seeds a realistic spread of historical emails and events", async () => {
    const statements = await buildSeedStatements(new Date("2026-07-29T12:00:00.000Z"));
    const emailInserts = statements.filter((s) => s.sql.startsWith("INSERT INTO emails"));
    const eventInserts = statements.filter((s) => s.sql.startsWith("INSERT INTO email_events"));

    expect(emailInserts.length).toBeGreaterThanOrEqual(18);
    expect(eventInserts.length).toBe(emailInserts.length * 3);

    const statusIndex = emailInserts[0]?.sql
      .replace("INSERT INTO emails (", "")
      .split(")")[0]
      ?.split(", ")
      .indexOf("status");
    const statuses = emailInserts.map((s) => (statusIndex !== undefined ? s.params[statusIndex] : undefined));

    expect(statuses).toContain("delivered");
    expect(statuses).toContain("failed");
  });

  it("is idempotent to call twice with different seeded ids", async () => {
    const first = await buildSeedStatements(new Date("2026-07-29T12:00:00.000Z"));
    const second = await buildSeedStatements(new Date("2026-07-29T12:00:00.000Z"));
    expect(first.length).toBe(second.length);
  });
});

import { describe, expect, it } from "vitest";
import { mapEmailRow, mapTemplateRow } from "./mappers";
import type { EmailRow, TemplateRow } from "./rows";

const baseEmailRow: EmailRow = {
  id: "email_1",
  project_id: "proj_1",
  provider_message_id: "mock_123",
  idempotency_key: null,
  from_address: "Andersend <no-reply@andersseen.dev>",
  to_addresses: '["user@example.com"]',
  cc_addresses: "[]",
  bcc_addresses: "[]",
  reply_to: null,
  subject: "Hello",
  template_id: null,
  template_slug: null,
  variables: '{"name":"Andrii"}',
  html: "<p>Hello</p>",
  text: "Hello",
  status: "delivered",
  error_code: null,
  error_message: null,
  queued_at: "2026-07-01T00:00:00.000Z",
  sent_at: "2026-07-01T00:00:01.000Z",
  delivered_at: "2026-07-01T00:00:02.000Z",
  failed_at: null,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:02.000Z",
};

describe("mapEmailRow", () => {
  it("parses JSON array and record columns", () => {
    const mapped = mapEmailRow(baseEmailRow);
    expect(mapped.to).toEqual(["user@example.com"]);
    expect(mapped.variables).toEqual({ name: "Andrii" });
    expect(mapped.status).toBe("delivered");
  });

  it("falls back to an empty array for malformed JSON", () => {
    const mapped = mapEmailRow({ ...baseEmailRow, to_addresses: "not-json" });
    expect(mapped.to).toEqual([]);
  });

  it("returns null variables when the column is null", () => {
    const mapped = mapEmailRow({ ...baseEmailRow, variables: null });
    expect(mapped.variables).toBeNull();
  });
});

describe("mapTemplateRow", () => {
  it("defaults variables to an empty object when null", () => {
    const row: TemplateRow = {
      id: "tmpl_1",
      project_id: "proj_1",
      name: "Welcome",
      slug: "welcome",
      subject: "Hi {{name}}",
      html: "<p>Hi {{name}}</p>",
      text: "Hi {{name}}",
      variables: "null",
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    };

    const mapped = mapTemplateRow(row);
    expect(mapped.variables).toEqual({});
  });
});

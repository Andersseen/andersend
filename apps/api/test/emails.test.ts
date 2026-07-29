import { DEV_API_KEY_PLAINTEXT } from "@andersseen/database";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { readJson } from "./helpers";

const authHeaders = { Authorization: `Bearer ${DEV_API_KEY_PLAINTEXT}` };

function request(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com${path}`, {
    ...init,
    headers: { ...authHeaders, ...init?.headers },
  });
}

describe("POST /v1/emails", () => {
  it("accepts a template-based send and returns 202 queued", async () => {
    const response = await request("/v1/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: ["user@example.com"],
        template: "welcome",
        variables: { name: "Andrii", projectName: "Andersseen Personal", actionUrl: "https://mail.andersseen.dev" },
      }),
    });

    expect(response.status).toBe(202);
    const body = await readJson(response);
    expect(body.status).toBe("queued");
    expect(typeof body.id).toBe("string");

    const getResponse = await request(`/v1/emails/${body.id}`);
    expect(getResponse.status).toBe(200);
    const email = await readJson(getResponse);
    expect(email.subject).toContain("Andrii");
    expect(email.templateSlug).toBe("welcome");
  });

  it("accepts a raw html/text send with explicit subject", async () => {
    const response = await request("/v1/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: ["user@example.com"],
        subject: "Hello",
        html: "<p>Hello</p>",
        text: "Hello",
      }),
    });

    expect(response.status).toBe(202);
  });

  it("rejects a payload missing both template and content", async () => {
    const response = await request("/v1/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: ["user@example.com"] }),
    });

    expect(response.status).toBe(422);
    const body = await readJson(response);
    expect(body.error.code).toBe("validation_error");
  });

  it("rejects an unknown template slug", async () => {
    const response = await request("/v1/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: ["user@example.com"], template: "does-not-exist" }),
    });

    expect(response.status).toBe(422);
  });

  it("replays the same email for a duplicate Idempotency-Key instead of creating a new one", async () => {
    const idempotencyKey = `test-${crypto.randomUUID()}`;
    const payload = {
      to: ["user@example.com"],
      subject: "Idempotent send",
      html: "<p>Idempotent</p>",
      text: "Idempotent",
    };

    const first = await request("/v1/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
    const second = await request("/v1/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);

    const firstBody = await readJson(first);
    const secondBody = await readJson(second);
    expect(secondBody.id).toBe(firstBody.id);

    const listResponse = await request(
      `/v1/emails?${new URLSearchParams({ q: "Idempotent send", pageSize: "100" }).toString()}`,
    );
    const list = await readJson(listResponse);
    const matches = list.data.filter((email: { subject: string }) => email.subject === "Idempotent send");
    expect(matches).toHaveLength(1);
  });
});

describe("GET /v1/emails", () => {
  it("lists seeded emails with pagination metadata", async () => {
    const response = await request("/v1/emails?pageSize=5");
    expect(response.status).toBe(200);

    const body = await readJson(response);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.pagination).toMatchObject({ page: 1, pageSize: 5 });
    expect(body.pagination.total).toBeGreaterThan(0);
  });

  it("filters by status", async () => {
    const response = await request("/v1/emails?status=failed&pageSize=50");
    const body = await readJson(response);

    expect(body.data.length).toBeGreaterThan(0);
    for (const email of body.data) {
      expect(email.status).toBe("failed");
    }
  });

  it("rejects an invalid status filter", async () => {
    const response = await request("/v1/emails?status=not-a-status");
    expect(response.status).toBe(422);
  });
});

describe("GET /v1/emails/:id", () => {
  it("returns 404 for an unknown id", async () => {
    const response = await request("/v1/emails/does-not-exist");
    expect(response.status).toBe(404);
  });
});

describe("GET /v1/emails/:id/events", () => {
  it("returns the event timeline for a seeded email", async () => {
    const listResponse = await request("/v1/emails?pageSize=1");
    const { data } = await readJson(listResponse);
    const [email] = data;

    const response = await request(`/v1/emails/${email.id}/events`);
    expect(response.status).toBe(200);

    const body = await readJson(response);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty("type");
  });
});

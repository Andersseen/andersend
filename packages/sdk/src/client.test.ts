import { describe, expect, it, vi } from "vitest";
import { createAndersendClient } from "./client";
import { AndersendApiError } from "./errors";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createAndersendClient", () => {
  it("sends a Bearer token and JSON content type on emails.send", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "email_1", status: "queued" }, 202));
    const client = createAndersendClient({
      apiKey: "and_dev_local",
      baseUrl: "https://api.mail.andersseen.dev",
      fetch: fetchMock,
    });

    const result = await client.emails.send({
      to: ["user@example.com"],
      template: "welcome",
      variables: { name: "Andrii" },
    });

    expect(result).toEqual({ id: "email_1", status: "queued" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mail.andersseen.dev/v1/emails");
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer and_dev_local");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toMatchObject({ template: "welcome" });
  });

  it("sends the Idempotency-Key header when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "email_1", status: "queued" }, 202));
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    await client.emails.send({
      to: ["user@example.com"],
      subject: "Hi",
      html: "<p>Hi</p>",
      text: "Hi",
      idempotencyKey: "key-123",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Idempotency-Key")).toBe("key-123");
  });

  it("serializes list query parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }));
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    await client.emails.list({ status: "delivered", page: 2 });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mail.andersseen.dev/v1/emails?status=delivered&page=2");
  });

  it("unwraps templates.list() to a plain array", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: "tmpl_1",
            projectId: "proj_1",
            name: "Welcome",
            slug: "welcome",
            subject: "Hi",
            html: "<p>Hi</p>",
            text: "Hi",
            variables: {},
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    const templates = await client.templates.list();
    expect(templates).toHaveLength(1);
    expect(templates[0]?.slug).toBe("welcome");
  });

  it("throws AndersendApiError with the server's error envelope on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "unauthorized", message: "Invalid API key", requestId: "req_1" } },
        401,
      ),
    );
    const client = createAndersendClient({ apiKey: "bad-key", fetch: fetchMock });

    await expect(client.templates.list()).rejects.toMatchObject({
      name: "AndersendApiError",
      status: 401,
      code: "unauthorized",
      requestId: "req_1",
    });
    await expect(client.templates.list()).rejects.toBeInstanceOf(AndersendApiError);
  });

  it("sends a DELETE request for templates.delete()", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    await client.templates.delete("tmpl_1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mail.andersseen.dev/v1/templates/tmpl_1");
    expect(init.method).toBe("DELETE");
  });

  it("renders a template preview with default empty variables", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ subject: "Hi", html: "<p>Hi</p>", text: "Hi", missingVariables: [] }),
    );
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    const result = await client.templates.preview("tmpl_1");
    expect(result.subject).toBe("Hi");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ variables: {} });
  });

  it("fetches dashboard stats", async () => {
    const stats = {
      totalEmails: 10,
      sentToday: 2,
      delivered: 8,
      failed: 1,
      deliveryRate: 80,
      activeTemplates: 3,
      recentActivity: [],
      recentEmails: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(stats));
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    await expect(client.stats.get()).resolves.toEqual(stats);
  });

  it("fetches health without requiring a successful auth check", async () => {
    const health = {
      name: "andersend",
      status: "ok",
      environment: "local",
      provider: "mock",
      timestamp: "2026-01-01T00:00:00.000Z",
      database: "connected",
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(health));
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    await expect(client.health.get()).resolves.toEqual(health);
  });

  it("unwraps emails.getEvents() to a plain array", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          { id: "evt_1", emailId: "email_1", type: "queued", payload: null, createdAt: "2026-01-01T00:00:00.000Z" },
        ],
      }),
    );
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    const events = await client.emails.getEvents("email_1");
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("queued");
  });

  it("unwraps apiKeys.list() to a plain array", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: "key_1",
            projectId: "proj_1",
            name: "Local development key",
            prefix: "and_dev_",
            lastUsedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            revokedAt: null,
          },
        ],
      }),
    );
    const client = createAndersendClient({ apiKey: "and_dev_local", fetch: fetchMock });

    const keys = await client.apiKeys.list();
    expect(keys).toHaveLength(1);
    expect(keys[0]?.prefix).toBe("and_dev_");
  });
});

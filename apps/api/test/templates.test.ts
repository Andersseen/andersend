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

async function findTemplateBySlug(slug: string) {
  const response = await request("/v1/templates");
  const body = await readJson(response);
  return body.data.find((template: { slug: string }) => template.slug === slug);
}

describe("GET /v1/templates", () => {
  it("lists the three seeded built-in templates", async () => {
    const response = await request("/v1/templates");
    expect(response.status).toBe(200);

    const body = await readJson(response);
    expect(body.data.map((t: { slug: string }) => t.slug).sort()).toEqual([
      "email-verification",
      "project-notification",
      "welcome",
    ]);
  });
});

describe("GET /v1/templates/:id", () => {
  it("returns 404 for an unknown id", async () => {
    const response = await request("/v1/templates/does-not-exist");
    expect(response.status).toBe(404);
  });
});

describe("POST /v1/templates/:id/preview", () => {
  it("renders the template with supplied variables", async () => {
    const welcome = await findTemplateBySlug("welcome");

    const response = await request(`/v1/templates/${welcome.id}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variables: { name: "Ada" } }),
    });

    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.subject).toContain("Ada");
    expect(body.html).toContain("Ada");
  });

  it("falls back to the template's example variables when none are supplied", async () => {
    const welcome = await findTemplateBySlug("welcome");

    const response = await request(`/v1/templates/${welcome.id}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.missingVariables).toEqual([]);
  });
});

describe("POST /v1/templates", () => {
  it("creates a new template", async () => {
    const response = await request("/v1/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test template",
        slug: "test-template",
        subject: "Hi {{name}}",
        html: "<p>Hi {{name}}</p>",
        text: "Hi {{name}}",
      }),
    });

    expect(response.status).toBe(201);
    const body = await readJson(response);
    expect(body.slug).toBe("test-template");
  });

  it("rejects an invalid slug", async () => {
    const response = await request("/v1/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bad slug",
        slug: "Not A Valid Slug!",
        subject: "Hi",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    });

    expect(response.status).toBe(422);
    const body = await readJson(response);
    expect(body.error.code).toBe("validation_error");
  });
});

describe("DELETE /v1/templates/:id", () => {
  it("deletes an existing template", async () => {
    const created = await request("/v1/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Disposable",
        slug: "disposable",
        subject: "Hi",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    });
    const template = await readJson(created);

    const deleteResponse = await request(`/v1/templates/${template.id}`, { method: "DELETE" });
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(`/v1/templates/${template.id}`);
    expect(getResponse.status).toBe(404);
  });
});

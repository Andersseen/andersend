import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { readJson } from "./helpers";

describe("GET /health", () => {
  it("reports ok status with database connectivity", async () => {
    const response = await exports.default.fetch("https://example.com/health");

    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body).toMatchObject({
      name: "andersend",
      status: "ok",
      environment: "local",
      provider: "mock",
      database: "connected",
    });
    expect(typeof body.timestamp).toBe("string");
  });

  it("does not require authentication", async () => {
    const response = await exports.default.fetch("https://example.com/health");
    expect(response.status).not.toBe(401);
  });
});

import { DEV_API_KEY_PLAINTEXT } from "@andersseen/database";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { readJson } from "./helpers";

describe("/v1/* authentication", () => {
  it("rejects a request with no Authorization header", async () => {
    const response = await exports.default.fetch("https://example.com/v1/stats");

    expect(response.status).toBe(401);
    const body = await readJson(response);
    expect(body.error.code).toBe("unauthorized");
    expect(typeof body.error.requestId).toBe("string");
  });

  it("rejects a request with an invalid API key", async () => {
    const response = await exports.default.fetch("https://example.com/v1/stats", {
      headers: { Authorization: "Bearer not-the-right-key" },
    });

    expect(response.status).toBe(401);
  });

  it("accepts a request with the valid dev API key", async () => {
    const response = await exports.default.fetch("https://example.com/v1/stats", {
      headers: { Authorization: `Bearer ${DEV_API_KEY_PLAINTEXT}` },
    });

    expect(response.status).toBe(200);
  });
});

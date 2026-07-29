import { DEV_API_KEY_PLAINTEXT } from "@andersseen/database";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { readJson } from "./helpers";

describe("GET /v1/stats", () => {
  it("returns dashboard statistics derived from seeded data", async () => {
    const response = await exports.default.fetch("https://example.com/v1/stats", {
      headers: { Authorization: `Bearer ${DEV_API_KEY_PLAINTEXT}` },
    });

    expect(response.status).toBe(200);
    const body = await readJson(response);

    expect(body.totalEmails).toBeGreaterThan(0);
    expect(body.activeTemplates).toBe(3);
    expect(body.recentActivity).toHaveLength(7);
    expect(body.recentEmails.length).toBeGreaterThan(0);
    expect(body.deliveryRate).toBeGreaterThanOrEqual(0);
  });
});

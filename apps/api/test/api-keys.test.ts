import { DEV_API_KEY_PLAINTEXT, DEV_API_KEY_PREFIX } from "@andersseen/database";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { readJson } from "./helpers";

describe("GET /v1/api-keys", () => {
  it("lists the seeded development key without exposing its plaintext value", async () => {
    const response = await exports.default.fetch("https://example.com/v1/api-keys", {
      headers: { Authorization: `Bearer ${DEV_API_KEY_PLAINTEXT}` },
    });

    expect(response.status).toBe(200);
    const body = await readJson(response);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ prefix: DEV_API_KEY_PREFIX });
    expect(JSON.stringify(body)).not.toContain(DEV_API_KEY_PLAINTEXT);
  });
});

import {
  DEV_API_KEY_PLAINTEXT,
  DEV_PROJECT_ID,
  generateApiKey,
  hashApiKey,
} from "@andersseen/database";
import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  CompositeApiKeyAuthProvider,
  DatabaseApiKeyAuthProvider,
} from "../src/lib/auth-provider";
import { readJson } from "./helpers";

const SECOND_PROJECT_ID = "proj_auth_test";

async function insertKey(
  options: { projectId?: string; revoked?: boolean } = {},
) {
  const projectId = options.projectId ?? DEV_PROJECT_ID;
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO projects (id, name, slug, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
  )
    .bind(projectId, projectId, projectId.replace(/_/g, "-"), now)
    .run();

  const { key, prefix } = generateApiKey();
  const id = `key_${prefix}`;
  await env.DB.prepare(
    "INSERT INTO api_keys (id, project_id, name, prefix, key_hash, last_used_at, created_at, revoked_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6, ?7)",
  )
    .bind(
      id,
      projectId,
      "test key",
      prefix,
      await hashApiKey(key),
      now,
      options.revoked ? now : null,
    )
    .run();
  return { id, key, prefix };
}

function get(path: string, key: string) {
  return exports.default.fetch(`https://example.com${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
}

describe("/v1/* authentication", () => {
  it("rejects a request with no Authorization header", async () => {
    const response = await exports.default.fetch(
      "https://example.com/v1/stats",
    );

    expect(response.status).toBe(401);
    const body = await readJson(response);
    expect(body.error.code).toBe("unauthorized");
    expect(typeof body.error.requestId).toBe("string");
  });

  it("rejects a request with an invalid API key", async () => {
    const response = await get("/v1/stats", "not-the-right-key");
    expect(response.status).toBe(401);
  });

  it("accepts a request with the valid dev API key", async () => {
    const response = await get("/v1/stats", DEV_API_KEY_PLAINTEXT);
    expect(response.status).toBe(200);
  });

  it("accepts a minted key stored in the database", async () => {
    const { key } = await insertKey();
    const response = await get("/v1/stats", key);
    expect(response.status).toBe(200);
  });

  it("scopes a minted key to its own project", async () => {
    const { key } = await insertKey({ projectId: SECOND_PROJECT_ID });
    const response = await get("/v1/api-keys", key);

    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].projectId).toBe(SECOND_PROJECT_ID);
  });

  it("rejects a key whose prefix exists but whose secret differs", async () => {
    const { prefix } = await insertKey();
    const response = await get("/v1/stats", `${prefix}wrong-secret`);
    expect(response.status).toBe(401);
  });

  it("rejects a revoked key", async () => {
    const { key } = await insertKey({ revoked: true });
    const response = await get("/v1/stats", key);
    expect(response.status).toBe(401);
  });

  it("records last_used_at after a successful request", async () => {
    const { id, key } = await insertKey();
    const response = await get("/v1/stats", key);
    expect(response.status).toBe(200);

    let lastUsedAt: string | null = null;
    for (let attempt = 0; attempt < 20 && !lastUsedAt; attempt += 1) {
      const row = await env.DB.prepare(
        "SELECT last_used_at FROM api_keys WHERE id = ?1",
      )
        .bind(id)
        .first<{ last_used_at: string | null }>();
      lastUsedAt = row?.last_used_at ?? null;
      if (!lastUsedAt) await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(lastUsedAt).not.toBeNull();
  });
});

describe("authentication in production", () => {
  const productionEnv = { ...env, ENVIRONMENT: "production" } as unknown as Env;

  it("still accepts minted keys", async () => {
    const { key } = await insertKey();
    const result = await new CompositeApiKeyAuthProvider().authenticate(
      key,
      productionEnv,
    );
    expect(result).toMatchObject({ projectId: DEV_PROJECT_ID });
  });

  it("refuses the seeded dev key even though its row exists", async () => {
    expect(
      await new DatabaseApiKeyAuthProvider().authenticate(
        DEV_API_KEY_PLAINTEXT,
        productionEnv,
      ),
    ).toBeNull();
    expect(
      await new CompositeApiKeyAuthProvider().authenticate(
        DEV_API_KEY_PLAINTEXT,
        productionEnv,
      ),
    ).toBeNull();
  });

  it("ignores ANDERSEND_API_KEY", async () => {
    const withEnvKey = {
      ...productionEnv,
      ANDERSEND_API_KEY: "custom_env_key",
    } as Env;
    expect(
      await new CompositeApiKeyAuthProvider().authenticate(
        "custom_env_key",
        withEnvKey,
      ),
    ).toBeNull();
  });
});

import {
  DEV_API_KEY_PREFIX,
  DEV_PROJECT_SLUG,
  getActiveApiKeyByPrefix,
  getProjectBySlug,
  hashApiKey,
  parseApiKeyPrefix,
} from "@andersseen/database";
import { isProduction } from "./environment";

export interface AuthResult {
  projectId: string;
  apiKeyId: string | null;
}

/**
 * Abstraction over "how a Bearer token maps to a project", so the auth
 * middleware never needs to know where keys live.
 */
export interface ApiKeyAuthProvider {
  authenticate(rawKey: string, env: Env): Promise<AuthResult | null>;
}

/** Constant-time comparison of two equal-length hex digests. */
function digestsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

/**
 * Looks a key up by its plaintext prefix in `api_keys` and checks the SHA-256
 * of the full key against the stored hash. Revoked keys are excluded by the
 * repository query. In production the seeded dev key prefix is refused
 * outright, so a remote database that was accidentally seeded is not an open
 * door.
 */
export class DatabaseApiKeyAuthProvider implements ApiKeyAuthProvider {
  async authenticate(rawKey: string, env: Env): Promise<AuthResult | null> {
    const prefix = parseApiKeyPrefix(rawKey);
    if (!prefix) return null;
    if (prefix === DEV_API_KEY_PREFIX && isProduction(env)) return null;

    const row = await getActiveApiKeyByPrefix(env.DB, prefix);
    if (!row) return null;

    const presentedHash = await hashApiKey(rawKey);
    if (!digestsEqual(presentedHash, row.key_hash)) return null;

    return { projectId: row.project_id, apiKeyId: row.id };
  }
}

/**
 * Compares the Bearer token to `env.ANDERSEND_API_KEY` and resolves the
 * default project. Local-development convenience only: never consulted in
 * production (see `CompositeApiKeyAuthProvider`).
 */
export class DevApiKeyAuthProvider implements ApiKeyAuthProvider {
  async authenticate(rawKey: string, env: Env): Promise<AuthResult | null> {
    if (!env.ANDERSEND_API_KEY || rawKey !== env.ANDERSEND_API_KEY) return null;

    const project = await getProjectBySlug(env.DB, DEV_PROJECT_SLUG);
    if (!project) return null;

    return { projectId: project.id, apiKeyId: null };
  }
}

/** Database keys first; the env dev key only as a fallback outside production. */
export class CompositeApiKeyAuthProvider implements ApiKeyAuthProvider {
  constructor(
    private readonly database: ApiKeyAuthProvider = new DatabaseApiKeyAuthProvider(),
    private readonly dev: ApiKeyAuthProvider = new DevApiKeyAuthProvider(),
  ) {}

  async authenticate(rawKey: string, env: Env): Promise<AuthResult | null> {
    const result = await this.database.authenticate(rawKey, env);
    if (result || isProduction(env)) return result;
    return this.dev.authenticate(rawKey, env);
  }
}

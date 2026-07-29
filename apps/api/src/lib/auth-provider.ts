import { DEV_PROJECT_SLUG, getProjectBySlug } from "@andersseen/database";

export interface AuthResult {
  projectId: string;
  apiKeyId: string | null;
}

/**
 * Abstraction over "how a Bearer token maps to a project", so the
 * database-backed `api_keys` table (schema already in place, see
 * packages/database/migrations/0002_create_api_keys.sql) can replace this dev
 * implementation later without touching the auth middleware.
 */
export interface ApiKeyAuthProvider {
  authenticate(rawKey: string, env: Env): Promise<AuthResult | null>;
}

export class DevApiKeyAuthProvider implements ApiKeyAuthProvider {
  async authenticate(rawKey: string, env: Env): Promise<AuthResult | null> {
    if (rawKey !== env.ANDERSEND_API_KEY) return null;

    const project = await getProjectBySlug(env.DB, DEV_PROJECT_SLUG);
    if (!project) return null;

    return { projectId: project.id, apiKeyId: null };
  }
}

import type { ApiKeyRow } from "../rows";

export async function listApiKeys(
  db: D1Database,
  projectId: string,
): Promise<ApiKeyRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM api_keys WHERE project_id = ?1 ORDER BY created_at DESC",
    )
    .bind(projectId)
    .all<ApiKeyRow>();
  return result.results;
}

export async function getActiveApiKeyByPrefix(
  db: D1Database,
  prefix: string,
): Promise<ApiKeyRow | null> {
  return db
    .prepare(
      "SELECT * FROM api_keys WHERE prefix = ?1 AND revoked_at IS NULL",
    )
    .bind(prefix)
    .first<ApiKeyRow>();
}

export async function touchApiKeyLastUsed(
  db: D1Database,
  id: string,
  timestamp: string,
): Promise<void> {
  await db
    .prepare("UPDATE api_keys SET last_used_at = ?1 WHERE id = ?2")
    .bind(timestamp, id)
    .run();
}

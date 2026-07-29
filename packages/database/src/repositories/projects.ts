import type { ProjectRow } from "../rows";

export async function getProjectBySlug(
  db: D1Database,
  slug: string,
): Promise<ProjectRow | null> {
  return db
    .prepare("SELECT * FROM projects WHERE slug = ?1")
    .bind(slug)
    .first<ProjectRow>();
}

export async function getProjectById(
  db: D1Database,
  id: string,
): Promise<ProjectRow | null> {
  return db.prepare("SELECT * FROM projects WHERE id = ?1").bind(id).first<ProjectRow>();
}

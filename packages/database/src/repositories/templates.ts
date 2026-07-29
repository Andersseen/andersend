import type { CreateTemplateInput, UpdateTemplateInput } from "@andersseen/contracts";
import { createId } from "../ids";
import { mapTemplateRow } from "../mappers";
import type { Template } from "@andersseen/contracts";
import type { TemplateRow } from "../rows";

export async function listTemplates(
  db: D1Database,
  projectId: string,
): Promise<Template[]> {
  const result = await db
    .prepare("SELECT * FROM templates WHERE project_id = ?1 ORDER BY created_at DESC")
    .bind(projectId)
    .all<TemplateRow>();
  return result.results.map(mapTemplateRow);
}

export async function getTemplateById(
  db: D1Database,
  projectId: string,
  id: string,
): Promise<Template | null> {
  const row = await db
    .prepare("SELECT * FROM templates WHERE project_id = ?1 AND id = ?2")
    .bind(projectId, id)
    .first<TemplateRow>();
  return row ? mapTemplateRow(row) : null;
}

export async function getTemplateBySlug(
  db: D1Database,
  projectId: string,
  slug: string,
): Promise<Template | null> {
  const row = await db
    .prepare("SELECT * FROM templates WHERE project_id = ?1 AND slug = ?2")
    .bind(projectId, slug)
    .first<TemplateRow>();
  return row ? mapTemplateRow(row) : null;
}

export async function createTemplate(
  db: D1Database,
  projectId: string,
  input: CreateTemplateInput,
): Promise<Template> {
  const id = createId("tmpl");
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO templates (id, project_id, name, slug, subject, html, text, variables, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)`,
    )
    .bind(
      id,
      projectId,
      input.name,
      input.slug,
      input.subject,
      input.html,
      input.text,
      JSON.stringify(input.variables),
      now,
    )
    .run();

  return {
    id,
    projectId,
    name: input.name,
    slug: input.slug,
    subject: input.subject,
    html: input.html,
    text: input.text,
    variables: input.variables,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTemplate(
  db: D1Database,
  projectId: string,
  id: string,
  input: UpdateTemplateInput,
): Promise<Template | null> {
  const existing = await getTemplateById(db, projectId, id);
  if (!existing) return null;

  const next: Template = {
    ...existing,
    ...input,
    variables: input.variables ?? existing.variables,
    updatedAt: new Date().toISOString(),
  };

  await db
    .prepare(
      `UPDATE templates
       SET name = ?1, subject = ?2, html = ?3, text = ?4, variables = ?5, updated_at = ?6
       WHERE project_id = ?7 AND id = ?8`,
    )
    .bind(
      next.name,
      next.subject,
      next.html,
      next.text,
      JSON.stringify(next.variables),
      next.updatedAt,
      projectId,
      id,
    )
    .run();

  return next;
}

export async function deleteTemplate(
  db: D1Database,
  projectId: string,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM templates WHERE project_id = ?1 AND id = ?2")
    .bind(projectId, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

import type { TemplateVariables } from "@andersseen/contracts";

export interface TemplateSource {
  subject: string;
  html: string;
  text: string;
}

export interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
  missingVariables: string[];
}

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function extractVariableNames(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    if (name) names.add(name);
  }
  return [...names];
}

interface InterpolateResult {
  result: string;
  missing: string[];
}

function interpolate(
  source: string,
  variables: TemplateVariables,
  options: { escape: boolean },
): InterpolateResult {
  const missing: string[] = [];

  const result = source.replace(VARIABLE_PATTERN, (_match, name: string) => {
    if (!(name in variables)) {
      missing.push(name);
      return "";
    }
    const value = String(variables[name]);
    return options.escape ? escapeHtml(value) : value;
  });

  return { result, missing };
}

/**
 * Renders `{{variableName}}` placeholders in a template's subject/html/text.
 * HTML output is escaped per-variable to prevent markup injection; subject
 * and plain-text output are not (there is no markup context to escape into).
 * Missing variables resolve to an empty string and are reported so callers
 * (API validation, template preview) can surface a warning.
 */
export function renderTemplate(
  template: TemplateSource,
  variables: TemplateVariables = {},
): RenderedTemplate {
  const subject = interpolate(template.subject, variables, { escape: false });
  const html = interpolate(template.html, variables, { escape: true });
  const text = interpolate(template.text, variables, { escape: false });

  const missingVariables = [
    ...new Set([...subject.missing, ...html.missing, ...text.missing]),
  ];

  return {
    subject: subject.result,
    html: html.result,
    text: text.result,
    missingVariables,
  };
}

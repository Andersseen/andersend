import { z } from "zod";

/**
 * Matches a bare email address or an RFC 5322 "display name" form, e.g.
 * `Andersend <no-reply@andersseen.dev>`. Kept intentionally simple: this is a
 * personal platform, not a full RFC 5322 parser.
 */
const EMAIL_ADDRESS_PATTERN =
  /^(?:[^<>]+<[^\s<>]+@[^\s<>]+\.[^\s<>]+>|[^\s<>]+@[^\s<>]+\.[^\s<>]+)$/;

export const emailAddressSchema = z
  .string()
  .trim()
  .min(3)
  .max(320)
  .regex(
    EMAIL_ADDRESS_PATTERN,
    'Must be an email address, optionally formatted as "Name <email@example.com>"',
  );

export type EmailAddress = z.infer<typeof emailAddressSchema>;

export function extractEmailAddress(address: string): string {
  const match = /<([^>]+)>/.exec(address);
  return (match?.[1] ?? address).trim().toLowerCase();
}

export const templateVariablesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

export type TemplateVariables = z.infer<typeof templateVariablesSchema>;

export const DEFAULT_FROM_ADDRESS = "Andersend <no-reply@andersseen.dev>";

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a lowercase kebab-case slug");

export type IdPrefix = "proj" | "key" | "tmpl" | "email" | "evt";

export function createId(prefix: IdPrefix): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

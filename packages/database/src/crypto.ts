/**
 * Hashes an API key for storage in `api_keys.key_hash`. Uses Web Crypto
 * (available in Workers and Node 22+), so this works both at request time
 * and in local Node tooling (seed scripts) without extra dependencies.
 */
export async function hashApiKey(rawKey: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawKey);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

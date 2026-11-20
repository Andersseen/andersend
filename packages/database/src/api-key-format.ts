/**
 * API keys look like `and_<id>_<secret>`. The prefix — everything up to and
 * including the second underscore — is stored in plaintext (`api_keys.prefix`)
 * so a key can be looked up without scanning hashes; only the SHA-256 of the
 * full key is stored (`api_keys.key_hash`). The seeded dev key `and_dev_local`
 * is an instance of the same format (prefix `and_dev_`).
 */
export const API_KEY_NAMESPACE = "and_";

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 8;
const SECRET_BYTES = 32;

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  // 256 % 36 bias is irrelevant for a lookup id; the secret carries the entropy.
  return [...bytes]
    .map((byte) => ID_ALPHABET[byte % ID_ALPHABET.length])
    .join("");
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface GeneratedApiKey {
  /** Full plaintext key — show it once, never persist it. */
  key: string;
  /** Value for `api_keys.prefix`. */
  prefix: string;
}

export function generateApiKey(): GeneratedApiKey {
  const prefix = `${API_KEY_NAMESPACE}${randomId()}_`;
  const secret = base64Url(
    crypto.getRandomValues(new Uint8Array(SECRET_BYTES)),
  );
  return { key: `${prefix}${secret}`, prefix };
}

/** Returns the stored-prefix part of a presented key, or `null` if it isn't in the `and_<id>_<secret>` shape. */
export function parseApiKeyPrefix(rawKey: string): string | null {
  if (!rawKey.startsWith(API_KEY_NAMESPACE)) return null;
  const separator = rawKey.indexOf("_", API_KEY_NAMESPACE.length);
  if (separator <= API_KEY_NAMESPACE.length || separator === rawKey.length - 1)
    return null;
  return rawKey.slice(0, separator + 1);
}

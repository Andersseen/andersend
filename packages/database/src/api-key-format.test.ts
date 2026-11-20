import { describe, expect, it } from "vitest";
import { generateApiKey, parseApiKeyPrefix } from "./api-key-format";
import { DEV_API_KEY_PLAINTEXT, DEV_API_KEY_PREFIX } from "./constants";

describe("generateApiKey", () => {
  it("produces and_<id8>_<secret> with a matching prefix", () => {
    const { key, prefix } = generateApiKey();
    expect(prefix).toMatch(/^and_[a-z0-9]{8}_$/);
    expect(key.startsWith(prefix)).toBe(true);
    expect(key.slice(prefix.length)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("generates unique keys", () => {
    expect(generateApiKey().key).not.toBe(generateApiKey().key);
  });

  it("round-trips through parseApiKeyPrefix", () => {
    const { key, prefix } = generateApiKey();
    expect(parseApiKeyPrefix(key)).toBe(prefix);
  });
});

describe("parseApiKeyPrefix", () => {
  it("treats the seeded dev key as the same format", () => {
    expect(parseApiKeyPrefix(DEV_API_KEY_PLAINTEXT)).toBe(DEV_API_KEY_PREFIX);
  });

  it.each([
    "",
    "not-a-key",
    "and_",
    "and__secret",
    "and_abc",
    "and_abc_",
    "re_abc_def",
  ])("rejects %j", (value) => {
    expect(parseApiKeyPrefix(value)).toBeNull();
  });
});

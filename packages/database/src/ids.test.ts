import { describe, expect, it } from "vitest";
import { createId } from "./ids";

describe("createId", () => {
  it("prefixes the generated id", () => {
    expect(createId("email")).toMatch(/^email_[0-9a-f-]{36}$/);
  });

  it("generates unique ids", () => {
    expect(createId("tmpl")).not.toBe(createId("tmpl"));
  });
});

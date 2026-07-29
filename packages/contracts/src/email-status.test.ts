import { describe, expect, it } from "vitest";
import { canTransitionEmailStatus } from "./email-status";

describe("canTransitionEmailStatus", () => {
  it("allows queued to processing", () => {
    expect(canTransitionEmailStatus("queued", "processing")).toBe(true);
  });

  it("allows processing to delivered", () => {
    expect(canTransitionEmailStatus("processing", "delivered")).toBe(true);
  });

  it("rejects delivered to processing", () => {
    expect(canTransitionEmailStatus("delivered", "processing")).toBe(false);
  });

  it("rejects a status transitioning to itself", () => {
    expect(canTransitionEmailStatus("queued", "queued")).toBe(false);
  });

  it("rejects skipping backwards from failed", () => {
    expect(canTransitionEmailStatus("failed", "sent")).toBe(false);
  });
});

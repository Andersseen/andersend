import { describe, expect, it } from "vitest";
import { buildPaginationMeta, paginationQuerySchema } from "./pagination";

describe("paginationQuerySchema", () => {
  it("applies defaults when omitted", () => {
    const result = paginationQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces string query params to numbers", () => {
    const result = paginationQuerySchema.parse({ page: "2", pageSize: "50" });
    expect(result).toEqual({ page: 2, pageSize: 50 });
  });

  it("rejects a page size above the maximum", () => {
    const result = paginationQuerySchema.safeParse({ pageSize: 500 });
    expect(result.success).toBe(false);
  });
});

describe("buildPaginationMeta", () => {
  it("computes total pages", () => {
    expect(buildPaginationMeta(1, 20, 45)).toEqual({
      page: 1,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("clamps total pages to at least 1 when there is no data", () => {
    expect(buildPaginationMeta(1, 20, 0)).toEqual({
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    });
  });
});

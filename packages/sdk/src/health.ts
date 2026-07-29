import { healthResponseSchema, type HealthResponse } from "@andersseen/contracts";
import type { HttpClient } from "./http-client";

export interface HealthResource {
  get(): Promise<HealthResponse>;
}

export function createHealthResource(http: HttpClient): HealthResource {
  return {
    async get() {
      return http.request("/health", { method: "GET" }, healthResponseSchema);
    },
  };
}

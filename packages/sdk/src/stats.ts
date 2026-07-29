import { dashboardStatsSchema, type DashboardStats } from "@andersseen/contracts";
import type { HttpClient } from "./http-client";

export interface StatsResource {
  get(): Promise<DashboardStats>;
}

export function createStatsResource(http: HttpClient): StatsResource {
  return {
    async get() {
      return http.request("/v1/stats", { method: "GET" }, dashboardStatsSchema);
    },
  };
}

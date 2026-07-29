import { apiKeyListResponseSchema, type ApiKey } from "@andersseen/contracts";
import type { HttpClient } from "./http-client";

export interface ApiKeysResource {
  list(): Promise<ApiKey[]>;
}

export function createApiKeysResource(http: HttpClient): ApiKeysResource {
  return {
    async list() {
      const response = await http.request("/v1/api-keys", { method: "GET" }, apiKeyListResponseSchema);
      return response.data;
    },
  };
}

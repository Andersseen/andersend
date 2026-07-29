import type { ZodType } from "zod";
import { AndersendApiError } from "./errors";

export interface AndersendClientOptions {
  /** The API key to authenticate with, e.g. `process.env.ANDERSEND_API_KEY`. */
  apiKey: string;
  /** Defaults to the production API domain. */
  baseUrl?: string;
  /** Override for testing; defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

export interface HttpClient {
  request<T>(
    path: string,
    init: RequestInit,
    schema: ZodType<T>,
  ): Promise<T>;
}

interface ErrorResponseBody {
  error?: { code?: string; message?: string; requestId?: string };
}

export function createHttpClient(options: AndersendClientOptions): HttpClient {
  const baseUrl = options.baseUrl ?? "https://api.mail.andersseen.dev";
  const fetchImpl = options.fetch ?? fetch;

  return {
    async request<T>(path: string, init: RequestInit, schema: ZodType<T>): Promise<T> {
      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${options.apiKey}`);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetchImpl(`${baseUrl}${path}`, { ...init, headers });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ErrorResponseBody | null;
        throw new AndersendApiError(
          response.status,
          body?.error?.code ?? "internal_error",
          body?.error?.message ?? `Request to ${path} failed with status ${response.status}`,
          body?.error?.requestId,
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const json = await response.json();
      return schema.parse(json);
    },
  };
}

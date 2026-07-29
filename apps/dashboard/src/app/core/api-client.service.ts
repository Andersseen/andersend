import { Injectable } from '@angular/core';
import { createAndersendClient, type AndersendClient } from '@andersseen/sdk';

const DEFAULT_BASE_URL = 'http://localhost:8787';
const DEFAULT_API_KEY = 'and_dev_local';

/**
 * Thin wrapper around the `@andersseen/sdk` client so the whole dashboard
 * shares one instance and one place to read the local dev configuration
 * from. Every page talks to the API exclusively through `client`.
 */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL;

  readonly client: AndersendClient = createAndersendClient({
    baseUrl: this.baseUrl,
    apiKey: import.meta.env.VITE_ANDERSEND_API_KEY ?? DEFAULT_API_KEY,
  });
}

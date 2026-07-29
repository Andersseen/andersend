import { defineConfig, devices } from '@playwright/test';

const DASHBOARD_URL = 'http://localhost:5173';
const API_HEALTH_URL = 'http://localhost:8787/health';

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: DASHBOARD_URL,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @andersseen/api dev',
      cwd: '..',
      url: API_HEALTH_URL,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @andersseen/dashboard dev',
      cwd: '..',
      url: DASHBOARD_URL,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

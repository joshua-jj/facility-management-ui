import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the local full-stack reconciliation E2E.
 *
 * Layering:
 *   - globalSetup  -> e2e/stack.sh up   (Postgres + API + seed)
 *   - webServer    -> builds & starts the Next.js UI with the API base
 *                     URL baked in (NEXT_PUBLIC_* is inlined at build time)
 *   - globalTeardown -> e2e/stack.sh down
 *
 * The API base MUST include the URI version segment: every UI endpoint is
 * `${NEXT_PUBLIC_BASE_URL}<path>` and all Nest controllers are `version: '1'`,
 * so the reachable base is http://localhost:3800/api/v1/ (verified by curl:
 * /api/v1/authentication/login and /api/v1/reconciliation both resolve,
 * /api/... without the version 404s).
 */
const API_BASE_URL = 'http://localhost:3800/api/v1/';
const UI_PORT = 3000;
const UI_BASE_URL = `http://localhost:${UI_PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  // The lifecycle is inherently sequential (shared DB state across the two
  // logins); keep it single-worker and serial.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never' }]],

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: UI_BASE_URL,
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Build + start the real UI against the local API. NEXT_PUBLIC_BASE_URL is
  // inlined at `next build` time, so it must be present for the build step.
  webServer: {
    command: `NEXT_PUBLIC_BASE_URL=${API_BASE_URL} yarn build && NEXT_PUBLIC_BASE_URL=${API_BASE_URL} yarn start -p ${UI_PORT}`,
    url: UI_BASE_URL,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

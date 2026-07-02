import { defineConfig } from '@playwright/test';

const PORT = process.env.CI ? 8080 : 4173;

// Live-site mode: set PLAYWRIGHT_BASE_URL (e.g. https://diagnosticpro.io) to run
// the e2e-live/ customer-journey suite against a real deployment. In that mode
// no local webServer is started and ONLY the live-journey project is selected.
// Without it, the local e2e/ suite runs against `vite preview` exactly as before.
const LIVE_BASE = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  fullyParallel: !LIVE_BASE,
  forbidOnly: !!process.env.CI,
  retries: LIVE_BASE ? 0 : process.env.CI ? 2 : 0,
  workers: LIVE_BASE ? 1 : process.env.CI ? 1 : undefined,
  reporter: LIVE_BASE
    ? [['list'], ['html', { open: 'never' }]]
    : process.env.CI ? 'github' : 'list',
  expect: {
    timeout: LIVE_BASE ? 15000 : 5000,
  },
  use: {
    baseURL: LIVE_BASE ?? `http://localhost:${PORT}`,
    trace: LIVE_BASE ? 'retain-on-failure' : 'on-first-retry',
  },
  projects: LIVE_BASE
    ? [
        {
          name: 'live-journey',
          testDir: './e2e-live',
          use: { browserName: 'chromium' },
          // Real gpt-4o report generation runs 1–3 minutes; individual steps
          // that poll longer bump their own timeout via test.setTimeout().
          timeout: 300_000,
        },
      ]
    : [
        {
          name: 'chromium',
          testDir: './e2e',
          use: { browserName: 'chromium' },
        },
      ],
  webServer: LIVE_BASE
    ? undefined
    : {
        command: `npx vite preview --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});

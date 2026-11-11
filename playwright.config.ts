import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 360_000,
  expect: { timeout: 360_000 },
  use: {
    baseURL: 'http://127.0.0.1:8080',
    channel: 'chrome',
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: 'npx tsc && npx web-dev-server --config web-dev-server.config.mjs',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

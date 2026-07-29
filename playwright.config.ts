import { defineConfig, devices } from '@playwright/test';

const localBaseUrl = 'http://127.0.0.1:4173';
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/browser',
  outputDir: '.build/evidence/playwright',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: externalBaseUrl ? 120_000 : 30_000,
  reporter: process.env.CI
    ? [['line'], ['junit', { outputFile: '.build/evidence/playwright-junit.xml' }]]
    : [['line']],
  use: {
    baseURL: externalBaseUrl ?? localBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory dist',
        url: localBaseUrl,
        reuseExistingServer: false,
        timeout: 30_000,
      },
});

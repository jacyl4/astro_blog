import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: '.build/evidence/playwright',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['line'], ['junit', { outputFile: '.build/evidence/playwright-junit.xml' }]]
    : [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

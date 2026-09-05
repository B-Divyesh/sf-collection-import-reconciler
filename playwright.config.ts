import { defineConfig } from '@playwright/test';

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: externalBaseURL ?? 'http://127.0.0.1:4173', trace: 'retain-on-failure', bypassCSP: Boolean(externalBaseURL) },
  webServer: externalBaseURL ? undefined : { command: 'npm run build && npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  projects: [
    { name: 'desktop-chromium', use: { browserName: 'chromium' } },
    { name: 'mobile-chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
});

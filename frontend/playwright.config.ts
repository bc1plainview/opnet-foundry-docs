import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    retries: 1,
    use: {
        baseURL: process.env.APP_URL ?? 'http://localhost:5177',
        headless: true,
        viewport: { width: 1440, height: 900 },
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    // Dev server already running — no webServer block needed
    outputDir: 'tests/e2e/results',
});

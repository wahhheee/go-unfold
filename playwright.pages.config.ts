import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/pages.spec.ts',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4173/go-unfold/', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'pages-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'pages-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/serve-static.mjs',
    wait: { stdout: /静态站点：http:\/\/127\.0\.0\.1:4173\/go-unfold\// },
    timeout: 10000,
  },
});

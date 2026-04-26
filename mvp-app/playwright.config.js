// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const playwrightPackageVersion = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'node_modules', '@playwright', 'test', 'package.json'), 'utf8'),
).version;

function browserstackWsEndpoint() {
  const user = process.env.BROWSERSTACK_USERNAME ?? '';
  const key = process.env.BROWSERSTACK_ACCESS_KEY ?? '';
  const caps = {
    browser: 'chrome',
    os: 'Windows',
    os_version: '11',
    name: 'pilot108-design',
    build: process.env.BROWSERSTACK_BUILD_NAME ?? 'mvp-app-local-tunnel',
    'browserstack.username': user,
    'browserstack.accessKey': key,
    'browserstack.local': true,
    ...(process.env.BROWSERSTACK_LOCAL_IDENTIFIER
      ? { 'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER }
      : {}),
    'client.playwrightVersion': playwrightPackageVersion,
  };
  return `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const storageState = path.join(__dirname, 'e2e', '.auth', 'user.json');

/** @type {import('@playwright/test').Project[]} */
const projects = [
  {
    name: 'chromium-local',
    testIgnore: ['**/*.live.spec.ts'],
    use: {
      ...devices['Pixel 7'],
      storageState,
    },
  },
  {
    name: 'chromium-live',
    testMatch: ['**/*.live.spec.ts'],
    use: {
      ...devices['Pixel 7'],
    },
  },
];

if (process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY) {
  projects.push({
    name: 'browserstack-chrome',
    testIgnore: ['**/*.live.spec.ts'],
    use: {
      connectOptions: {
        wsEndpoint: browserstackWsEndpoint(),
      },
      // Same mobile profile as chromium-local (design-matrix / DESIGN.md).
      ...devices['Pixel 7'],
      storageState,
    },
  });
}

module.exports = defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.BROWSERSTACK_USERNAME ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.08,
      threshold: 0.25,
      animations: 'disabled',
    },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}-snapshots/{arg}{ext}',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- -H 127.0.0.1 -p 3000',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects,
});

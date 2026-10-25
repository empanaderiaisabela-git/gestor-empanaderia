import { defineConfig, devices } from '@playwright/test';
import { assertTestDatabaseUrl } from './src/test/test-database-url';

const { CI, GITHUB_REF, LOCAL_DATABASE_URL, NODE_ENV, APP_ENV } = process.env;
assertTestDatabaseUrl({ url: LOCAL_DATABASE_URL, nodeEnv: NODE_ENV, appEnv: APP_ENV });

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const loggedIn = { storageState: 'playwright/.auth/user.json' };
const isCi = Boolean(CI);
const everyBrowser = isCi && GITHUB_REF === 'refs/heads/main';

const extraBrowsers = [
  { name: 'firefox', use: { ...devices['Desktop Firefox'], ...loggedIn }, dependencies: ['setup'] },
  { name: 'webkit', use: { ...devices['Desktop Safari'], ...loggedIn }, dependencies: ['setup'] },
];

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...loggedIn }, dependencies: ['setup'] },
    ...(everyBrowser ? extraBrowsers : []),
  ],
  webServer: {
    command: 'npm run e2e:server',
    url: `${BASE_URL}/login`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: { NODE_OPTIONS: '', NEXT_DIST_DIR: '.next-e2e' },
  },
});

import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { assertTestDatabaseUrl } from '../src/test/test-database-url';

const E2E_DIST_DIR = '.next-e2e';
const { LOCAL_DATABASE_URL, NODE_ENV, APP_ENV } = process.env;

assertTestDatabaseUrl({ url: LOCAL_DATABASE_URL, nodeEnv: NODE_ENV, appEnv: APP_ENV });
rmSync(E2E_DIST_DIR, { recursive: true, force: true });
execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
execSync('npm run db:seed', { stdio: 'inherit' });

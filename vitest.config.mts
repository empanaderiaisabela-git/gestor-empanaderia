import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

const emptyModule = fileURLToPath(new URL('./src/test/empty-module.ts', import.meta.url));
const legacyFiles: string[] = JSON.parse(readFileSync(new URL('./eslint-legacy.json', import.meta.url), 'utf8'));
const literalGlob = (path: string): string => path.replace(/[[\]()*?{}!+@]/g, (char) => `\\${char}`);

const NOT_COVERED = ['eslint/**', 'scripts/**', 'src/config/**', 'src/**/repository/**', 'src/lib/db/schema.ts', 'src/lib/db/menu-schema.ts', 'src/test/**', 'src/**/testing/**'];

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { 'server-only': emptyModule },
  },
  test: {
    allowOnly: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [...NOT_COVERED, ...legacyFiles.map(literalGlob)],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: [...configDefaults.exclude, 'src/**/*.int.test.ts'],
          setupFiles: ['./src/test/setup/next-headers.setup.ts', './src/test/setup/next-cache.setup.ts', './src/test/setup/no-database.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup/component.setup.ts', './src/test/setup/no-database.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.int.test.ts'],
          globalSetup: ['./src/test/integration.global-setup.ts'],
          setupFiles: ['./src/test/setup/next-headers.setup.ts', './src/test/setup/next-cache.setup.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});

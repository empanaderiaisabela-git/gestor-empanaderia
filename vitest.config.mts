import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

const emptyModule = fileURLToPath(new URL('./src/test/empty-module.ts', import.meta.url));

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
      exclude: ['eslint/**', 'scripts/**'],
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
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.int.test.ts'],
          globalSetup: ['./src/test/integration.global-setup.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});

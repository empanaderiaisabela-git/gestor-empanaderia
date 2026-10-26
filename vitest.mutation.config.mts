import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

const emptyModule = fileURLToPath(new URL('./src/test/empty-module.ts', import.meta.url));

export default defineConfig({
  resolve: { tsconfigPaths: true, alias: { 'server-only': emptyModule } },
  test: {
    environment: 'node',
    include: ['src/features/provider/**/*.test.ts', 'src/features/menu/**/*.test.ts', 'src/features/stock/**/*.test.ts', 'src/features/order/**/*.test.ts', 'src/features/promotion/**/*.test.ts', 'src/lib/errors/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'src/**/*.int.test.ts'],
    setupFiles: ['./src/test/setup/next-headers.setup.ts', './src/test/setup/next-cache.setup.ts', './src/test/setup/no-database.setup.ts'],
  },
});

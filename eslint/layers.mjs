const SQL = { name: 'drizzle-orm', importNames: ['sql'], message: 'Prohibido SQL plano: usá el query builder de Drizzle (sql sólo en check() de schema.ts).' };
const PG = { name: 'pg', message: 'Sólo src/lib/db/index.ts y src/test/ abren conexiones con pg.' };
const DB_CONNECTION = { name: '@/lib/db', message: 'domain sólo usa @/lib/db/schema para derivar schemas.' };
const DB_CLIENT = { name: '@/lib/db', message: 'El service sólo usa el helper de transacción de @/lib/db.' };

const forbid = (group, message) => ({ group, message });

const DB = forbid(['@/lib/db', '@/lib/db/*'], 'Sólo el repositorio toca la base (capas: ui → actions → services → repository → db).');
const DB_EXCEPT_TRANSACTION = forbid(['@/lib/db/*', '!@/lib/db/transaction'], 'El service sólo usa el helper de transacción de @/lib/db.');
const REPOSITORY = forbid(['**/repository', '**/repository/*'], 'Esta capa no importa repositorios.');
const SERVICES = forbid(['**/services', '**/services/*'], 'Esta capa no importa services.');
const ACTIONS = forbid(['**/actions', '**/actions/*'], 'Esta capa no importa actions.');
const UI = forbid(['**/ui', '**/ui/**'], 'Esta capa no importa UI.');
const STORE = forbid(['**/store', '**/store/*'], 'Esta capa no importa stores.');
const NEXT = forbid(['next', 'next/*'], 'Esta capa no depende de Next.');
const FEATURES = forbid(['@/features', '@/features/**'], 'Esta capa no importa features.');

function restrict(patterns, paths = [SQL, PG]) {
  return { 'no-restricted-imports': ['error', { paths, patterns }] };
}

const NOT_LAYERED = ['src/lib/db/schema.ts', 'src/lib/db/index.ts', 'src/test/**', 'src/**/testing/**', 'src/**/*.test.ts', 'src/**/*.test-d.ts'];

export const layerConfigs = [
  { files: ['src/**/*.{ts,tsx}'], rules: restrict([]) },
  { files: ['src/app/**/*.{ts,tsx}', 'src/features/*/ui/**/*.{ts,tsx}'], rules: restrict([DB, REPOSITORY, SERVICES]) },
  { files: ['src/features/*/store/**/*.ts'], rules: restrict([DB, REPOSITORY, ACTIONS]) },
  { files: ['src/features/*/actions/**/*.ts'], rules: restrict([DB, REPOSITORY, UI, STORE]) },
  { files: ['src/features/*/services/**/*.ts'], rules: restrict([DB_EXCEPT_TRANSACTION, ACTIONS, UI, STORE, NEXT], [SQL, PG, DB_CLIENT]) },
  { files: ['src/features/*/repository/**/*.ts'], rules: restrict([SERVICES, ACTIONS, UI, STORE, NEXT]) },
  { files: ['src/features/*/domain/**/*.ts'], rules: restrict([REPOSITORY, SERVICES, ACTIONS, NEXT], [SQL, PG, DB_CONNECTION]) },
  { files: ['src/components/**/*.{ts,tsx}', 'src/lib/**/*.ts'], rules: restrict([FEATURES]) },
  { files: NOT_LAYERED, rules: { 'no-restricted-imports': 'off' } },
];

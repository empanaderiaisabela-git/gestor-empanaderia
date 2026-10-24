import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const LINES_101 = Array.from({ length: 101 }, (_, index) => `export const line${index} = ${index};`).join('\n');
const BODY_41 = Array.from({ length: 39 }, (_, index) => `  const value${index} = ${index};`).join('\n');
const FUNCTION_41_LINES = `export function long(): number {\n${BODY_41}\n  return 0;\n}`;

let eslint: ESLint;

async function ruleIdsFor(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId ?? 'fatal');
}

describe('reglas duras de ESLint (T-3 CA-1)', { timeout: 60000 }, () => {
  beforeAll(() => {
    eslint = new ESLint();
  });

  it.each([
    { caso: 'un archivo de 101 líneas', filePath: 'src/features/demo/domain/a.ts', code: LINES_101, ruleId: 'max-lines' },
    { caso: 'una función de 41 líneas', filePath: 'src/features/demo/services/b.ts', code: FUNCTION_41_LINES, ruleId: 'max-lines-per-function' },
    { caso: 'más de 3 parámetros', filePath: 'src/lib/c.ts', code: 'export function f(a: number, b: number, c: number, d: number): number {\n  return a + b + c + d;\n}', ruleId: 'max-params' },
    { caso: 'any', filePath: 'src/lib/d.ts', code: 'export function f(value: any): string {\n  return String(value);\n}', ruleId: '@typescript-eslint/no-explicit-any' },
    { caso: 'el operador !', filePath: 'src/lib/e.ts', code: 'export function f(value?: string): string {\n  return value!;\n}', ruleId: '@typescript-eslint/no-non-null-assertion' },
    { caso: 'un as', filePath: 'src/lib/f.ts', code: "export const value = JSON.parse('1') as number;", ruleId: '@typescript-eslint/consistent-type-assertions' },
    { caso: 'un export sin tipo de retorno', filePath: 'src/lib/g.ts', code: 'export function f() {\n  return 1;\n}', ruleId: '@typescript-eslint/explicit-module-boundary-types' },
    { caso: 'un comentario', filePath: 'src/lib/h.ts', code: '// explica algo\nexport const value = 1;', ruleId: 'local/no-comments' },
    { caso: 'sql de Drizzle fuera de schema.ts', filePath: 'src/features/demo/repository/i.ts', code: "import { sql } from 'drizzle-orm';\nexport const raw = sql`select 1`;", ruleId: 'no-restricted-imports' },
    { caso: 'pg directo', filePath: 'src/features/demo/repository/j.ts', code: "import { Pool } from 'pg';\nexport const pool = new Pool();", ruleId: 'no-restricted-imports' },
    { caso: 'una action que importa la base', filePath: 'src/features/demo/actions/k.ts', code: "import { db } from '@/lib/db';\nexport const client = db;", ruleId: 'no-restricted-imports' },
    { caso: 'una action que importa un repositorio', filePath: 'src/features/demo/actions/l.ts', code: "import { repo } from '../repository/demo.repository';\nexport const value = repo;", ruleId: 'no-restricted-imports' },
    { caso: 'la UI que importa un service', filePath: 'src/features/demo/ui/m.tsx', code: "import { service } from '../services/demo.service';\nexport const value = service;", ruleId: 'no-restricted-imports' },
    { caso: 'un service que importa Next', filePath: 'src/features/demo/services/n.ts', code: "import { cookies } from 'next/headers';\nexport const value = cookies;", ruleId: 'no-restricted-imports' },
    { caso: 'un service que importa el cliente de la base', filePath: 'src/features/demo/services/u.ts', code: "import { db } from '@/lib/db';\nexport const client = db;", ruleId: 'no-restricted-imports' },
    { caso: 'lib que importa un feature', filePath: 'src/lib/o.ts', code: "import { x } from '@/features/demo/domain/demo.schema';\nexport const value = x;", ruleId: 'no-restricted-imports' },
  ])('rechaza $caso', async ({ filePath, code, ruleId }) => {
    expect(await ruleIdsFor(filePath, code)).toContain(ruleId);
  });

  it.each([
    ['un comentario "Por qué:"', 'src/lib/p.ts', '// Por qué: la API externa exige este orden.\nexport const value = 1;'],
    ['as const', 'src/lib/q.ts', "export const roles = ['admin'] as const;"],
    ['domain que deriva de @/lib/db/schema', 'src/features/demo/domain/r.ts', "import { users } from '@/lib/db/schema';\nexport const table = users;"],
    ['un service que usa el helper de transacción', 'src/features/demo/services/s.ts', "import { withTransaction } from '@/lib/db/transaction';\nexport const run = withTransaction;"],
    ['un describe largo en un test', 'src/features/demo/t.test.ts', `export function suite(): void {\n${BODY_41}\n}`],
  ])('permite %s', async (_caso, filePath, code) => {
    expect(await ruleIdsFor(filePath, code)).toEqual([]);
  });

  it('no aplica las reglas nuevas a un archivo de la lista legacy', async () => {
    const code = '// comentario heredado\nexport function f(value: any) {\n  return value!;\n}';
    expect(await ruleIdsFor('src/lib/utils.ts', code)).toEqual([]);
  });
});

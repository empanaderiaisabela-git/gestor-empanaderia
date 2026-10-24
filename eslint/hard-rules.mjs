import { readFileSync } from 'node:fs';

export const CODE_FILES = ['**/*.{ts,tsx,mts,js,mjs}'];
export const TS_FILES = ['**/*.{ts,tsx}'];
export const TEST_FILES = ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.setup.ts', '**/*.behavior.ts'];

export const codeRules = {
  'max-lines': ['error', { max: 100, skipBlankLines: false, skipComments: false }],
  'max-lines-per-function': ['error', { max: 40, skipBlankLines: false, skipComments: false }],
  'max-params': ['error', 3],
  'local/no-comments': 'error',
};

export const typescriptRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
  '@typescript-eslint/explicit-module-boundary-types': 'error',
};

const NEW_RULES = [...Object.keys(codeRules), ...Object.keys(typescriptRules), 'no-restricted-imports'];

function literalGlob(path) {
  return path.replace(/[[\]()*?{}!+@]/g, (char) => `\\${char}`);
}

const LINTED_BY_ESLINT = /\.(ts|tsx|mts|js|mjs)$/;

export function legacyConfig(listPath) {
  const files = JSON.parse(readFileSync(listPath, 'utf8')).filter((file) => LINTED_BY_ESLINT.test(file));
  if (files.length === 0) return [];
  const rules = Object.fromEntries(NEW_RULES.map((name) => [name, 'off']));
  return [{ files: files.map(literalGlob), rules }];
}

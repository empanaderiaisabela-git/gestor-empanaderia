import nextConfig from 'eslint-config-next';
import prettierConfig from 'eslint-config-prettier';
import { CODE_FILES, TEST_FILES, TS_FILES, codeRules, legacyConfig, typescriptRules } from './eslint/hard-rules.mjs';
import { layerConfigs } from './eslint/layers.mjs';
import { localPlugin } from './eslint/rules/no-comments.mjs';

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ['**/node_modules/**', '.next/**', '.next-e2e/**', 'dist/**', 'build/**', 'public/**', '**/playwright-report/**', '**/test-results/**', 'coverage/**', '.vitest/**', '.agents/**', '.claude/**', 'next-env.d.ts'],
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    rules: {
      'no-unused-vars': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  { files: CODE_FILES, plugins: { local: localPlugin }, rules: codeRules },
  { files: TS_FILES, rules: typescriptRules },
  { files: TEST_FILES, rules: { 'max-lines-per-function': 'off' } },
  ...layerConfigs,
  ...legacyConfig('./eslint-legacy.json'),
  prettierConfig,
];

export default eslintConfig;

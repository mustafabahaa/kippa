import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    ...js.configs.recommended,
    files: ['**/*.mjs'],
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'all', caughtErrors: 'all' }],
    },
  },
  {
    files: ['src/**/*.ts', 'mcp/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'all', caughtErrors: 'all' }],
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'firebase',
                'firebase/**',
                'firebase-admin',
                'firebase-admin/**',
                'firebase-functions',
                'firebase-functions/**',
              ],
              message: 'Domain rules must remain independent of Firebase infrastructure.',
            },
          ],
        },
      ],
    },
  },
);

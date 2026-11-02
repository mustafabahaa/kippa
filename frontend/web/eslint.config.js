import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import monochromeUi from '@monochrome-ui/design-system/eslint';
import architectureRules from './eslint-rules/architecture.js';
import designSystemRules from './eslint-rules/design-system.js';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Intl: 'readonly',
        React: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        MouseEvent: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'kippa-architecture': { rules: architectureRules },
      'kippa-design': { rules: designSystemRules },
      'monochrome-ui': monochromeUi,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { args: 'all', caughtErrors: 'all' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-deprecated': 'error',
      'kippa-architecture/no-infrastructure-imports-from-ui': 'error',
      'kippa-architecture/feature-public-api': 'error',
      'kippa-design/app-icon-only': 'error',
      'kippa-design/no-direct-ui-imports': 'error',
      'kippa-design/no-visual-sx': 'error',
      'kippa-design/named-typography-variants': 'error',
      'kippa-design/button-loading-prop': 'error',
      'monochrome-ui/known-variants': 'error',
      'monochrome-ui/routed-page-scaffold': ['error', {
        shell: 'src/components/app-shell/AppShell.tsx',
        pages: [
          'src/features/dashboard/Dashboard.tsx',
          'src/features/fast-entry/FastEntry.tsx',
          'src/features/reconciliation/Reconciliation.tsx',
          'src/features/budget-cycles/BudgetCycles.tsx',
          'src/features/budget-cycles/CycleReport.tsx',
          'src/features/transactions/TransactionHistory.tsx',
          'src/features/pending-transactions/PendingTransactions.tsx',
          'src/features/activity/ActivityHistory.tsx',
          'src/features/accounts/Accounts.tsx',
          'src/features/accounts/AccountStatements.tsx',
          'src/features/household/Household.tsx',
          'src/features/categories/Categories.tsx',
          'src/features/notifications/NotificationSettingsForm.tsx',
          'src/features/ai/AiAssistant.tsx',
          'src/features/loans/Loans.tsx',
        ],
      }],
    },
  },
);

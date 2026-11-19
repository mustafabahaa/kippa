import assert from 'node:assert/strict';
import { test } from 'vitest';
import { Linter } from 'eslint';
import monochromeUi from '@monochrome-ui/design-system/eslint';

function violations(code) {
  const linter = new Linter();
  return linter
    .verify(code, {
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { 'monochrome-ui': monochromeUi },
      rules: { 'monochrome-ui/ui-role-variant-names': 'error' },
    })
    .map(({ messageId }) => messageId);
}

test('rejects business-domain variant names and accepts reusable UI roles', () => {
  assert.deepEqual(violations('<Paper variant="loanCard" />;'), ['domainVariant']);
  assert.deepEqual(violations('<Paper variant="actionPanel" />;'), []);
});

test('rejects domain-specific variant names declared by the shared package', () => {
  const rule = monochromeUi.rules['ui-role-variant-names'];
  const reports = [];
  const listeners = rule.create({ options: [], report: (report) => reports.push(report) });
  listeners.Program({ type: 'Program' });
  assert.deepEqual(reports, []);
});

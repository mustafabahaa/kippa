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
      rules: { 'monochrome-ui/input-adornment-spacing': 'error' },
    })
    .map(({ messageId }) => messageId);
}

test('requires InputAdornment around direct start and end adornment elements', () => {
  assert.deepEqual(
    violations(`
    import { TextField as Field } from '@monochrome-ui/design-system';
    <Field slotProps={{ input: { startAdornment: <SearchIcon /> } }} />;
    <Field InputProps={{ endAdornment: <ClearIcon /> }} />;
  `),
    ['missingAdornment', 'missingAdornment'],
  );
});

test('accepts shared InputAdornment wrappers and existing adornment expressions', () => {
  assert.deepEqual(
    violations(`
    import * as UI from '@monochrome-ui/design-system';
    <UI.TextField slotProps={{ input: { startAdornment: <UI.InputAdornment position="start"><SearchIcon /></UI.InputAdornment> } }} />;
    <UI.TextField InputProps={{ endAdornment: existingAdornment }} />;
  `),
    [],
  );
});

test('resolves a locally defined unwrapped adornment', () => {
  assert.deepEqual(
    violations(`
    import { TextField } from '@monochrome-ui/design-system';
    const icon = <SearchIcon />;
    <TextField slotProps={{ input: { startAdornment: icon } }} />;
  `),
    ['missingAdornment'],
  );
});

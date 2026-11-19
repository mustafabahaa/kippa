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
      rules: { 'monochrome-ui/layout-gap': 'error' },
    })
    .map(({ messageId }) => messageId);
}

test('flags cramped gaps between section headings and controls, and between grid form fields', () => {
  assert.deepEqual(
    violations(`
    import { Grid, SectionHeader as SectionHeading, Stack, TextField } from '@monochrome-ui/design-system';
    <Stack spacing={1.25}>
      <SectionHeading title="Filters" subtitle="Find activity" />
      <Grid container spacing={1.25}>
        <TextField label="Search" />
        <TextField label="Member" />
      </Grid>
    </Stack>;
  `),
    ['sectionControlGap', 'gridGap'],
  );
});

test('accepts comfortable section and form spacing and enforces a general Stack minimum', () => {
  assert.deepEqual(
    violations(`
    import { Button, Grid, Paper, SectionHeader as SectionHeading, Stack, TextField } from '@monochrome-ui/design-system';
    <Stack spacing={3.5}>
      <SectionHeading title="Filters" subtitle="Find activity" />
      <Grid container spacing={2}>
        <TextField label="Search" />
        <TextField label="Member" />
      </Grid>
    </Stack>;
    <Stack spacing={1}>
      <Paper />
      <Button>Save</Button>
    </Stack>;
  `),
    ['stackGap'],
  );
});

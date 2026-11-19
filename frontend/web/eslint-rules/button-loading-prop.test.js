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
      rules: { 'monochrome-ui/button-loading-prop': 'error' },
    })
    .map(({ messageId }) => messageId);
}

test('rejects an inline spinner even when loading is supplied', () => {
  assert.deepEqual(
    violations(`
    import { Button as Action, CircularProgress as Spinner } from '@monochrome-ui/design-system';
    <Action loading={busy}>{busy && <Spinner />}Save</Action>;
  `),
    ['inlineButtonSpinner'],
  );
});

test('rejects a spinner returned by a local renderer or passed through spread props', () => {
  assert.deepEqual(
    violations(`
    import * as UI from '@monochrome-ui/design-system';
    const renderIcon = () => busy ? <UI.CircularProgress /> : <SaveIcon />;
    <UI.Button {...{ startIcon: renderIcon() }}>Save</UI.Button>;
  `),
    ['inlineButtonSpinner'],
  );
});

test('rejects inline spinners on native and polymorphic buttons', () => {
  assert.deepEqual(
    violations(`
    import { Paper, CircularProgress } from '@monochrome-ui/design-system';
    <Paper component="button"><CircularProgress />Review</Paper>;
    <button><CircularProgress />Review</button>;
  `),
    ['inlineButtonSpinner', 'inlineButtonSpinner'],
  );
});

test('accepts shared loading with stable content and standalone status indicators', () => {
  assert.deepEqual(
    violations(`
    import * as UI from '@monochrome-ui/design-system';
    <UI.Paper component={UI.Button} onClick={async () => {}} loading={busy}>Review</UI.Paper>;
    <UI.Button onClick={() => open(<UI.CircularProgress />)}>Open</UI.Button>;
    <UI.Box><UI.CircularProgress />Loading page</UI.Box>;
  `),
    [],
  );
});

test('rejects loading indicators positioned alongside button labels', () => {
  assert.deepEqual(
    violations(`
    import { Button, Paper } from '@monochrome-ui/design-system';
    <Button loading={busy} loadingPosition="start">Save</Button>;
    <Paper component={Button} loading={busy} loadingPosition={'end'}>Review</Paper>;
    <Button loading={busy} loadingPosition="center">Save</Button>;
  `),
    ['loadingPosition', 'loadingPosition'],
  );
});

test('rejects a start icon and visible label underneath the centered loading indicator', () => {
  assert.deepEqual(
    violations(`
    import { Button } from '@monochrome-ui/design-system';
    <Button loading={busy} startIcon={<CheckCircleIcon />} onClick={approve}>Approve</Button>;
    <Button loading={busy} onClick={approve}>{busy ? null : 'Approve'}</Button>;
  `),
    ['loadingWithStartIcon'],
  );
});

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, CssBaseline, IconButton, ThemeProvider, Typography } from '@monochrome-ui/design-system';
import { createMonochromeTheme, modeTokens } from '@monochrome-ui/design-system';
import { createKippaTheme } from '@/config/theme';

function rgb(hex: string) {
  const value = hex.replace('#', '');
  const channels =
    value.length === 3
      ? value.split('').map((channel) => channel + channel)
      : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
  return `rgb(${channels.map((channel) => parseInt(channel, 16)).join(', ')})`;
}

function luminance(color: string) {
  const channels = color.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
  const linear = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(background: string, foreground: string) {
  const [a, b] = [luminance(background), luminance(foreground)].sort((left, right) => right - left);
  return (a + 0.05) / (b + 0.05);
}

describe('contained primary button theme states', () => {
  it.each(['light', 'dark'] as const)('keeps enabled and disabled labels readable in %s mode', (mode) => {
    const { unmount } = render(
      <ThemeProvider theme={createMonochromeTheme(mode)}>
        <Button variant="contained" color="primary">
          Confirm
        </Button>
        <Button variant="contained" color="primary" disabled>
          Confirm disabled
        </Button>
      </ThemeProvider>,
    );

    const enabled = screen.getByRole('button', { name: 'Confirm' });
    const disabled = screen.getByRole('button', { name: 'Confirm disabled' });
    const enabledStyle = getComputedStyle(enabled);
    const disabledStyle = getComputedStyle(disabled);
    const tokens = modeTokens(mode);
    const palette = createMonochromeTheme(mode).palette;

    // Dark mode inverts the primary: a white surface with a dark label.
    expect(enabledStyle.backgroundColor).toBe(rgb(palette.primary.main));
    expect(enabledStyle.color).toBe(rgb(palette.primary.contrastText));
    expect(disabledStyle.backgroundColor).toBe(rgb(tokens.surfaceContainerHigh));
    expect(disabledStyle.color).toBe(rgb(tokens.textSecondary));
    expect(contrast(disabledStyle.backgroundColor, disabledStyle.color)).toBeGreaterThanOrEqual(4.5);

    unmount();
  });
});

describe('loading buttons', () => {
  it.each(['light', 'dark'] as const)('hide action content and preserve its accessible name in %s mode', (mode) => {
    render(
      <ThemeProvider theme={createKippaTheme(mode)}>
        <CssBaseline />
        <Button variant="contained" loading>
          Save <Typography component="span" color="text.secondary">changes</Typography>
        </Button>
        <IconButton loading aria-label="Refresh"><span>Refresh icon</span></IconButton>
      </ThemeProvider>,
    );

    const save = screen.getByRole('button', { name: 'Save changes' });
    const refresh = screen.getByRole('button', { name: 'Refresh' });
    expect(save).toBeDisabled();
    expect(refresh).toBeDisabled();
    expect(getComputedStyle(save).color).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(screen.getByText('changes')).opacity).toBe('0');
    expect(getComputedStyle(screen.getByText('Refresh icon')).opacity).toBe('0');
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });
});

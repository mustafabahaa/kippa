import { alpha, type PaletteOptions } from '@mui/material/styles';
import { designTokens } from '../foundations/tokens';
import { modeTokens } from '../foundations/mode';
import type { KippaThemeMode } from '../foundations/types';

declare module '@mui/material/styles' {
  interface Palette { chart: { colors: string[] }; creditCard: { main: string; light: string } }
  interface PaletteOptions { chart?: { colors?: string[] }; creditCard?: { main?: string; light?: string } }
}

export function createPalette(mode: KippaThemeMode): PaletteOptions {
  const c = designTokens.color;
  const t = modeTokens(mode);
  const isDark = mode === 'dark';
  return {
    mode,
    primary: { main: c.primaryContainer, dark: c.primary, light: c.primaryFixedDim, contrastText: c.onPrimary },
    secondary: { main: c.secondary, light: c.secondaryContainer, contrastText: c.onSecondary },
    success: { main: isDark ? '#72d9b3' : c.success },
    warning: { main: isDark ? '#ffbf5b' : c.warning },
    error: { main: isDark ? '#ff6b6b' : c.error, contrastText: c.onError },
    info: { main: isDark ? c.primaryFixedDim : c.primary, light: t.infoAccent },
    background: { default: t.surface, paper: t.surfacePure },
    text: { primary: t.textPrimary, secondary: t.textSecondary, disabled: t.disabled },
    divider: t.borderGray,
    action: { hover: alpha(c.primaryContainer, isDark ? 0.12 : 0.06), selected: alpha(c.primaryContainer, isDark ? 0.2 : 0.1) },
    chart: { colors: [c.primaryContainer, c.secondary, c.tertiary, c.primaryFixedDim, c.tertiaryContainer, c.secondaryContainer, c.warning, c.error] },
    creditCard: { main: c.creditCard, light: alpha(c.creditCard, 0.1) },
  };
}

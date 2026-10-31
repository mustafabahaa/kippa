import { alpha, type PaletteOptions } from '@mui/material/styles';
import { designTokens } from '../foundations/tokens';
import { modeTokens } from '../foundations/mode';
import type { KippaThemeMode } from '../foundations/types';

declare module '@mui/material/styles' {
  interface Palette {
    chart: { colors: string[] };
    creditCard: { main: string; light: string };
  }
  interface PaletteOptions {
    chart?: { colors?: string[] };
    creditCard?: { main?: string; light?: string };
  }
  interface TypeBackground {
    sidebar: string;
  }
}

export function createPalette(mode: KippaThemeMode): PaletteOptions {
  const c = designTokens.color;
  const t = modeTokens(mode);
  const isDark = mode === 'dark';
  return {
    mode,
    primary: {
      main: isDark ? '#FFFFFF' : c.primary,
      dark: isDark ? '#E5E5E5' : '#262626',
      light: isDark ? '#FFFFFF' : '#404040',
      contrastText: isDark ? '#0D0D0D' : '#FFFFFF',
    },
    secondary: {
      main: isDark ? '#D4D4D4' : c.secondary,
      light: c.secondaryContainer,
      contrastText: isDark ? '#0D0D0D' : '#FFFFFF',
    },
    success: { main: isDark ? '#8FC6A0' : c.success },
    warning: { main: isDark ? '#E6B36A' : c.warning },
    error: { main: isDark ? '#E58A8A' : c.error, contrastText: c.onError },
    info: { main: isDark ? '#FFFFFF' : c.primary, light: t.infoAccent },
    background: { default: t.surface, paper: t.surfacePure, sidebar: t.surfaceOffWhite },
    text: { primary: t.textPrimary, secondary: t.textSecondary, disabled: t.disabled },
    divider: t.borderGray,
    action: {
      hover: alpha(isDark ? '#FFFFFF' : '#0D0D0D', isDark ? 0.08 : 0.05),
      selected: alpha(isDark ? '#FFFFFF' : '#0D0D0D', isDark ? 0.14 : 0.08),
    },
    chart: {
      colors: [isDark ? '#FFFFFF' : '#0D0D0D', ...designTokens.dataColors],
    },
    creditCard: { main: c.creditCard, light: alpha(c.creditCard, 0.1) },
  };
}

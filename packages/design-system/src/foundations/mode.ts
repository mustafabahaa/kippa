import { designTokens } from './tokens';
import type { KippaThemeMode } from './types';

export function modeTokens(mode: KippaThemeMode) {
  const c = designTokens.color;
  if (mode === 'dark') return { ...designTokens.dark, surfaceContainerLowest: designTokens.dark.surfacePure };
  return {
    surface: c.surface, surfacePure: c.surfacePure, surfaceOffWhite: c.surfaceOffWhite,
    surfaceContainerLowest: c.surfaceContainerLowest, surfaceContainerLow: c.surfaceContainerLow,
    surfaceContainer: c.surfaceContainer, surfaceContainerHigh: c.surfaceContainerHigh,
    surfaceContainerHighest: c.surfaceContainerHighest, infoAccent: c.infoAccent,
    textPrimary: c.textPrimary, textSecondary: c.textSecondary, textTertiary: c.textTertiary,
    disabled: c.disabled, borderGray: c.borderGray, outline: c.outline,
    outlineVariant: c.outlineVariant, onSurface: c.onSurface, onSurfaceVariant: c.onSurfaceVariant,
  };
}

export type KippaModeTokens = ReturnType<typeof modeTokens>;

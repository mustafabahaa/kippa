import { createTheme, type Components, type Theme } from '@mui/material/styles';
import { designTokens } from '../foundations/tokens';
import { modeTokens } from '../foundations/mode';
import type { KippaThemeMode } from '../foundations/types';
import { typography } from './typography';
import { createPalette } from './palette';
import { baselineOverrides, buttonOverrides, cardOverrides, chipOverrides, feedbackOverrides, inputOverrides, navigationOverrides, overlayOverrides, tableOverrides } from './components';

export function createKippaTheme(mode: KippaThemeMode): Theme {
  const context = { mode, tokens: modeTokens(mode) };
  const components: Components<Theme> = Object.assign({}, baselineOverrides(context), buttonOverrides(context), cardOverrides(context), chipOverrides(context), feedbackOverrides(context), inputOverrides(context), navigationOverrides(context), overlayOverrides(context), tableOverrides(context));
  return createTheme({ palette: createPalette(mode), typography, shape: { borderRadius: designTokens.radius.moderate }, components });
}

export const appTheme = createKippaTheme('light');

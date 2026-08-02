import type { Components, Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const baselineOverrides = ({ mode }: OverrideContext): Components<Theme> => ({
  MuiTypography: { styleOverrides: { root: { color: 'inherit' } } },
  MuiCssBaseline: { styleOverrides: `html{color-scheme:${mode}} input,textarea,select{font-size:16px!important}.notistack-MuiContent-success,.SnackbarItem-variantSuccess{background-color:${designTokens.color.primaryContainer}!important}` },
  MuiDivider: { styleOverrides: { root: { borderColor: 'divider' } } },
});

import { alpha, type Components, type Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const buttonOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
    root: { minHeight: 48, fontWeight: 500, boxShadow: 'none', transition: 'transform .2s ease, background-color .2s ease', '&:active': { transform: 'scale(.98)' } },
    containedPrimary: { background: designTokens.color.primaryContainer, color: designTokens.color.onPrimary, borderRadius: 48, padding: '12px 24px', '&:hover': { background: designTokens.color.primary }, '&:active': { background: designTokens.color.primary } },
    outlined: { borderColor: t.borderGray, color: t.textPrimary, borderRadius: 8, backgroundColor: alpha(t.textPrimary, mode === 'dark' ? .04 : .03), padding: '12px 16px', '&:hover': { backgroundColor: t.surfaceOffWhite, borderColor: t.outline } },
  } },
  MuiIconButton: { styleOverrides: { root: { color: t.outline, borderRadius: 48, height: 48, width: 48, transition: 'background-color .2s ease, color .2s ease', '&:hover': { backgroundColor: t.surfaceOffWhite, color: t.textPrimary } } } },
});

import { alpha, type Components, type Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const navigationOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiAppBar: {
    defaultProps: { elevation: 0, color: 'transparent' },
    styleOverrides: {
      root: {
        backgroundColor: alpha(t.surface, 0.88),
        backgroundImage: 'none',
        boxShadow: 'none',
        color: t.textPrimary,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${t.borderGray}`,
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: { root: { backgroundColor: t.surfacePure, height: 64, borderTop: `1px solid ${t.borderGray}` } },
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        color: t.textPrimary,
        minWidth: 'auto',
        padding: '6px 0',
        '&.Mui-selected': { color: mode === 'dark' ? '#FFFFFF' : designTokens.color.primaryContainer },
      },
    },
  },
});

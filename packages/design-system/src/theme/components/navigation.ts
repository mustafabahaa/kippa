import { alpha, type Components, type Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

declare module '@mui/material/Avatar' {
  interface AvatarPropsVariantOverrides {
    profileMenu: true;
    appBar: true;
  }
}

export const navigationOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiAvatar: {
    variants: [
      {
        props: { variant: 'profileMenu' },
        style: {
          width: 44,
          height: 44,
          backgroundColor: mode === 'dark' ? '#FFFFFF' : '#0D0D0D',
          color: mode === 'dark' ? '#0D0D0D' : '#FFFFFF',
          fontSize: '1.1rem',
          fontWeight: 600,
        },
      },
      {
        props: { variant: 'appBar' },
        style: {
          width: 32,
          height: 32,
          backgroundColor: mode === 'dark' ? '#FFFFFF' : '#0D0D0D',
          color: mode === 'dark' ? '#0D0D0D' : '#FFFFFF',
          fontSize: '0.875rem',
          fontWeight: 600,
          filter: 'grayscale(1)',
        },
      },
    ],
  },
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

import type { Components, Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const navigationOverrides = ({ tokens: t }: OverrideContext): Components<Theme> => ({
  MuiAppBar: { defaultProps: { elevation: 0, color: 'transparent' }, styleOverrides: { root: { backgroundColor: 'transparent', backgroundImage: 'none', boxShadow: 'none', color: t.textPrimary } } },
  MuiBottomNavigation: { styleOverrides: { root: { backgroundColor: t.surfacePure, height: 64 } } },
  MuiBottomNavigationAction: { styleOverrides: { root: { color: t.textPrimary, minWidth: 'auto', padding: '6px 0', '&.Mui-selected': { color: designTokens.color.primaryContainer } } } },
});

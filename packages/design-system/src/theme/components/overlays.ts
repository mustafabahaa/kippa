import type { Components, Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const overlayOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiDialog: { styleOverrides: { paper: { backgroundColor: t.surfacePure, backgroundImage: 'none', borderRadius: 20, boxShadow: mode === 'dark' ? '0 12px 28px rgba(0,0,0,.28)' : '0 12px 28px rgba(24,53,34,.08)' } } },
  MuiMenu: { styleOverrides: { paper: { backgroundColor: t.surfacePure, backgroundImage: 'none', borderRadius: 8, border: `1px solid ${t.borderGray}`, boxShadow: designTokens.shadow.lifted } } },
  MuiMenuItem: { styleOverrides: { root: { color: t.textPrimary, opacity: 1, '& .MuiListItemIcon-root': { color: t.textPrimary } } } },
  MuiTooltip: { styleOverrides: { tooltip: { fontFamily: designTokens.typography.fontFamily, fontSize: 12.5, fontWeight: 500, backgroundColor: 'rgba(33,33,33,.95)', color: '#fff', padding: '8px 12px', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.25)' }, arrow: { color: 'rgba(33,33,33,.95)' } } },
});

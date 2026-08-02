import type { Components, Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const cardOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => {
  const highlight = mode === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,.045)' : 'inset 0 1px 0 rgba(255,255,255,.9)';
  const shadow = mode === 'dark' ? '0 12px 28px rgba(0,0,0,.16)' : '0 10px 26px rgba(24,53,34,.035)';
  return {
    MuiPaper: { styleOverrides: { root: { backgroundColor: mode === 'dark' ? 'rgba(14,17,16,.96)' : 'rgba(255,255,255,.92)', backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { background: t.surfacePure, border: `1px solid ${t.borderGray}`, borderRadius: 20, boxShadow: `${highlight},${shadow}`, transition: 'box-shadow .2s ease,border-color .2s ease' } } },
    MuiCardContent: { styleOverrides: { root: { padding: designTokens.spacing.cardPadding, '&:last-child': { paddingBottom: designTokens.spacing.cardPadding } } } },
  };
};

import type { Components, Theme } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

declare module '@mui/material/MenuItem' {
  interface MenuItemOwnProps {
    kippaTone?: 'destructive';
  }
}

export const overlayOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiDialog: {
    styleOverrides: {
      paper: {
        backgroundColor: t.surfacePure,
        backgroundImage: 'none',
        borderRadius: designTokens.radius.card,
        border: `1px solid ${t.borderGray}`,
        boxShadow: mode === 'dark' ? '0 12px 28px rgba(0,0,0,.28)' : '0 12px 28px rgba(0,0,0,.08)',
        '&.MuiPaper-cardDetailDialog': {
          borderRadius: designTokens.radius.dialog,
          border: 0,
          overflow: 'hidden',
        },
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        gap: 8,
        padding: '12px 24px 20px',
        '& .MuiButton-root': {
          minHeight: 40,
          padding: '8px 16px',
        },
      },
    },
  },
  MuiPickerPopper: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
        border: `1px solid ${t.borderGray}`,
        borderRadius: designTokens.radius.card,
        boxShadow: 'none',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      list: { padding: '8px' },
      paper: {
        backgroundColor: t.surfacePure,
        backgroundImage: 'none',
        borderRadius: designTokens.radius.control,
        border: `1px solid ${t.borderGray}`,
        boxShadow: 'none',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: 44,
        margin: '2px 0',
        padding: '8px 12px',
        borderRadius: designTokens.radius.subtle * 2,
        color: t.textPrimary,
        opacity: 1,
        '& .MuiListItemIcon-root': { minWidth: 36, color: t.textSecondary },
        '& .MuiListItemText-primary': { color: t.textPrimary, fontSize: 14, fontWeight: 500 },
        '& .MuiListItemText-secondary': { fontSize: 12 },
        '&.Mui-selected': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.08)' : 'rgba(13,13,13,.06)' },
        '&.Mui-selected .MuiListItemIcon-root': { color: t.textPrimary },
        '&.Mui-selected:hover': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.12)' : 'rgba(13,13,13,.09)' },
      },
    },
    variants: [
      {
        props: { kippaTone: 'destructive' },
        style: {
          color: designTokens.color.error,
          '& .MuiListItemIcon-root, & .MuiListItemText-primary': { color: designTokens.color.error },
          '& .MuiListItemText-primary': { fontWeight: 600 },
        },
      },
    ],
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontFamily: designTokens.typography.fontFamily,
        fontSize: 12.5,
        fontWeight: 500,
        backgroundColor: 'rgba(33,33,33,.95)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,.25)',
      },
      arrow: { color: 'rgba(33,33,33,.95)' },
    },
  },
});

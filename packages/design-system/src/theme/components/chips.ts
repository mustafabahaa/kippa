import { alpha, type Components, type Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const chipOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiChip: {
    styleOverrides: {
      root: {
        height: 28,
        borderRadius: 8,
        fontWeight: 650,
        fontSize: 11,
        fontFamily: designTokens.typography.fontFamily,
        backgroundColor: alpha(mode === 'dark' ? '#FFFFFF' : designTokens.color.primaryContainer, mode === 'dark' ? 0.14 : 0.06),
        color: t.textSecondary,
      },
      label: { paddingLeft: 9, paddingRight: 9 },
      outlined: { borderColor: t.borderGray, backgroundColor: 'transparent' },
    },
    variants: [
      {
        props: { variant: 'filter' },
        style: {
          height: 36,
          borderRadius: 12,
          border: `1px solid ${t.borderGray}`,
          backgroundColor: t.surfacePure,
          color: t.textSecondary,
          fontSize: 13,
          fontWeight: 400,
          '&:hover': { backgroundColor: t.surfaceOffWhite },
        },
      },
      {
        props: { variant: 'filterSelected' },
        style: {
          height: 36,
          borderRadius: 12,
          border: '1px solid transparent',
          backgroundColor: mode === 'dark' ? '#FFFFFF' : '#0D0D0D',
          color: mode === 'dark' ? '#0D0D0D' : '#FFFFFF',
          fontSize: 13,
          fontWeight: 700,
          '&:hover': { backgroundColor: mode === 'dark' ? '#E5E5E5' : '#262626' },
        },
      },
      {
        props: { variant: 'filterAction' },
        style: {
          height: 36,
          borderRadius: 12,
          border: `1px solid ${t.borderGray}`,
          backgroundColor: t.surfaceOffWhite,
          color: mode === 'dark' ? '#FFFFFF' : designTokens.color.primaryContainer,
          fontSize: 13,
        },
      },
    ],
  },
});

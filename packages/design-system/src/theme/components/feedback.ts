import type { Components, Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

declare module '@mui/material/LinearProgress' {
  interface LinearProgressPropsColorOverrides {
    loan: true;
  }
}

export const feedbackOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.12)' : 'rgba(13,13,13,.08)',
      },
      bar: { borderRadius: 3, backgroundColor: mode === 'dark' ? '#FFFFFF' : '#0D0D0D' },
    },
    variants: [
      {
        props: { color: 'loan' },
        style: {
          height: 42,
          borderRadius: designTokens.radius.control,
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.08)' : 'rgba(13,13,13,.05)',
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 10px, ${mode === 'dark' ? 'rgba(255,255,255,.1)' : 'rgba(13,13,13,.08)'} 10px 14px)`,
          '& .MuiLinearProgress-bar': { borderRadius: designTokens.radius.control },
        },
      },
    ],
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: designTokens.radius.control },
      standardInfo: {
        backgroundColor: t.surfaceContainerHigh,
        border: `1px solid ${t.borderGray}`,
        color: t.textSecondary,
        '& .MuiAlert-icon': { color: mode === 'dark' ? '#FFFFFF' : designTokens.color.primaryContainer },
      },
    },
  },
});

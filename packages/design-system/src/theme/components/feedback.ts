import type { Components, Theme } from '@mui/material/styles';
import type { OverrideContext } from './types';

export const feedbackOverrides = ({ tokens: t }: OverrideContext): Components<Theme> => ({
  MuiLinearProgress: { styleOverrides: { root: { height: 10, borderRadius: 5, backgroundColor: t.surfaceOffWhite } } },
  MuiAlert: { styleOverrides: { root: { borderRadius: 8 }, standardInfo: { backgroundColor: t.infoAccent } } },
});

import type { ThemeOptions } from '@mui/material/styles';
import { designTokens } from '../foundations/tokens';

export const typography: ThemeOptions['typography'] = {
  fontFamily: designTokens.typography.fontFamily,
  h1: { fontSize: '54px', lineHeight: '64px', fontWeight: 700, letterSpacing: 0 },
  h2: { fontSize: '40px', lineHeight: '50px', fontWeight: 500, letterSpacing: 0 },
  h3: { fontSize: '20px', lineHeight: '28px', fontWeight: 500, letterSpacing: 0 },
  body1: { fontSize: '14px', lineHeight: '22px', fontWeight: 400, letterSpacing: 0 },
  body2: { fontSize: '12px', lineHeight: '19px', fontWeight: 500, letterSpacing: 0 },
  button: { fontSize: '14px', lineHeight: '22px', fontWeight: 500, letterSpacing: 0, textTransform: 'none' },
};

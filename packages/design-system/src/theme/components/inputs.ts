import type { Components, Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const inputOverrides = ({ tokens: t }: OverrideContext): Components<Theme> => ({
  MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: t.surfacePure, fontSize: 16, transition: 'background-color .2s ease', '& .MuiOutlinedInput-notchedOutline': { borderColor: t.borderGray }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.outline }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: designTokens.color.primaryContainer, borderWidth: 2 } } } },
});

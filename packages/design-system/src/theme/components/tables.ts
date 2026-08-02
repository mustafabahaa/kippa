import type { Components, Theme } from '@mui/material/styles';
import type { OverrideContext } from './types';

export const tableOverrides = ({ tokens: t }: OverrideContext): Components<Theme> => ({
  MuiTableCell: { styleOverrides: { root: { padding: '14px 16px', borderBottom: `1px solid ${t.borderGray}`, backgroundColor: 'transparent' }, sizeSmall: { padding: '10px 16px' }, head: { fontWeight: 700, color: t.textPrimary, backgroundColor: 'transparent', padding: '20px 16px' } } },
  MuiTable: { styleOverrides: { root: { tableLayout: 'auto', width: '100%' } } },
});

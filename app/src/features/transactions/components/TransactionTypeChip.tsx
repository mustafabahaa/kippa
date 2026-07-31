import React from 'react';
import { alpha, Chip } from '@mui/material';
import { TransactionType } from '@/domain/financeTypes';

interface TransactionTypeChipProps {
  type: TransactionType;
  size?: 'small' | 'medium';
}

export const TransactionTypeChip: React.FC<TransactionTypeChipProps> = ({ type, size = 'small' }) => {
  const getChipDetails = () => {
    switch (type) {
      case 'income':
        return { label: 'Income', tone: 'success' as const };
      case 'transfer':
        return { label: 'Transfer', tone: 'primary' as const };
      case 'adjustment':
        return { label: 'Reconciliation', tone: 'info' as const };
      case 'expense':
      default:
        return { label: 'Expense', tone: null };
    }
  };

  const { label, tone } = getChipDetails();

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        height: 24,
        borderRadius: '999px',
        border: 0,
        bgcolor: (theme) => tone ? alpha(theme.palette[tone].main, theme.palette.mode === 'dark' ? 0.18 : 0.1) : theme.palette.action.hover,
        color: tone ? `${tone}.main` : 'text.secondary',
        fontWeight: 700,
        fontSize: 10.5,
        '& .MuiChip-label': { px: 1.1 },
      }}
    />
  );
};

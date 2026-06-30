import React from 'react';
import { Chip } from '@mui/material';
import { TransactionType } from '@/domain/financeTypes';

interface TransactionTypeChipProps {
  type: TransactionType;
  size?: 'small' | 'medium';
}

export const TransactionTypeChip: React.FC<TransactionTypeChipProps> = ({ type, size = 'small' }) => {
  const getChipDetails = () => {
    switch (type) {
      case 'income':
        return { label: 'Income', color: 'success' as const };
      case 'transfer':
        return { label: 'Transfer', color: 'primary' as const };
      case 'conversion':
        return { label: 'Exchange', color: 'warning' as const };
      case 'adjustment':
        return { label: 'Reconciliation', color: 'info' as const };
      case 'expense':
      default:
        return { label: 'Expense', color: 'default' as const };
    }
  };

  const { label, color } = getChipDetails();

  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant="outlined"
      sx={{
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '11px',
      }}
    />
  );
};

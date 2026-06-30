import React from 'react';
import { Box } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WorkIcon from '@mui/icons-material/Work';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import TuneIcon from '@mui/icons-material/Tune';
import { TransactionType } from '@/domain/financeTypes';

interface TransactionIconProps {
  type: TransactionType;
  size?: number;
}

export const TransactionIcon: React.FC<TransactionIconProps> = ({ type, size = 40 }) => {
  const getIconDetails = () => {
    switch (type) {
      case 'income':
        return {
          icon: <WorkIcon sx={{ fontSize: size * 0.45, color: '#1E8E3E' }} />,
          bg: 'rgba(30, 142, 62, 0.1)',
        };
      case 'transfer':
        return {
          icon: <SwapHorizIcon sx={{ fontSize: size * 0.45, color: '#1976D2' }} />,
          bg: 'rgba(25, 118, 210, 0.1)',
        };
      case 'conversion':
        return {
          icon: <CurrencyExchangeIcon sx={{ fontSize: size * 0.45, color: '#F29900' }} />,
          bg: 'rgba(242, 153, 0, 0.1)',
        };
      case 'adjustment':
        return {
          icon: <TuneIcon sx={{ fontSize: size * 0.45, color: '#008080' }} />,
          bg: 'rgba(0, 128, 128, 0.1)',
        };
      case 'expense':
      default:
        return {
          icon: <ReceiptLongIcon sx={{ fontSize: size * 0.45, color: '#D93025' }} />,
          bg: 'rgba(217, 48, 37, 0.1)',
        };
    }
  };

  const { icon, bg } = getIconDetails();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  );
};

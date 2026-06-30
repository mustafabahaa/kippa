import { Box, alpha } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WorkIcon from '@mui/icons-material/Work';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import TuneIcon from '@mui/icons-material/Tune';
import { TransactionType } from '@/domain/financeTypes';

interface TransactionIconProps {
  type: TransactionType;
  size?: number;
  /** When true, expense transactions show a credit card icon instead of a receipt. */
  isCreditCard?: boolean;
}

export const TransactionIcon: React.FC<TransactionIconProps> = ({ type, size = 40, isCreditCard }) => {
  const getIconDetails = () => {
    switch (type) {
      case 'income':
        return {
          icon: <WorkIcon sx={{ fontSize: size * 0.45, color: 'success.main' }} />,
          bg: (theme: any) => alpha(theme.palette.success.main, 0.1),
        };
      case 'transfer':
        return {
          icon: <SwapHorizIcon sx={{ fontSize: size * 0.45, color: 'info.main' }} />,
          bg: (theme: any) => alpha(theme.palette.info.main, 0.1),
        };
      case 'conversion':
        return {
          icon: <CurrencyExchangeIcon sx={{ fontSize: size * 0.45, color: 'warning.main' }} />,
          bg: (theme: any) => alpha(theme.palette.warning.main, 0.1),
        };
      case 'adjustment':
        return {
          icon: <TuneIcon sx={{ fontSize: size * 0.45, color: 'secondary.main' }} />,
          bg: (theme: any) => alpha(theme.palette.secondary.main, 0.1),
        };
      case 'expense':
      default:
        if (isCreditCard) {
          return {
            icon: <CreditCardIcon sx={{ fontSize: size * 0.45, color: 'creditCard.main' }} />,
            bg: (theme: any) => theme.palette.creditCard.light,
          };
        }
        return {
          icon: <ReceiptLongIcon sx={{ fontSize: size * 0.45, color: 'error.main' }} />,
          bg: (theme: any) => alpha(theme.palette.error.main, 0.1),
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

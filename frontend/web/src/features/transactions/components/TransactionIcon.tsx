import { Box } from '@monochrome-ui/design-system';
import { TransactionType } from '@kippa/domain';
import { CreditCardIcon, ReceiptLongIcon, SwapHorizIcon, TuneIcon, WorkIcon } from '@/components/AppIcon';

interface TransactionIconProps {
  type: TransactionType;
  size?: number;
  className?: string;
  /** When true, expense transactions show a credit card icon instead of a receipt. */
  isCreditCard?: boolean;
}

export const TransactionIcon: React.FC<TransactionIconProps> = ({ type, size = 40, isCreditCard, className }) => {
  const getIconDetails = () => {
    switch (type) {
      case 'income':
        return {
          icon: <WorkIcon fontSize="small" />,
        };
      case 'transfer':
        return {
          icon: <SwapHorizIcon fontSize="small" />,
        };
      case 'adjustment':
        return {
          icon: <TuneIcon fontSize="small" />,
        };
      case 'expense':
      default:
        if (isCreditCard) {
          return {
            icon: <CreditCardIcon fontSize="small" />,
          };
        }
        return {
          icon: <ReceiptLongIcon fontSize="small" />,
        };
    }
  };

  const { icon } = getIconDetails();

  return (
    <Box
      className={['ds-transaction-icon', className].filter(Boolean).join(' ')}
      sx={{
        width: size,
        height: size,
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

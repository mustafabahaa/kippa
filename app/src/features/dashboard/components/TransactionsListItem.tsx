import React from 'react';
import { Box, Typography, Stack, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FinanceTransaction, Category, LedgerLine, Account } from '@/domain/financeTypes';
import { TransactionIcon } from '@/features/transactions/components/TransactionIcon';
import { useHouseholdBaseCurrency } from '@/hooks/useFinance';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';

interface TransactionsListItemProps {
  tx: FinanceTransaction;
  categories: Category[];
  ledgerLines: LedgerLine[];
  accounts?: Account[];
  onEdit: (tx: FinanceTransaction) => void;
  onVoid: (txId: string) => void;
}

export const TransactionsListItem: React.FC<TransactionsListItemProps> = ({
  tx,
  categories,
  ledgerLines,
  accounts = [],
  onEdit,
  onVoid,
}) => {
  const baseCurrency = useHouseholdBaseCurrency();
  const cat = categories.find((c) => c.id === tx.categoryId);

  // Find amount and accounts from ledgerLines
  const txLines = ledgerLines.filter((l) => l.transactionId === tx.id);
  const firstLine = txLines.find((l) => l.signedAmount !== 0) || txLines[0];
  const amount = firstLine ? Number(Math.abs(firstLine.signedAmount).toFixed(2)) : 0;
  const currency = firstLine ? firstLine.currency : baseCurrency;
  const { maskDigits } = usePrivacyMask();
  const isIncome = tx.type === 'income' || (tx.type === 'adjustment' && (firstLine?.signedAmount || 0) >= 0);
  const txAccount = firstLine ? accounts.find((a) => a.id === firstLine.accountId) : null;
  const isCreditCard = tx.type === 'expense' && txAccount?.type === 'credit';

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Helper to render type-specific description layout
  const renderItemDetails = () => {
    switch (tx.type) {
      case 'transfer': {
        const destLine = txLines.find((l) => l.id !== firstLine?.id);
        const fromAcc = firstLine ? firstLine.accountId.replace('-egp', '').toUpperCase() : '';
        const toAcc = destLine ? destLine.accountId.replace('-egp', '').toUpperCase() : '';
        return (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', color: 'text.primary' }}>
              Transfer
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, fontWeight: 'medium' }}>
              {fromAcc} ➔ {toAcc}
            </Typography>
            {tx.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, wordBreak: 'break-word' }}>
                {tx.description}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '10px', mt: 0.25, opacity: 0.8 }}>
              {tx.date} • {formatTime(tx.createdAt)}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '13.5px', whiteSpace: 'nowrap', mt: 0.5 }}>
              -{maskDigits(`${amount.toLocaleString()} ${currency}`)}
            </Typography>
          </Box>
        );
      }

      case 'conversion': {
        const destLine = txLines.find((l) => l.id !== firstLine?.id);
        const fromAmt = amount;
        const toAmt = destLine ? Number(Math.abs(destLine.signedAmount).toFixed(2)) : 0;
        const fromCurr = currency;
        const toCurr = destLine ? destLine.currency : 'USD';
        return (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', color: 'text.primary' }}>
              Currency Exchange
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, fontWeight: 'medium' }}>
              {maskDigits(`${fromAmt} ${fromCurr}`)} ➔ {maskDigits(`${toAmt} ${toCurr}`)}
            </Typography>
            {tx.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, wordBreak: 'break-word' }}>
                {tx.description}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '10px', mt: 0.25, opacity: 0.8 }}>
              {tx.date} • {formatTime(tx.createdAt)}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '13.5px', whiteSpace: 'nowrap', mt: 0.5 }}>
              Exchange Completed
            </Typography>
          </Box>
        );
      }

      case 'adjustment': {
        return (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', color: 'text.primary' }}>
              Reconciliation
            </Typography>
            {tx.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, wordBreak: 'break-word' }}>
                {tx.description}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '10px', mt: 0.25, opacity: 0.8 }}>
              {tx.date} • {formatTime(tx.createdAt)}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: isIncome ? 'success.main' : 'error.main', fontSize: '13.5px', whiteSpace: 'nowrap', mt: 0.5 }}>
              {isIncome ? '+' : '-'}{maskDigits(`${amount.toLocaleString()} ${currency}`)}
            </Typography>
          </Box>
        );
      }

      case 'income': {
        return (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', color: 'text.primary' }}>
              {cat?.name || 'Income'}
            </Typography>
            {tx.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, wordBreak: 'break-word' }}>
                {tx.description}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '10px', mt: 0.25, opacity: 0.8 }}>
              {tx.date} • {formatTime(tx.createdAt)}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '13.5px', whiteSpace: 'nowrap', mt: 0.5 }}>
              +{maskDigits(`${amount.toLocaleString()} ${currency}`)}
            </Typography>
          </Box>
        );
      }

      case 'expense':
      default: {
        return (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', color: 'text.primary' }}>
              {cat?.name || 'Expense'}
            </Typography>
            {tx.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, wordBreak: 'break-word' }}>
                {tx.description}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '10px', mt: 0.25, opacity: 0.8 }}>
              {tx.date} • {formatTime(tx.createdAt)}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '13.5px', whiteSpace: 'nowrap', mt: 0.5 }}>
              -{maskDigits(`${amount.toLocaleString()} ${currency}`)}
            </Typography>
          </Box>
        );
      }
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1.5,
        '&:hover': { bgcolor: 'action.hover' },
        opacity: tx.status === 'voided' ? 0.5 : 1,
      }}
    >
      <Box display="flex" alignItems="flex-start" gap={2} sx={{ minWidth: 0, flex: 1 }}>
        <TransactionIcon type={tx.type} size={40} isCreditCard={isCreditCard} />
        {renderItemDetails()}
      </Box>

      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, alignSelf: 'center' }}>
        <IconButton
          size="small"
          onClick={() => onEdit(tx)}
          disabled={tx.status === 'voided'}
          sx={{ p: 0.5, width: 28, height: 28 }}
        >
          <EditIcon sx={{ fontSize: '16px' }} />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => onVoid(tx.id)}
          disabled={tx.status === 'voided'}
          sx={{ p: 0.5, width: 28, height: 28 }}
        >
          <DeleteIcon sx={{ fontSize: '16px' }} />
        </IconButton>
      </Stack>
    </Box>
  );
};

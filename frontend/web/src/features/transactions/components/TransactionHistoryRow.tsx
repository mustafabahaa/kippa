import { IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { Account, Category, CurrencyCode, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { DeleteIcon, EditIcon } from '@/components/AppIcon';
import { getTransactionPresentation } from '@/libs/transactionPresentation';
import { TransactionIcon } from './TransactionIcon';
import { TransactionTypeChip } from './TransactionTypeChip';
import { formatShortTime } from '@/libs/dateFormatting';

interface Props { accounts: Account[]; baseCurrency: CurrencyCode; categories: Category[]; ledgerLines: LedgerLine[]; maskDigits: (value: string) => string; transaction: FinanceTransaction; onEdit: (transaction: FinanceTransaction) => void; onVoid: (id: string) => void; }

export function TransactionHistoryRow({ accounts, baseCurrency, categories, ledgerLines, maskDigits, transaction, onEdit, onVoid }: Props) {
  const category = categories.find((item) => item.id === transaction.categoryId);
  const presentation = getTransactionPresentation(transaction, ledgerLines, accounts, baseCurrency);
  const title = transaction.type === 'transfer' ? transaction.description || 'Transfer' : transaction.type === 'adjustment' ? 'Reconciliation' : category?.name || 'General';
  const disabled = transaction.status === 'voided';

  return (
    <TableRow hover sx={{ opacity: disabled ? 0.5 : 1, '& .transaction-actions': { opacity: { xs: 1, md: 0 } }, '&:hover .transaction-actions, &:focus-within .transaction-actions': { opacity: 1 } }}>
      <TableCell align="center" sx={{ py: 1.25 }}><TransactionIcon type={transaction.type} size={36} isCreditCard={presentation.isCreditCard} /></TableCell>
      <TableCell sx={{ py: 1.25, minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}><Typography noWrap variant="body1" sx={{ minWidth: 0 }}>{title}</Typography><TransactionTypeChip type={transaction.type} /></Stack>
        <Typography noWrap variant="body2" color="text.secondary">{transaction.date} • {formatShortTime(transaction.createdAt)}{disabled ? ' • (VOIDED)' : ''}</Typography>
      </TableCell>
      <TableCell sx={{ py: 1.25, display: { xs: 'none', md: 'table-cell' } }}><Typography noWrap variant="body2" color="text.secondary">{presentation.details}</Typography></TableCell>
      <TableCell align="right" sx={{ py: 1.25 }}><Typography variant="body1" color={disabled ? 'text.secondary' : presentation.isIncome ? 'success.main' : 'text.primary'}>{presentation.isCrossCurrencyTransfer ? 'Transfer Completed' : `${presentation.isIncome ? '+' : '-'}${maskDigits(`${presentation.amount.toLocaleString()} ${presentation.currency}`)}`}</Typography></TableCell>
      <TableCell align="center" sx={{ py: 1.25 }}>
        <Stack className="transaction-actions" direction="row" justifyContent="center">
          <Tooltip title="Edit transaction"><span><IconButton onClick={() => onEdit(transaction)} disabled={disabled} aria-label="Edit transaction"><EditIcon fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title="Void transaction"><span><IconButton color="error" onClick={() => onVoid(transaction.id)} disabled={disabled} aria-label="Void transaction"><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

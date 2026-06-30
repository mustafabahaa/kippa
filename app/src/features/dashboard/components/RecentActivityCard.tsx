import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { 
  useCategories, 
  useTransactions, 
  useLedgerLines,
  useVoidTransactionMutation,
} from '@/hooks/useFinance';
import { FinanceTransaction } from '@/domain/financeTypes';
import { useAppContext } from '@/hooks/useAppContext';
import { RecentActivityItem } from './RecentActivityItem';
import { EditTransactionDialog } from '@/features/transactions/components/EditTransactionDialog';

export function RecentActivityCard() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { householdId } = useAppContext();
  const { data: categories = [] } = useCategories(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  
  const voidMutation = useVoidTransactionMutation();
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);

  const handleVoidTransaction = async (txId: string) => {
    if (window.confirm('Are you sure you want to void this transaction? This updates derived balances immediately.')) {
      try {
        await voidMutation.mutateAsync({ householdId, transactionId: txId });
        enqueueSnackbar('Transaction voided successfully.', { variant: 'success' });
      } catch (err: any) {
        enqueueSnackbar(err.message || 'Failed to void transaction', { variant: 'error' });
      }
    }
  };

  const isLoading = txsLoading || linesLoading;

  if (isLoading || !transactions || !ledgerLines) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: '20px' }} animation="wave" />
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
          Recent Activity
        </Typography>
        <Typography 
          variant="body2" 
          onClick={() => navigate('/transactions')}
          sx={{ color: 'primary.main', fontWeight: 'bold', cursor: 'pointer' }}
        >
          View All
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        {transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No recent activity recorded.
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {transactions.slice(0, 5).map(tx => (
              <RecentActivityItem
                key={tx.id}
                tx={tx}
                categories={categories}
                ledgerLines={ledgerLines}
                onEdit={setEditingTx}
                onVoid={handleVoidTransaction}
              />
            ))}
          </Stack>
        )}
      </Card>

      {/* Reusable Edit Dialog */}
      <EditTransactionDialog
        open={Boolean(editingTx)}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
      />
    </Stack>
  );
}

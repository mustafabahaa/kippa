import { ReceiptLongIcon } from '@/components/AppIcon';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Box, Card, CardContent, Chip, Skeleton, Stack, Typography } from '@monochrome-ui/design-system';
import {
  useCategories,
  useTransactions,
  useLedgerLines,
  useAccounts,
  useVoidTransactionMutation,
} from '@/hooks/useFinance';
import { FinanceTransaction } from '@kippa/domain';
import { useAppContext } from '@/hooks/useAppContext';
import { TransactionsListItem, EditTransactionDialog, VoidTransactionDialog } from '@/features/transactions';
import { DashboardSectionHeading } from './DashboardSectionHeading';

const RECENT_TRANSACTION_LIMIT = 12;

export function TransactionsSection() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { householdId } = useAppContext();
  const { data: categories = [] } = useCategories(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: accounts = [] } = useAccounts(householdId);

  const voidMutation = useVoidTransactionMutation();
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [voidingTxId, setVoidingTxId] = useState<string | null>(null);

  const handleVoidTransaction = async () => {
    if (!voidingTxId) return;
    try {
      await voidMutation.mutateAsync({ householdId, transactionId: voidingTxId });
      enqueueSnackbar('Transaction voided successfully.', { variant: 'success' });
      setVoidingTxId(null);
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to void transaction', { variant: 'error' });
    }
  };

  const isLoading = txsLoading || linesLoading;

  if (isLoading || !transactions || !ledgerLines) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" width="100%" height={150} animation="wave" />
      </Box>
    );
  }

  return (
    <>
      <Card
        variant="sectionSurface"
        sx={{
          position: { xs: 'static', md: 'sticky' },
          top: { md: 88 },
          height: { md: 'calc(100vh - 104px)' },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
          minHeight: 0,
        }}
      >
        <CardContent
          sx={{
            display: { md: 'flex' },
            flexDirection: { md: 'column' },
            flex: { md: 1 },
            minHeight: { md: 0 },
            overflow: { md: 'hidden' },
          }}
        >
          <Stack spacing={2.5} sx={{ flex: { md: 1 }, minHeight: { md: 0 } }}>
            <DashboardSectionHeading
              icon={<ReceiptLongIcon size={22} strokeWidth={1.8} />}
              title="Recent Transactions"
              subtitle="Latest household activity"
              trailing={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={`${Math.min(transactions.length, RECENT_TRANSACTION_LIMIT)} recent`} />
                  <Chip size="small" label="View all" clickable onClick={() => navigate('/transactions')} />
                </Stack>
              }
            />

            {transactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No recent activity recorded.
              </Typography>
            ) : (
              <Box sx={{ flex: { md: 1 }, minHeight: { md: 0 }, overflowY: { md: 'auto' } }}>
                <Stack className="ds-stepper">
                  {transactions.slice(0, RECENT_TRANSACTION_LIMIT).map((tx) => (
                    <TransactionsListItem
                      key={tx.id}
                      tx={tx}
                      categories={categories}
                      ledgerLines={ledgerLines}
                      accounts={accounts}
                      onEdit={setEditingTx}
                      onVoid={setVoidingTxId}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Reusable Edit Dialog */}
      {editingTx && <EditTransactionDialog open transaction={editingTx} onClose={() => setEditingTx(null)} />}
      <VoidTransactionDialog
        open={Boolean(voidingTxId)}
        loading={voidMutation.isPending}
        onClose={() => setVoidingTxId(null)}
        onConfirm={handleVoidTransaction}
      />
    </>
  );
}

import { useMemo, useState } from 'react';
import { Box, Button, Chip, Divider, Grid, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import type { Loan } from '@kippa/domain';
import { Money } from '@/components/Money';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { DashboardSectionHeading } from '@/features/dashboard/components/DashboardSectionHeading';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useAccounts,
  useActiveCycle,
  useCreateLoanMutation,
  useLedgerLines,
  useLoans,
  useRecordLoanPaymentMutation,
  useTransactions,
  useUpdateLoanMutation,
} from '@/hooks/useFinance';
import { calculateAccountBalance } from '@/libs/financeCalculations';
import { getLoanProgress } from '@/libs/loanCalculations';
import type { LoanInput } from '@/libs/loans';
import { LoanDialog } from './LoanDialog';
import { LoanPaymentDialog } from './LoanPaymentDialog';

const sectionIndent = { xs: 0, md: 4 } as const;
const contentIndent = { xs: 0, md: 4 } as const;

export function Loans() {
  const { householdId, userProfile } = useAppContext();
  const [editing, setEditing] = useState<Loan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [paying, setPaying] = useState<Loan | null>(null);
  const { data: loans = [], isLoading: loansLoading } = useLoans(householdId);
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions = [], isLoading: txLoading } = useTransactions(householdId);
  const { data: lines = [], isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: activeCycle } = useActiveCycle(householdId);
  const createLoan = useCreateLoanMutation();
  const updateLoan = useUpdateLoanMutation();
  const recordPayment = useRecordLoanPaymentMutation();
  const loading = loansLoading || accountsLoading || txLoading || linesLoading;
  const loanItems = useMemo(
    () =>
      loans.map((loan) => ({
        loan,
        progress: getLoanProgress(loan, transactions, lines),
        account: accounts.find((a) => a.id === loan.paymentAccountId),
      })),
    [loans, transactions, lines, accounts],
  );
  const save = async (input: LoanInput) => {
    if (editing) await updateLoan.mutateAsync({ householdId, loanId: editing.id, loan: input });
    else await createLoan.mutateAsync({ householdId, loan: input });
    setFormOpen(false);
    setEditing(null);
  };
  const pay = async (amount: number, date: string) => {
    if (!paying || !userProfile) return;
    await recordPayment.mutateAsync({
      householdId,
      loanId: paying.id,
      amount,
      date,
      budgetCycleId: activeCycle?.id ?? null,
      userId: userProfile.uid,
    });
    setPaying(null);
  };

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <PageHeader
        title="Loans"
        subtitle="Track repayments and keep each payment account ready."
        action={
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add loan
          </Button>
        }
      />

      <Box component="section" sx={{ px: sectionIndent }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <DashboardSectionHeading
            title="Repayment overview"
            subtitle="Progress, upcoming payments, and payoff timing for your household loans."
          />

          <Box sx={{ px: contentIndent }}>
            <Box sx={{ maxWidth: 1100 }}>
              {loading ? (
                <Stack spacing={3} divider={<Divider />}>
                  {[1, 2].map((item) => (
                    <Stack key={item} spacing={2.5} sx={{ py: 1 }}>
                      <Skeleton variant="text" width="35%" height={32} />
                      <Skeleton variant="rounded" height={40} />
                      <Skeleton variant="text" width="65%" height={54} />
                    </Stack>
                  ))}
                </Stack>
              ) : loanItems.length === 0 ? (
                <Stack spacing={1} alignItems="flex-start" sx={{ py: 1 }}>
                  <Typography variant="h5">No loans yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add a fixed loan and Kippa will prepare its monthly installments automatically.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={{ xs: 3, md: 4 }} divider={<Divider />}>
                  {loanItems.map(({ loan, progress, account }) => {
                    const balance = account ? calculateAccountBalance(account.id, transactions, lines) : 0;
                    const shortfall = Math.max(0, loan.installmentAmount - balance);
                    const isPaid = loan.status === 'paid' || progress.remainingAmount <= 0;
                    const shortDate = (date: string | null) =>
                      date
                        ? new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Complete';

                    return (
                      <Box key={loan.id} component="article">
                        <Stack spacing={{ xs: 2, md: 2.5 }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1.5}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="loanTitle">{loan.name}</Typography>
                              <Typography variant="loanMeta" color="text.secondary">
                                {progress.paidInstallments} of {loan.totalInstallments} payments
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={isPaid ? 'Paid off' : shortfall > 0 ? 'Needs funding' : 'Ready'}
                                color={isPaid || shortfall === 0 ? 'success' : 'warning'}
                              />
                              <Button
                                variant="segmented"
                                onClick={() => {
                                  setEditing(loan);
                                  setFormOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                            </Stack>
                          </Stack>

                          <Stack spacing={0.75}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                              <Typography variant="fieldHint" color="text.secondary">
                                Loan progress
                              </Typography>
                              <Typography variant="fieldHint" color="text.secondary">
                                {progress.progressPercent.toFixed(0)}%
                              </Typography>
                            </Stack>
                            <LinearProgress color="loan" variant="determinate" value={progress.progressPercent} />
                            <Stack direction="row" justifyContent="space-between" spacing={2}>
                              <Typography variant="loanMeta" color="text.secondary">
                                <Money amount={progress.paidAmount} code={loan.currency} maxDigits={2} /> paid
                              </Typography>
                              <Typography variant="loanMeta" color="text.secondary" textAlign="right">
                                <Money amount={progress.remainingAmount} code={loan.currency} maxDigits={2} /> remaining
                              </Typography>
                            </Stack>
                          </Stack>

                          <Grid container spacing={{ xs: 2, md: 4 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Typography variant="fieldHint" color="text.secondary">
                                REMAINING BALANCE
                              </Typography>
                              <Typography variant="loanMetric">
                                <Money amount={progress.remainingAmount} code={loan.currency} maxDigits={2} />
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4 }}>
                              <Typography variant="fieldHint" color="text.secondary">
                                NEXT PAYMENT · {shortDate(progress.nextDueDate)}
                              </Typography>
                              <Typography variant="loanMetricCompact">
                                <Money
                                  amount={Math.min(loan.installmentAmount, progress.remainingAmount)}
                                  code={loan.currency}
                                  maxDigits={2}
                                />
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4 }}>
                              <Typography variant="fieldHint" color="text.secondary">
                                PAYOFF · {shortDate(progress.payoffDate)}
                              </Typography>
                              <Typography variant="loanMetricCompact">
                                {progress.remainingInstallments} payments left
                              </Typography>
                            </Grid>
                          </Grid>

                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1.5}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {isPaid
                                ? 'This loan is fully paid.'
                                : shortfall > 0 ? (
                                  <>
                                    Add <Money amount={shortfall} code={loan.currency} maxDigits={2} /> to{' '}
                                    {account?.name ?? 'the payment account'}.
                                  </>
                                ) : (
                                  `${account?.name ?? 'Payment account'} is ready for the next installment.`
                                )}
                            </Typography>
                            <Button
                              variant="contained"
                              onClick={() => setPaying(loan)}
                              disabled={isPaid || loan.status !== 'active'}
                            >
                              Record payment
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>

      <LoanDialog
        key={`loan-form-${editing?.id ?? 'new'}-${formOpen}`}
        accounts={accounts}
        loan={editing}
        open={formOpen}
        busy={createLoan.isPending || updateLoan.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={save}
      />
      <LoanPaymentDialog
        key={`loan-payment-${paying?.id ?? 'closed'}`}
        loan={paying}
        open={Boolean(paying)}
        busy={recordPayment.isPending}
        onClose={() => setPaying(null)}
        onSave={pay}
      />
    </Stack>
  );
}

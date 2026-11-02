import { CalendarMonthIcon, PaymentsIcon } from '@/components/AppIcon';

import { Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Skeleton, Stack, Typography } from '@monochrome-ui/design-system';
import { useNavigate } from 'react-router-dom';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useLedgerLines, useLoans, useTransactions } from '@/hooks/useFinance';
import { calculateAccountBalance } from '@/libs/financeCalculations';
import { getLoanProgress } from '@/libs/loanCalculations';
import { DashboardSectionHeading } from './DashboardSectionHeading';

export function LoanProgressSection() {
  const navigate = useNavigate();
  const { householdId } = useAppContext();
  const { data: loans = [], isLoading: loansLoading } = useLoans(householdId);
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(householdId);
  const { data: lines = [], isLoading: linesLoading } = useLedgerLines(householdId);

  if (loansLoading || accountsLoading || transactionsLoading || linesLoading)
    return <Skeleton variant="rounded" height={375} />;

  const candidates = loans
    .filter((loan) => loan.status === 'active')
    .map((loan) => ({ loan, progress: getLoanProgress(loan, transactions, lines) }))
    .sort((a, b) => (a.progress.nextDueDate ?? '').localeCompare(b.progress.nextDueDate ?? ''));
  const selected = candidates[0];

  if (!selected) return null;

  const { loan, progress } = selected;
  const account = accounts.find((item) => item.id === loan.paymentAccountId);
  const accountBalance = account ? calculateAccountBalance(account.id, transactions, lines) : 0;
  const shortfall = Math.max(0, loan.installmentAmount - accountBalance);
  const shortDate = (date: string | null) =>
    date
      ? new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Complete';

  return (
    <Card variant="sectionSurface" sx={{ height: 375 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Stack spacing={2.5}>
            <DashboardSectionHeading
              icon={<PaymentsIcon size={22} strokeWidth={1.8} />}
              title={loan.name}
              subtitle={`${progress.paidInstallments} of ${loan.totalInstallments} payments`}
              trailing={<Chip label={`${progress.progressPercent.toFixed(0)}% paid`} color="success" />}
            />

            <Stack spacing={0.75}>
              <LinearProgress size="large" color="primary" variant="determinate" value={progress.progressPercent} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="metricMetadata" color="text.secondary">
                  {progress.paidInstallments} paid
                </Typography>
                <Typography variant="metricMetadata" color="text.secondary">
                  <Money amount={progress.remainingAmount} code={loan.currency} maxDigits={2} /> left
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography component="div" variant="fieldHint" color="text.secondary">
                  NEXT · {shortDate(progress.nextDueDate)}
                </Typography>
                <Typography variant="metricValueCompact" noWrap>
                  <Money
                    amount={Math.min(loan.installmentAmount, progress.remainingAmount)}
                    code={loan.currency}
                    maxDigits={2}
                  />
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography component="div" variant="fieldHint" color="text.secondary">
                  PAYOFF · {shortDate(progress.payoffDate)}
                </Typography>
                <Typography variant="metricValueCompact">{progress.remainingInstallments} payments left</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthIcon color={shortfall > 0 ? 'warning' : 'success'} size={22} strokeWidth={1.8} />
              <Typography variant="body1">
                {shortfall > 0 ? (
                  <>
                    Add <Money amount={shortfall} code={loan.currency} maxDigits={2} /> to{' '}
                    {account?.name ?? 'the payment account'}
                  </>
                ) : (
                  `${account?.name ?? 'Payment account'} is ready`
                )}
              </Typography>
            </Stack>
          </Stack>

          <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/loans')}>
            View loan
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

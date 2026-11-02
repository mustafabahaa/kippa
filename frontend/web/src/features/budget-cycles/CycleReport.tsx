import { ExpandLessIcon } from '@/components/AppIcon';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@monochrome-ui/design-system';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import {
  useAccounts,
  useAllBudgetAllocations,
  useCategories,
  useCycles,
  useDisplayRates,
  useHouseholdBaseCurrency,
  useLedgerLines,
  useTransactions,
} from '@/hooks/useFinance';
import type { FinanceTransaction } from '@kippa/domain';
import { convertToBaseCurrency, getPostedTransactions } from '@/libs/financeCalculations';
import { calculateCycleReport, LOAN_PAYMENTS_CATEGORY_ID } from '@/libs/cycleReport';
import { PageHeader } from '@monochrome-ui/design-system';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { TransactionIcon } from '@/features/transactions';
import { formatCycleDate } from './cycleUtils';
import { DividedDetailRow, ResponsiveSummaryItem } from '@monochrome-ui/design-system';

const PAGE_SIZE = 25;

function formatTransactionDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function CycleReport() {
  const { householdId } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const { maskText } = usePrivacyMask();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accountFilter, setAccountFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);

  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(householdId);
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: allocations = [], isLoading: allocationsLoading } = useAllBudgetAllocations(householdId);
  const foreignCurrencies = Array.from(
    new Set(accounts.map((account) => account.currency).filter((currency) => currency !== baseCurrency)),
  );
  const { data: displayRates = {}, isLoading: ratesLoading } = useDisplayRates(baseCurrency, foreignCurrencies);

  const reportCycles = useMemo(
    () =>
      [...cycles].filter((cycle) => cycle.status === 'closed').sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [cycles],
  );
  const requestedCycleId = searchParams.get('cycle');
  const selectedCycle = reportCycles.find((cycle) => cycle.id === requestedCycleId) ?? reportCycles[0] ?? null;

  useEffect(() => {
    if (!selectedCycle || requestedCycleId === selectedCycle.id) return;
    setSearchParams({ cycle: selectedCycle.id }, { replace: true });
  }, [requestedCycleId, selectedCycle, setSearchParams]);

  const report = useMemo(
    () =>
      selectedCycle
        ? calculateCycleReport(
            selectedCycle,
            accounts,
            categories,
            transactions,
            ledgerLines,
            allocations,
            baseCurrency,
            displayRates,
            cycles,
          )
        : null,
    [accounts, allocations, baseCurrency, categories, cycles, displayRates, ledgerLines, selectedCycle, transactions],
  );

  const allCycleTransactions = useMemo(() => {
    if (!selectedCycle) return [];
    return getPostedTransactions(transactions)
      .filter((transaction) => transaction.budgetCycleId === selectedCycle.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [selectedCycle, transactions]);

  const cycleTransactions = useMemo(() => {
    return allCycleTransactions.filter(
      (transaction) =>
        accountFilter === 'all' ||
        ledgerLines.some((line) => line.transactionId === transaction.id && line.accountId === accountFilter),
    );
  }, [accountFilter, allCycleTransactions, ledgerLines]);

  const visibleTransactions = cycleTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const isLoading =
    cyclesLoading ||
    accountsLoading ||
    categoriesLoading ||
    transactionsLoading ||
    linesLoading ||
    allocationsLoading ||
    ratesLoading;

  const selectAccountTransactions = (accountId: string) => {
    setAccountFilter(accountId);
    setPage(0);
    requestAnimationFrame(() =>
      document.getElementById('cycle-transactions')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const toggleCategory = (categoryId: string | null) => {
    const key = categoryId ?? 'uncategorized';
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const transactionsForCategory = (categoryId: string | null) =>
    allCycleTransactions.filter((transaction) => {
      if (transaction.type !== 'expense') return false;
      if (categoryId === LOAN_PAYMENTS_CATEGORY_ID) return Boolean(transaction.loanId);
      if (categoryId === null) return !transaction.categoryId && !transaction.loanId;
      return transaction.categoryId === categoryId && !transaction.loanId;
    });

  const categoryTransactionAmount = (transaction: FinanceTransaction) =>
    ledgerLines
      .filter((line) => line.transactionId === transaction.id && line.signedAmount < 0)
      .reduce(
        (total, line) => total + convertToBaseCurrency(-line.signedAmount, line.currency, baseCurrency, displayRates),
        0,
      );

  const transactionDisplay = (transaction: FinanceTransaction) => {
    const lines = ledgerLines.filter((line) => line.transactionId === transaction.id);
    const names = Array.from(new Set(lines.map((line) => accountById.get(line.accountId)?.name).filter(Boolean))).join(
      ' → ',
    );
    const title = transaction.description || categoryById.get(transaction.categoryId ?? '')?.name || transaction.type;
    if (accountFilter === 'all' && transaction.type === 'transfer') {
      return { amount: null, currency: baseCurrency, names, title };
    }
    const amount =
      accountFilter === 'all'
        ? (lines[0]?.signedAmount ?? 0)
        : lines
            .filter((line) => line.accountId === accountFilter)
            .reduce((total, line) => total + line.signedAmount, 0);
    const currency =
      accountFilter === 'all'
        ? (lines[0]?.currency ?? baseCurrency)
        : (accountById.get(accountFilter)?.currency ?? baseCurrency);
    return { amount, currency, names, title };
  };

  if (isLoading) {
    return (
      <Stack spacing={{ xs: 2, md: 3 }}>
        <PageHeader title="Cycle report" subtitle="Review account balances and spending for a completed cycle." />
        <Stack spacing={3}>
          <Skeleton variant="text" width="45%" height={32} />
          <Skeleton variant="text" width="72%" height={90} />
          <Skeleton variant="text" width="64%" height={220} />
        </Stack>
      </Stack>
    );
  }

  if (!selectedCycle || !report) {
    return (
      <Stack spacing={{ xs: 2, md: 3 }}>
        <PageHeader title="Cycle report" subtitle="Review how a completed budget cycle performed." />
        <Box component="section" >
          <Stack spacing={{ xs: 2, md: 3 }}>
            <SectionHeading
              title="No completed cycles yet"
              subtitle="Close a cycle to create its performance report."
            />
          </Stack>
        </Box>
      </Stack>
    );
  }

  const summary = [
    {
      label: 'Value at cycle start',
      description: 'All account balances, minus card debt.',
      value: report.openingBalance,
      color: 'text.primary',
    },
    {
      label: 'Income received',
      description: 'Income recorded in this cycle. Transfers excluded.',
      value: report.totalIncome,
      color: 'success.main',
    },
    {
      label: 'Spent during cycle',
      description: 'Expenses and loan payments. Transfers excluded.',
      value: report.totalSpending,
      color: 'text.primary',
    },
    {
      label: 'Value at cycle end',
      description: 'All ending balances, minus card debt.',
      value: report.closingBalance,
      color: 'text.primary',
    },
    {
      label: 'Income left after spending',
      description: 'Income received minus spending.',
      value: report.netCashFlow,
      color: report.netCashFlow >= 0 ? 'success.main' : 'error.main',
    },
  ];

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <PageHeader
        title="Cycle report"
        subtitle={`${selectedCycle.name} · ${formatCycleDate(selectedCycle.startDate)} — ${selectedCycle.endDate ? formatCycleDate(selectedCycle.endDate) : 'Closed'}`}
        action={
          <Box sx={{ width: { xs: '100%', sm: 280 } }}>
            <FormControl fullWidth>
              <InputLabel id="cycle-report-select-label">Cycle</InputLabel>
              <Select
                size="medium"
                labelId="cycle-report-select-label"
                label="Cycle"
                value={selectedCycle.id}
                onChange={(event) => {
                  setSearchParams({ cycle: event.target.value });
                  setAccountFilter('all');
                  setPage(0);
                }}
              >
                {reportCycles.map((cycle) => (
                  <MenuItem key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
      />

      <Box component="section" >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <SectionHeading title="Balances by account" subtitle="How each account changed during this cycle" />
          <Typography variant="body2" color="text.secondary" >
            Bank and cash accounts: starting balance + added money − removed money = ending balance. Credit cards:
            starting debt + new charges − payments = ending debt.
          </Typography>
          <Box
            sx={{
              width: '100%',
              maxWidth: 1280,
              mx: 'auto',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
              columnGap: { xs: 0, md: 4 },
            }}
          >
            {report.accounts.map((account) => {
              const isCredit = account.accountType === 'credit';
              const startingAmount = isCredit ? Math.abs(account.openingBalance) : account.openingBalance;
              const endingAmount = isCredit ? Math.abs(account.closingBalance) : account.closingBalance;
              return (
                <DividedDetailRow key={account.accountId}>
                  <Stack spacing={2.5}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={2}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      <Box>
                        <Typography variant="sectionTitle">{account.accountName}</Typography>
                        <Typography variant="sectionSubtitle" color="text.secondary">
                          {account.accountType.toUpperCase()} · {account.currency}
                        </Typography>
                      </Box>
                      <Chip label={`${account.transactionCount} transactions`} size="small" />
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2.5 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="fieldHint" color="text.secondary">
                          {isCredit ? 'Debt when cycle started' : 'Balance when cycle started'}
                        </Typography>
                        <Typography variant="metricValueCompact">
                          <Money amount={startingAmount} code={account.currency} maxDigits={2} />
                        </Typography>
                      </Stack>
                      <Stack spacing={0.5} alignItems="flex-end" sx={{ textAlign: 'right' }}>
                        <Typography variant="fieldHint" color="text.secondary">
                          {isCredit ? 'Debt when cycle ended' : 'Balance when cycle ended'}
                        </Typography>
                        <Typography variant="metricValueCompact">
                          <Money amount={endingAmount} code={account.currency} maxDigits={2} />
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2.5 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="fieldHint" color="text.secondary">
                          {isCredit ? 'Payments made' : 'Added to account'}
                        </Typography>
                        <Typography variant="sectionLabel" color="success.main">
                          <Money amount={account.moneyIn} code={account.currency} maxDigits={2} />
                        </Typography>
                      </Stack>
                      <Stack spacing={0.5} alignItems="flex-end" sx={{ textAlign: 'right' }}>
                        <Typography variant="fieldHint" color="text.secondary">
                          {isCredit ? 'New card charges' : 'Removed from account'}
                        </Typography>
                        <Typography variant="sectionLabel">
                          <Money amount={account.moneyOut} code={account.currency} maxDigits={2} />
                        </Typography>
                      </Stack>
                    </Box>
                    <Button
                      variant="segmented"
                      onClick={() => selectAccountTransactions(account.accountId)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      View account transactions
                    </Button>
                  </Stack>
                </DividedDetailRow>
              );
            })}
          </Box>
        </Stack>
      </Box>

      <Box component="section" >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <SectionHeading title="Household totals" subtitle={`A combined view of every account in ${baseCurrency}`} />
          <Typography variant="body2" color="text.secondary" >
            This is not another account. USD and other currencies are converted to {baseCurrency}, then credit-card debt
            is subtracted to show one household-wide value.
          </Typography>
          <Box
            sx={{
              width: '100%',
              maxWidth: 1280,
              mx: 'auto',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' },
              columnGap: { xs: 0, md: 4 },
            }}
          >
            {summary.map((item) => (
              <ResponsiveSummaryItem key={item.label}>
                <Stack spacing={1}>
                  <Typography variant="fieldHint" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="metricValue" color={item.color}>
                    <Money amount={item.value} code={baseCurrency} maxDigits={2} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Stack>
              </ResponsiveSummaryItem>
            ))}
          </Box>
        </Stack>
      </Box>

      <Box component="section" >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <SectionHeading
            title="Cycle outcome"
            subtitle="Why the household’s total value changed"
            trailing={
              <Chip
                label={`${report.savingsRate.toFixed(1)}% savings rate`}
                color={report.savingsRate >= 0 ? 'success' : 'error'}
              />
            }
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 3, md: 5 }}
            sx={{width: '100%', maxWidth: 1280, mx: 'auto' }}
          >
            <Stack spacing={0.75} sx={{ flex: 1 }}>
              <Typography variant="fieldHint" color="text.secondary">
                Change in total account value
              </Typography>
              <Typography
                variant="metricValue"
                color={report.closingBalance - report.openingBalance >= 0 ? 'success.main' : 'error.main'}
              >
                <Money amount={report.closingBalance - report.openingBalance} code={baseCurrency} maxDigits={2} />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ending household value minus starting household value.
              </Typography>
            </Stack>
            <Stack spacing={0.75} sx={{ flex: 1 }}>
              <Typography variant="fieldHint" color="text.secondary">
                Income left after spending
              </Typography>
              <Typography variant="metricValue">
                <Money amount={report.netCashFlow} code={baseCurrency} maxDigits={2} />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Income minus expenses and loan payments. Transfers do not count.
              </Typography>
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary" >
            These two results can differ because account value also reflects reconciliation adjustments and
            currency-conversion effects.
          </Typography>
        </Stack>
      </Box>

      <Box component="section" >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <SectionHeading title="Spending by category" subtitle="Budget compared with actual spending" />
          {report.categories.length === 0 ? (
            <Box sx={{py: 2 }}>
              <Typography variant="sectionTitle">No category spending</Typography>
              <Typography variant="sectionSubtitle" color="text.secondary">
                This cycle has no posted expense transactions.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{width: '100%', maxWidth: 1280, mx: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Budgeted</TableCell>
                    <TableCell align="right">Spent</TableCell>
                    <TableCell align="right">Difference</TableCell>
                    <TableCell align="right">Share</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.categories.map((category) => {
                    const key = category.categoryId ?? 'uncategorized';
                    const categoryTransactions = transactionsForCategory(category.categoryId);
                    const expanded = expandedCategories.has(key);
                    return (
                      <Fragment key={key}>
                        <TableRow hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.categoryName}`}
                              disabled={categoryTransactions.length === 0}
                              onClick={() => toggleCategory(category.categoryId)}
                            >
                              <ExpandLessIcon size={22} strokeWidth={1.8} />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body1">{category.categoryName}</Typography>
                              <Chip label={`${categoryTransactions.length}`} size="small" />
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Money amount={category.planned} code={baseCurrency} maxDigits={2} />
                          </TableCell>
                          <TableCell align="right">
                            <Money amount={category.spent} code={baseCurrency} maxDigits={2} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" color={category.variance >= 0 ? 'success.main' : 'error.main'}>
                              <Money amount={category.variance} code={baseCurrency} maxDigits={2} />
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{(category.share * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0 }}>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Stack divider={<Divider flexItem />} sx={{ py: 1 }}>
                                {categoryTransactions.map((transaction) => {
                                  const lines = ledgerLines.filter((line) => line.transactionId === transaction.id);
                                  const accountNames = Array.from(
                                    new Set(lines.map((line) => accountById.get(line.accountId)?.name).filter(Boolean)),
                                  ).join(' → ');
                                  const title =
                                    transaction.description ||
                                    (transaction.loanId ? 'Loan payment' : category.categoryName);
                                  return (
                                    <Stack
                                      key={transaction.id}
                                      direction={{ xs: 'column', sm: 'row' }}
                                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                                      justifyContent="space-between"
                                      spacing={1.5}
                                      sx={{ py: 1.5, px: 1 }}
                                    >
                                      <Stack direction="row" spacing={1.5} alignItems="center">
                                        <TransactionIcon type={transaction.type} size={36} />
                                        <Box>
                                          <Typography variant="body1">{maskText(title)}</Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            {formatTransactionDate(transaction.date)} · {accountNames || 'Account'}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                      <Typography variant="sectionLabel">
                                        <Money
                                          amount={categoryTransactionAmount(transaction)}
                                          code={baseCurrency}
                                          maxDigits={2}
                                        />
                                      </Typography>
                                    </Stack>
                                  );
                                })}
                              </Stack>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Box>

      <Box component="section" id="cycle-transactions" >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <SectionHeading title="Cycle transactions" subtitle="Review transactions for all accounts or one account" />
          <Box sx={{width: '100%', maxWidth: 1280, mx: 'auto' }}>
            <Box sx={{ width: '100%', maxWidth: { sm: 420 } }}>
              <FormControl fullWidth>
                <InputLabel id="cycle-report-account-label">Account</InputLabel>
                <Select
                  size="medium"
                  labelId="cycle-report-account-label"
                  label="Account"
                  value={accountFilter}
                  onChange={(event) => {
                    setAccountFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All accounts</MenuItem>
                  {report.accounts.map((account) => (
                    <MenuItem key={account.accountId} value={account.accountId}>
                      {account.accountName} ({account.currency})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {cycleTransactions.length === 0 ? (
            <Box sx={{py: 2 }}>
              <Typography variant="sectionTitle">No transactions</Typography>
              <Typography variant="sectionSubtitle" color="text.secondary">
                No posted transactions match this account.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer
                sx={{
                  display: { xs: 'none', md: 'block' },
                    width: '100%',
                  maxWidth: 1280,
                  mx: 'auto',
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Transaction</TableCell>
                      <TableCell>Accounts</TableCell>
                      <TableCell align="right">Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleTransactions.map((transaction) => {
                      const display = transactionDisplay(transaction);
                      return (
                        <TableRow key={transaction.id} hover>
                          <TableCell>{formatTransactionDate(transaction.date)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TransactionIcon type={transaction.type} size={36} />
                              <Box>
                                <Typography variant="body1">{maskText(display.title)}</Typography>
                                <Chip size="small" label={transaction.type} />
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{display.names || 'Account'}</TableCell>
                          <TableCell align="right">
                            {display.amount === null ? (
                              <Typography variant="body2" color="text.secondary">
                                Transfer
                              </Typography>
                            ) : (
                              <Typography
                                variant="sectionLabel"
                                color={display.amount >= 0 ? 'success.main' : 'text.primary'}
                              >
                                {display.amount >= 0 ? '+' : '−'}
                                <Money amount={Math.abs(display.amount)} code={display.currency} maxDigits={2} />
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                divider={<Divider flexItem />}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                    width: '100%',
                  maxWidth: 1280,
                  mx: 'auto',
                }}
              >
                {visibleTransactions.map((transaction) => {
                  const display = transactionDisplay(transaction);
                  return (
                    <Stack key={transaction.id} direction="row" spacing={1.5} sx={{ py: 2 }}>
                      <TransactionIcon type={transaction.type} size={40} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" noWrap>
                          {maskText(display.title)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatTransactionDate(transaction.date)}
                        </Typography>
                      </Box>
                      {display.amount === null ? (
                        <Typography variant="body2" color="text.secondary">
                          Transfer
                        </Typography>
                      ) : (
                        <Typography
                          variant="sectionLabel"
                          color={display.amount >= 0 ? 'success.main' : 'text.primary'}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {display.amount >= 0 ? '+' : '−'}
                          <Money amount={Math.abs(display.amount)} code={display.currency} maxDigits={2} />
                        </Typography>
                      )}
                    </Stack>
                  );
                })}
              </Stack>

              <TablePagination
                component="div"
                count={cycleTransactions.length}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                onPageChange={(...[, nextPage]) => setPage(nextPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
                sx={{
                    width: '100%',
                  maxWidth: 1280,
                  mx: 'auto',
                  '& .MuiTablePagination-toolbar': { flexWrap: 'wrap' },
                  '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
                }}
              />
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

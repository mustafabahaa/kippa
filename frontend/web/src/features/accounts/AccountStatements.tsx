import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
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
  TextField,
  Typography,
} from '@mui/material';
import type { TransactionType } from '@kippa/domain';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { useAccounts, useCategories, useLedgerLines, useTransactions } from '@/hooks/useFinance';
import { calculateAccountBalance } from '@/libs/financeCalculations';
import { buildAccountStatement } from '@/libs/accountStatement';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { TransactionIcon } from '@/features/transactions/components/TransactionIcon';
import { AccountBalanceIcon, SearchIcon } from '@/components/AppIcon';

const DEFAULT_PAGE_SIZE = 25;
const sectionIndent = { xs: 0, md: 4 } as const;
const contentIndent = { xs: 0, md: 4 } as const;

function formatStatementDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function transactionLabel(type: TransactionType) {
  if (type === 'adjustment') return 'Reconciliation';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function accountTypeLabel(type: string) {
  return type === 'running'
    ? 'Running bank'
    : type === 'savings'
      ? 'Savings bank'
      : type[0].toUpperCase() + type.slice(1);
}

export function AccountStatements() {
  const navigate = useNavigate();
  const { householdId } = useAppContext();
  const { maskText } = usePrivacyMask();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);

  const statementAccounts = useMemo(
    () => accounts.filter((account) => account.type !== 'credit' && account.isActive),
    [accounts],
  );
  const requestedAccountId = searchParams.get('account');
  const selectedAccount =
    statementAccounts.find((account) => account.id === requestedAccountId) ?? statementAccounts[0] ?? null;

  useEffect(() => {
    if (!selectedAccount || requestedAccountId === selectedAccount.id) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('account', selectedAccount.id);
        return next;
      },
      { replace: true },
    );
  }, [requestedAccountId, selectedAccount, setSearchParams]);

  const resetPage = () => setPage(0);
  const entries = useMemo(
    () => (selectedAccount ? buildAccountStatement(selectedAccount.id, transactions, ledgerLines, { search }) : []),
    [ledgerLines, search, selectedAccount, transactions],
  );

  const visibleEntries = entries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const currentBalance = selectedAccount ? calculateAccountBalance(selectedAccount.id, transactions, ledgerLines) : 0;
  const categoryName = (id?: string | null) => categories.find((category) => category.id === id)?.name;
  const isLoading = accountsLoading || categoriesLoading || transactionsLoading || linesLoading;
  const accountSelector = statementAccounts.length > 1 && selectedAccount && (
    <Box sx={{ width: { xs: '100%', sm: 300 } }}>
      <FormControl fullWidth>
        <InputLabel id="statement-account-label">Account</InputLabel>
        <Select
          size="medium"
          labelId="statement-account-label"
          label="Account"
          value={selectedAccount.id}
          onChange={(event) => {
            setSearchParams({ account: event.target.value });
            resetPage();
          }}
        >
          {statementAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name} · {account.currency}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  if (isLoading) {
    return (
      <Stack spacing={{ xs: 2, md: 3 }}>
        <PageHeader
          title="Statements"
          subtitle="Follow each account movement and its running balance."
          action={<Skeleton variant="rounded" width={300} height={40} />}
        />
        <Box component="section" sx={{ px: sectionIndent }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Skeleton variant="rounded" width={44} height={44} />
                <Box sx={{ minWidth: 180 }}>
                  <Skeleton variant="text" width={150} height={24} />
                  <Skeleton variant="text" width={115} height={18} />
                </Box>
              </Stack>
              <Skeleton variant="text" width={190} height={34} />
            </Stack>
            <Box sx={{ px: contentIndent }}>
              <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                <Stack spacing={2}>
                  <Skeleton variant="rounded" width={380} height={44} />
                  <Divider />
                  <Stack spacing={0.5}>
                    <Skeleton variant="text" width="100%" height={48} />
                    {[1, 2, 3, 4, 5].map((item) => (
                      <Stack key={item} direction="row" spacing={2} sx={{ py: 1.5 }}>
                        <Skeleton variant="text" width="14%" height={24} />
                        <Skeleton variant="text" width="38%" height={24} />
                        <Skeleton variant="text" width="16%" height={24} />
                        <Skeleton variant="text" width="15%" height={24} />
                        <Skeleton variant="text" width="17%" height={24} />
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <PageHeader
        title="Statements"
        subtitle="Follow each account movement and its running balance."
        action={accountSelector}
      />

      <Box component="section" sx={{ px: sectionIndent }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          {selectedAccount && (
            <SectionHeading
              icon={<AccountBalanceIcon variant="Linear" />}
              title={selectedAccount.name}
              subtitle={`${accountTypeLabel(selectedAccount.type)} · ${selectedAccount.currency}`}
              trailing={
                <Stack spacing={0.25} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                  <Typography variant="fieldHint" color="text.secondary">
                    Current balance
                  </Typography>
                  <Typography variant="loanMetric">
                    <Money amount={currentBalance} code={selectedAccount.currency} maxDigits={2} />
                  </Typography>
                </Stack>
              }
            />
          )}

          <Box sx={{ px: contentIndent }}>
            <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', minWidth: 0 }}>
              {selectedAccount ? (
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Box sx={{ width: '100%', maxWidth: 440 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search statement activity"
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          resetPage();
                        }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon variant="Linear" fontSize="small" />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Box>
                    <Chip size="small" label={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`} />
                  </Stack>

                  {entries.length === 0 ? (
                    <EmptyLayout
                      icon={<SearchIcon variant="Linear" />}
                      title="No statement entries"
                      description="Try a different search or choose another account."
                    />
                  ) : (
                    <>
                      <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Transaction</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell align="right">Change</TableCell>
                              <TableCell align="right">Balance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {visibleEntries.map((entry) => {
                              const category = categoryName(entry.transaction.categoryId);
                              const title =
                                entry.transaction.description || category || transactionLabel(entry.transaction.type);
                              return (
                                <TableRow key={entry.transaction.id} hover>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {formatStatementDate(entry.transaction.date)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body1">{maskText(title)}</Typography>
                                    {category && (
                                      <Typography variant="body2" color="text.secondary">
                                        {maskText(category)}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip size="small" label={transactionLabel(entry.transaction.type)} />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography
                                      variant="sectionLabel"
                                      color={entry.amount >= 0 ? 'success.main' : 'text.primary'}
                                    >
                                      {entry.amount >= 0 ? '+' : '−'}
                                      <Money
                                        amount={Math.abs(entry.amount)}
                                        code={selectedAccount.currency}
                                        maxDigits={2}
                                      />
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="sectionLabel">
                                      <Money amount={entry.balance} code={selectedAccount.currency} maxDigits={2} />
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Stack divider={<Divider flexItem />} sx={{ display: { xs: 'flex', md: 'none' } }}>
                        {visibleEntries.map((entry) => {
                          const category = categoryName(entry.transaction.categoryId);
                          const title =
                            entry.transaction.description || category || transactionLabel(entry.transaction.type);
                          return (
                            <Stack
                              key={entry.transaction.id}
                              direction="row"
                              alignItems="center"
                              spacing={1.5}
                              sx={{ py: 2, minWidth: 0 }}
                            >
                              <TransactionIcon type={entry.transaction.type} size={40} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="sectionTitle" noWrap>
                                  {maskText(title)}
                                </Typography>
                                <Typography variant="sectionSubtitle" color="text.secondary">
                                  {formatStatementDate(entry.transaction.date)}
                                  {category && category !== title ? ` · ${maskText(category)}` : ''}
                                </Typography>
                                <Typography variant="sectionSubtitle" color="text.secondary">
                                  Balance ·{' '}
                                  <Money amount={entry.balance} code={selectedAccount.currency} maxDigits={2} />
                                </Typography>
                              </Box>
                              <Typography
                                variant="loanMetricCompact"
                                color={entry.amount >= 0 ? 'success.main' : 'text.primary'}
                                sx={{ whiteSpace: 'nowrap' }}
                              >
                                {entry.amount >= 0 ? '+' : '−'}
                                <Money amount={Math.abs(entry.amount)} code={selectedAccount.currency} maxDigits={2} />
                              </Typography>
                            </Stack>
                          );
                        })}
                      </Stack>

                      <Divider />
                      <TablePagination
                        component="div"
                        count={entries.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[10, 25, 50]}
                        onPageChange={(event, nextPage) => {
                          void event;
                          setPage(nextPage);
                        }}
                        onRowsPerPageChange={(event) => {
                          setRowsPerPage(Number(event.target.value));
                          setPage(0);
                        }}
                        sx={{
                          '& .MuiTablePagination-toolbar': { flexWrap: 'wrap' },
                          '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
                        }}
                      />
                    </>
                  )}
                </Stack>
              ) : (
                <EmptyLayout
                  icon={<AccountBalanceIcon variant="Linear" />}
                  title="No active accounts"
                  description="Create or activate an account to see its statement."
                  action={
                    <Button variant="contained" onClick={() => navigate('/accounts')}>
                      Go to accounts
                    </Button>
                  }
                />
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

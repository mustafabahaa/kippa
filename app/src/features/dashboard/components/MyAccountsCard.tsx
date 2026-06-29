import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import { 
  useAccounts, 
  useTransactions, 
  useLedgerLines 
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';

export function MyAccountsCard() {
  const { householdId } = useAppContext();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);

  const getAccountIcon = (type: string) => {
    if (type.toLowerCase() === 'savings' || type.toLowerCase() === 'savings bank') {
      return <SavingsIcon sx={{ color: 'text.secondary' }} />;
    }
    if (type.toLowerCase() === 'cash' || type.toLowerCase() === 'wallet') {
      return <PaymentsIcon sx={{ color: 'text.secondary' }} />;
    }
    return <AccountBalanceIcon sx={{ color: 'text.secondary' }} />;
  };

  const isLoading = accountsLoading || txsLoading || linesLoading;

  if (isLoading || !accounts || !transactions || !ledgerLines) {
    return (
      <Box>
        <Skeleton variant="text" width="30%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {[1, 2].map(i => (
            <Card key={i} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '60%' }}>
                  <Skeleton variant="circular" width={40} height={40} animation="wave" />
                  <Box sx={{ width: '70%' }}>
                    <Skeleton variant="text" width="80%" height={20} animation="wave" />
                    <Skeleton variant="text" width="60%" height={16} animation="wave" />
                  </Box>
                </Stack>
                <Skeleton variant="text" width="20%" height={20} animation="wave" />
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  }

  // Calculate local balances
  const activeTxIds = new Set(transactions.filter(t => t.status === 'posted').map(t => t.id));
  const activeLines = ledgerLines.filter(line => activeTxIds.has(line.transactionId));
  const balancesMap: Record<string, number> = {};
  accounts.forEach(acc => {
    balancesMap[acc.id] = 0;
  });
  activeLines.forEach(line => {
    if (balancesMap[line.accountId] !== undefined) {
      balancesMap[line.accountId] += line.signedAmount;
    }
  });

  return (
    <Stack spacing={1.5}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
          My Accounts
        </Typography>
      </Box>

      <Stack spacing={1}>
        {accounts.map(acc => {
          const bal = balancesMap[acc.id] || 0;
          return (
            <Box 
              key={acc.id} 
              sx={{ 
                p: 2, 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: '20px', 
                bgcolor: 'background.paper', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getAccountIcon(acc.type)}
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{acc.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>{acc.type}</Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: acc.currency === 'USD' ? 'primary.main' : 'text.primary' }}>
                {acc.currency === 'USD' ? '$' : ''}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {acc.currency !== 'USD' ? acc.currency : ''}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}

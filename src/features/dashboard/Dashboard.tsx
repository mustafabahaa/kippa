import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  LinearProgress, 
  Button, 
  Divider,
  TextField,
  Chip,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WorkIcon from '@mui/icons-material/Work';
import DeleteIcon from '@mui/icons-material/Delete';
import { DashboardData } from '../../services/selectors';
import { Account, BudgetCycle, FinanceTransaction, Category, LedgerLine, CurrencyCode } from '../../domain/financeTypes';
import { transactionService } from '../../services/transactionService';

interface DashboardProps {
  isLoading?: boolean;
  data: DashboardData;
  accounts: Account[];
  categories: Category[];
  activeCycle: BudgetCycle | null;
  transactions: FinanceTransaction[];
  ledgerLines: LedgerLine[];
  displayUsdToEgpRate: number;
  onUpdateDisplayRate: (rate: number) => void;
  onVoidTransaction: (txId: string) => void;
  onNavigateToFastEntry: () => void;
  onNavigateToActivity: () => void;
}

export function Dashboard({
  isLoading = false,
  data,
  accounts,
  categories,
  activeCycle,
  transactions,
  ledgerLines,
  displayUsdToEgpRate,
  onUpdateDisplayRate,
  onVoidTransaction,
  onNavigateToFastEntry,
  onNavigateToActivity
}: DashboardProps) {
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(displayUsdToEgpRate.toString());

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [editAccId, setEditAccId] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');

  const handleOpenEdit = (tx: FinanceTransaction) => {
    setEditingTx(tx);
    setEditDesc(tx.description || '');
    setEditDate(tx.date);
    setEditCatId(tx.categoryId || '');
    setEditType((tx.type === 'income' ? 'income' : 'expense') as 'income' | 'expense');

    const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
    const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
    setEditAccId(firstLine ? firstLine.accountId : '');
    setEditAmount(firstLine ? Math.abs(firstLine.signedAmount).toString() : '0');
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const signedAmount = editType === 'income' ? amount : -amount;
    const txLines = ledgerLines.filter(l => l.transactionId === editingTx.id);
    const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
    const currency = firstLine ? firstLine.currency : 'EGP';

    await transactionService.updateTransaction(
      "household-finance",
      editingTx.id,
      {
        description: editDesc,
        date: editDate,
        categoryId: editCatId || undefined,
        type: editType
      },
      {
        accountId: editAccId,
        signedAmount: signedAmount,
        currency: currency as CurrencyCode
      }
    );

    setEditingTx(null);
    onUpdateDisplayRate(displayUsdToEgpRate); // simple callback ping to reload parent state!
  };

  const handleSaveRate = () => {
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateDisplayRate(parsed);
      setEditingRate(false);
    }
  };

  const getStatusColor = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return '#1E8E3E';
    if (status === 'warning') return '#F9AB00';
    return '#ba1a1a';
  };

  const getStatusBgColor = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return 'rgba(30, 142, 62, 0.1)';
    if (status === 'warning') return 'rgba(249, 171, 0, 0.1)';
    return 'rgba(186, 26, 26, 0.1)';
  };

  const getStatusLabel = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return 'ON TRACK';
    if (status === 'warning') return 'PACE WARNING';
    return 'OVER BUDGETING';
  };

  const getAccountIcon = (type: string) => {
    if (type.toLowerCase() === 'savings' || type.toLowerCase() === 'savings bank') {
      return <SavingsIcon sx={{ color: 'text.secondary' }} />;
    }
    if (type.toLowerCase() === 'cash' || type.toLowerCase() === 'wallet') {
      return <PaymentsIcon sx={{ color: 'text.secondary' }} />;
    }
    return <AccountBalanceIcon sx={{ color: 'primary.main' }} />;
  };

  const getAccountBgColor = (type: string) => {
    if (type.toLowerCase() === 'savings' || type.toLowerCase() === 'savings bank') {
      return 'action.hover';
    }
    if (type.toLowerCase() === 'cash' || type.toLowerCase() === 'wallet') {
      return 'action.hover';
    }
    return 'info.light';
  };

  const getTxIcon = (type: string) => {
    if (type.toLowerCase() === 'income') {
      return <WorkIcon sx={{ color: '#1E8E3E' }} />;
    }
    return <ShoppingCartIcon sx={{ color: 'text.secondary' }} />;
  };

  const getTxIconBg = (type: string) => {
    if (type.toLowerCase() === 'income') {
      return 'rgba(30, 142, 62, 0.1)';
    }
    return 'action.hover';
  };

  if (isLoading) {
    return (
      <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
        <Stack spacing={3}>
          {/* Skeleton Header */}
          <Box sx={{ mt: 1 }}>
            <Skeleton variant="text" width="60%" height={32} animation="wave" />
            <Skeleton variant="text" width="40%" height={20} animation="wave" sx={{ mt: 0.5 }} />
          </Box>

          {/* Skeleton Hero Card */}
          <Box sx={{ bgcolor: 'action.hover', p: 2.5, borderRadius: '24px', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Skeleton variant="text" width="50%" height={24} animation="wave" />
              <Skeleton variant="text" width="80%" height={48} animation="wave" sx={{ mt: 1 }} />
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" width="30%" height={28} sx={{ borderRadius: '16px' }} animation="wave" />
              <Skeleton variant="rectangular" width="30%" height={28} sx={{ borderRadius: '16px' }} animation="wave" />
            </Stack>
          </Box>

          {/* Skeleton Budget Pulse */}
          <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Skeleton variant="text" width="35%" height={24} animation="wave" />
                <Skeleton variant="rectangular" width="25%" height={24} sx={{ borderRadius: '12px' }} animation="wave" />
              </Stack>
              <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 4, mb: 1.5 }} animation="wave" />
              <Skeleton variant="text" width="70%" height={18} animation="wave" />
            </CardContent>
          </Card>

          {/* Skeleton Quick Actions */}
          <Stack direction="row" spacing={1} sx={{ overflowX: 'hidden' }}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="rectangular" width={110} height={36} sx={{ borderRadius: '18px', flexShrink: 0 }} animation="wave" />
            ))}
          </Stack>

          {/* Skeleton Budget Breakdown Table */}
          <Box>
            <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1.5 }} />
            <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width={60} height={16} /></TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width={40} height={16} /></TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width={40} height={16} /></TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width={50} height={16} /></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell sx={{ py: 1.2 }}><Skeleton variant="text" width="60%" height={18} /></TableCell>
                      <TableCell align="right" sx={{ py: 1.2 }}><Skeleton variant="text" width="40%" height={18} /></TableCell>
                      <TableCell align="right" sx={{ py: 1.2 }}><Skeleton variant="text" width="30%" height={18} /></TableCell>
                      <TableCell align="right" sx={{ py: 1.2 }}><Skeleton variant="text" width="45%" height={18} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Skeleton Accounts */}
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
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
      <Stack spacing={3}>
        {/* Header Section */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Household Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            Smith Household • Cycle: {activeCycle ? activeCycle.name : 'No active cycle'}
          </Typography>
        </Box>

        {/* Total Balance Hero (Total EGP Equivalent) */}
        <Box 
          sx={{ 
            bgcolor: 'primary.dark', 
            p: 2.5, 
            borderRadius: '24px', 
            boxShadow: '0px 4px 12px rgba(0,0,0,0.08)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            minHeight: '180px', 
            position: 'relative', 
            overflow: 'hidden' 
          }}
        >
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -48, 
              right: -48, 
              width: 192, 
              height: 192, 
              bgcolor: 'rgba(255, 255, 255, 0.08)', 
              borderRadius: '50%', 
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }} 
          />
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Total EGP Equivalent
            </Typography>
            <Typography variant="h1" sx={{ color: 'primary.contrastText', fontSize: '32px', fontWeight: 800, mt: 0.5 }}>
              EGP {data.totalEgpEquivalent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              {accounts.map(acc => {
                const balanceObj = data.accountBalances.find(b => b.accountId === acc.id);
                const bal = balanceObj ? balanceObj.balance : 0;
                return (
                  <Typography key={acc.id} variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 500 }}>
                    {acc.currency === 'USD' ? '$' : ''}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {acc.currency !== 'USD' ? acc.currency : ''}
                  </Typography>
                );
              })}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', px: 1.5, py: 0.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fff' }}>schedule</span>
              <Typography variant="body2" sx={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
                {data.cycleProgress ? `${data.cycleProgress.remainingDays} days remaining` : '0 days left'}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', px: 1.5, py: 0.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fff' }}>payments</span>
              <Typography variant="body2" sx={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
                Safe Daily: EGP {data.safeDailySpend.budgetSafe.toFixed(0)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Budget Pulse */}
        <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Budget Pulse
              </Typography>
              <Box sx={{ bgcolor: getStatusBgColor(data.saving.status), color: getStatusColor(data.saving.status), px: 1.2, py: 0.4, borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' }}>
                {getStatusLabel(data.saving.status)}
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <Box flex={1}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, data.spending.plannedBudget > 0 ? (data.spending.actual / data.spending.plannedBudget) * 100 : 0)} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStatusColor(data.saving.status)
                    }
                  }} 
                />
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Spending ratio: {Math.round(data.spending.plannedBudget > 0 ? (data.spending.actual / data.spending.plannedBudget) * 100 : 0)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Cycle progress: {data.cycleProgress ? Math.round(data.cycleProgress.ratio * 100) : 0}%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: getStatusBgColor(data.saving.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: getStatusColor(data.saving.status), fontSize: '24px', margin: 'auto' }}>
                  {data.saving.status === 'on-track' ? 'trending_down' : 'trending_up'}
                </span>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary', fontStyle: 'italic', fontSize: '13px' }}>
              Projected cycle spending: EGP <strong>{data.spending.projected.toFixed(0)}</strong> (Target: EGP {data.spending.plannedBudget.toFixed(0)})
            </Typography>
          </CardContent>
        </Card>

        {/* Budget Breakdown Table */}
        <Stack spacing={1.5}>
          <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
            Budget Breakdown
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
            <Table size="small" aria-label="budget breakdown table">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>Planned</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>Spent</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>Remaining</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.categoryStatus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '13px' }}>
                      No budget allocations found for this cycle.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.categoryStatus.map(cat => {
                    const remaining = cat.planned - cat.spent;
                    const isOver = remaining < 0;
                    return (
                      <TableRow key={cat.categoryId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row" sx={{ fontSize: '13px', fontWeight: 500, py: 1.2 }}>
                          {cat.categoryName}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px', py: 1.2 }}>
                          {cat.planned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px', py: 1.2, color: cat.spent > 0 ? 'text.primary' : 'text.disabled' }}>
                          {cat.spent > 0 ? cat.spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            fontSize: '13px', 
                            fontWeight: 'bold', 
                            py: 1.2, 
                            color: isOver ? 'error.main' : remaining > 0 ? 'success.main' : 'text.secondary' 
                          }}
                        >
                          {isOver ? '' : '+'}{remaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>

        {/* Quick Actions Row */}
        <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', py: 0.5, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <Button 
            onClick={onNavigateToFastEntry}
            sx={{ 
              flexShrink: 0, 
              bgcolor: 'background.paper', 
              color: 'text.primary', 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: '999px', 
              px: 3, 
              py: 1, 
              height: 48,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' } 
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--mui-palette-primary-main, #005c55)', marginRight: '6px' }}>bolt</span>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Fast Entry</Typography>
          </Button>

          <Button 
            sx={{ 
              flexShrink: 0, 
              bgcolor: 'background.paper', 
              color: 'text.primary', 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: '999px', 
              px: 3, 
              py: 1, 
              height: 48,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' } 
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--mui-palette-primary-main, #005c55)', marginRight: '6px' }}>account_balance_wallet</span>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Reconcile</Typography>
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            {editingRate ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  label="USD/EGP Rate"
                  value={rateInput}
                  onChange={e => setRateInput(e.target.value)}
                  sx={{ width: 90 }}
                />
                <IconButton size="small" onClick={handleSaveRate} color="success">
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                  USD/EGP: <strong>{displayUsdToEgpRate}</strong>
                </Typography>
                <IconButton size="small" onClick={() => setEditingRate(true)} sx={{ p: 0.5, width: 24, height: 24 }}>
                  <EditIcon sx={{ fontSize: '12px' }} />
                </IconButton>
              </Stack>
            )}
          </Box>
        </Stack>

        {/* My Accounts */}
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
              My Accounts
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold', cursor: 'pointer' }}>
              View All
            </Typography>
          </Box>

          <Stack spacing={1}>
            {accounts.map(acc => {
              const balanceObj = data.accountBalances.find(b => b.accountId === acc.id);
              const bal = balanceObj ? balanceObj.balance : 0;
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
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: getAccountBgColor(acc.type), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Recent Activity */}
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
              Recent Activity
            </Typography>
            <Typography 
              variant="body2" 
              onClick={onNavigateToActivity}
              sx={{ color: 'primary.main', fontWeight: 'bold', cursor: 'pointer' }}
            >
              View All
            </Typography>
          </Box>

          <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            {transactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No recent activity recorded.
              </Typography>
            ) : (
              <Stack divider={<Divider />}>
                {transactions.slice(0, 5).map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  
                  // Find amount from ledgerLines
                  const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
                  const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
                  const amount = firstLine ? Math.abs(firstLine.signedAmount) : 0;
                  const currency = firstLine ? firstLine.currency : 'EGP';
                  const isIncome = tx.type === 'income' || (tx.type === 'adjustment' && (firstLine?.signedAmount || 0) >= 0);

                  return (
                    <Box 
                      key={tx.id} 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: getTxIconBg(tx.type), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getTxIcon(tx.type)}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '13.5px' }}>
                            {tx.description || cat?.name || 'General'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                            {tx.date} • {tx.type === 'adjustment' ? 'System' : (cat?.name || 'Uncategorized')}
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: isIncome ? '#1E8E3E' : 'text.primary' }}>
                          {isIncome ? '+' : '-'}{amount.toLocaleString()} {currency}
                        </Typography>
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenEdit(tx)}
                          disabled={tx.status === 'voided'}
                          sx={{ p: 0.5, width: 28, height: 28 }}
                        >
                          <EditIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => onVoidTransaction(tx.id)}
                          disabled={tx.status === 'voided'}
                          sx={{ p: 0.5, width: 28, height: 28 }}
                        >
                          <DeleteIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Card>
        </Stack>
      </Stack>

      {/* Edit Transaction Dialog */}
      <Dialog open={Boolean(editingTx)} onClose={() => setEditingTx(null)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Transaction</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <RadioGroup
              row
              value={editType}
              onChange={e => setEditType(e.target.value as 'income' | 'expense')}
            >
              <FormControlLabel value="expense" control={<Radio size="small" />} label="Expense" />
              <FormControlLabel value="income" control={<Radio size="small" />} label="Income" />
            </RadioGroup>

            <TextField
              type="date"
              size="small"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              size="small"
              label="Description"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              type="number"
              size="small"
              label="Amount"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <FormControl size="small" fullWidth>
              <InputLabel id="edit-tx-acc-label">Account</InputLabel>
              <Select
                labelId="edit-tx-acc-label"
                value={editAccId}
                label="Account"
                onChange={e => setEditAccId(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                {accounts.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {editType === 'expense' ? (
              <FormControl size="small" fullWidth>
                <InputLabel id="edit-tx-cat-label">Category</InputLabel>
                <Select
                  labelId="edit-tx-cat-label"
                  value={editCatId}
                  label="Category"
                  onChange={e => setEditCatId(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl size="small" fullWidth>
                <InputLabel id="edit-tx-cat-income-label">Income Category</InputLabel>
                <Select
                  labelId="edit-tx-cat-income-label"
                  value={editCatId}
                  label="Income Category"
                  onChange={e => setEditCatId(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  {categories.filter(c => c.type === 'income').map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditingTx(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" sx={{ borderRadius: '12px', boxShadow: 'none' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

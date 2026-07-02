import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Divider,
  IconButton,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useTransactions,
  useLedgerLines,
  usePayCardMutation,
  useCategories,
  useCycles,
} from '@/hooks/useFinance';
import type { Card, TransactionType } from '@/domain/financeTypes';
import { CardBackground, BankLogo, NetworkLogo, TierLabel, CardChip, ContactlessIcon } from './CardDesign';
import { TransactionIcon } from '@/features/transactions/components/TransactionIcon';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';

type Charge = {
  lineId: string;
  txId: string;
  date: string;
  description: string | null;
  amount: number; // positive
  paid: boolean;
  txType: TransactionType;
  categoryId: string | null;
  budgetCycleId: string | null;
};

function formatDateRange(startDate: string, endDate?: string | null): string {
  const fmt = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return d;
    }
  };
  return `${fmt(startDate)} – ${endDate ? fmt(endDate) : 'Present'}`;
}

export function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { householdId } = useAppContext();
  const { data: allTransactions = [] } = useTransactions(householdId);
  const { data: allLines = [] } = useLedgerLines(householdId);
  const payCard = usePayCardMutation();
  const { data: categories = [] } = useCategories(householdId);
  const { data: allCycles = [] } = useCycles(householdId);

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payLabel, setPayLabel] = useState('Pay');

  const isCredit = card.kind === 'credit';
  const creditAccountId = card.parentAccountId;

  // All outflows (purchases) and inflows (payments) on the credit account.
  const postedTxIds = new Set(allTransactions.filter(t => t.status === 'posted').map(t => t.id));
  const cardLines = allLines
    .filter(l => l.accountId === creditAccountId && postedTxIds.has(l.transactionId))
    .sort((a, b) => {
      const ta = allTransactions.find(t => t.id === a.transactionId);
      const tb = allTransactions.find(t => t.id === b.transactionId);
      return (ta?.date ?? '').localeCompare(tb?.date ?? '');
    });

  // Purchases oldest-first; payments settle oldest unpaid first.
  const charges: Charge[] = [];
  let remainingPayments = 0;
  for (const line of cardLines) {
    const tx = allTransactions.find(t => t.id === line.transactionId);
    if (!tx) continue;
    if (line.signedAmount < 0) {
      charges.push({
        lineId: line.id, txId: tx.id, date: tx.date,
        description: tx.description ?? null,
        amount: Math.abs(line.signedAmount),
        paid: false,
        txType: tx.type,
        categoryId: tx.categoryId ?? null,
        budgetCycleId: tx.budgetCycleId ?? null,
      });
    } else {
      remainingPayments += line.signedAmount;
    }
  }
  for (const c of charges) {
    if (remainingPayments >= c.amount) {
      c.paid = true;
      remainingPayments -= c.amount;
    }
  }

  const unpaidCharges = charges.filter(c => !c.paid);
  const totalDebt = unpaidCharges.reduce((s, c) => s + c.amount, 0);

  // Compute debit available balance (account balance for debit cards).
  const accountBalance = allLines
    .filter(l => l.accountId === creditAccountId && postedTxIds.has(l.transactionId))
    .reduce((s, l) => s + l.signedAmount, 0);

  const utilizationPct = card.creditLimit != null && card.creditLimit > 0
    ? Math.min(100, Math.round((totalDebt / card.creditLimit) * 100))
    : null;

  const [visibleCycleCount, setVisibleCycleCount] = useState(1);

  const loadNextCycle = () => {
    setVisibleCycleCount(prev => prev + 1);
  };

  type CycleGroup = {
    groupId: string;
    cycleName: string;
    cycleDateRange: string;
    startDate: string;
    charges: Charge[];
  };

  const cycleMap = new Map<string, CycleGroup>();

  for (const c of charges) {
    const resolvedCycle = c.budgetCycleId ? allCycles.find(cy => cy.id === c.budgetCycleId) : null;
    const groupId = resolvedCycle ? resolvedCycle.id : 'uncategorized';
    if (!cycleMap.has(groupId)) {
      cycleMap.set(groupId, {
        groupId,
        cycleName: resolvedCycle?.name ?? 'Uncategorized',
        cycleDateRange: resolvedCycle ? formatDateRange(resolvedCycle.startDate, resolvedCycle.endDate) : '',
        startDate: resolvedCycle?.startDate ?? '0000-00-00',
        charges: [],
      });
    }
    cycleMap.get(groupId)!.charges.push(c);
  }

  const cycleGroups = [...cycleMap.values()]
    .filter(g => g.charges.length > 0)
    .sort((a, b) => {
      if (a.groupId === 'uncategorized') return 1;
      if (b.groupId === 'uncategorized') return -1;
      return b.startDate.localeCompare(a.startDate);
    });

  const openPayAll = () => {
    setPayAmount(Number(totalDebt.toFixed(2)));
    setPayLabel(`Pay all (EGP ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);
    setPayOpen(true);
  };

  const openPayOne = (charge: Charge) => {
    setPayAmount(Number(charge.amount.toFixed(2)));
    setPayLabel(`Pay ${charge.description ?? charge.txType} (EGP ${charge.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);
    setPayOpen(true);
  };

  const handlePay = async () => {
    if (payAmount === '' || payAmount <= 0) return;
    try {
      await payCard.mutateAsync({ householdId, card, amount: Number(payAmount) });
      setPayOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const formattedBalance = card.currency === 'USD'
    ? `$${Math.abs(accountBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${Math.abs(accountBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${card.currency}`;

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              overflow: 'hidden',
              p: 0,
            },
          },
        }}
      >
        {/* ── Card Header ──────────────────────────────────────────── */}
        <CardBackground bankId={card.bankId} kind={card.kind} tierId={card.tierId}>
          <Box
            sx={{
              filter: card.isActive ? 'none' : 'grayscale(0.7) brightness(0.7)',
              p: 2.5,
              pb: 3,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 1,
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                zIndex: 2,
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Top Row: Bank Logo */}
              <Stack direction="row" justifyContent="flex-end" sx={{ mr: 4 }}>
                <BankLogo bankId={card.bankId} kind={card.kind} />
              </Stack>

              {/* Middle Row: Chip + Contactless waves & tier */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                <CardChip />
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <TierLabel bankId={card.bankId} tierId={card.tierId} />
                  {!card.tierId && (
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#ffffff',
                        mr: 0.5,
                      }}
                    >
                      Debit
                    </Typography>
                  )}
                  <ContactlessIcon />
                </Stack>
              </Stack>

              {/* Card Number and Expiry */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5, mb: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    fontFamily: 'monospace',
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  •••• •••• {card.last4 ?? '----'}
                </Typography>

                {card.expiryMonth && card.expiryYear && (
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ opacity: 0.9 }}>
                    <Typography sx={{ fontSize: '7px', fontWeight: 700, color: '#ffffff', opacity: 0.7, mr: 0.25 }}>
                      THRU ▶
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        color: '#ffffff',
                      }}
                    >
                      {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                    </Typography>
                  </Stack>
                )}
              </Stack>

              {/* Bottom Row: Balance, Actions, and Network Logo */}
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                  <Box sx={{ flex: 1, mr: 2 }}>
                    {isCredit ? (
                      <>
                        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                          EGP {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography sx={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                          Outstanding Balance
                        </Typography>
                        {utilizationPct != null && (
                          <Box sx={{ mt: 1.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={utilizationPct}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(255,255,255,0.25)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: utilizationPct > 95 ? '#ef4444' : utilizationPct > 80 ? '#F9AB00' : '#4ade80',
                                  borderRadius: 3,
                                },
                              }}
                            />
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                              <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>
                                {utilizationPct}% utilized
                              </Typography>
                              {card.creditLimit != null && (
                                <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>
                                  Limit: {card.currency} {card.creditLimit.toLocaleString()}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        )}
                        <Button
                          variant="contained"
                          disabled={totalDebt <= 0}
                          onClick={openPayAll}
                          sx={{
                            mt: 2,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: '#ffffff',
                            fontWeight: 600,
                            px: 3,
                            borderRadius: '12px',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' },
                          }}
                        >
                          Pay all
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                          {formattedBalance}
                        </Typography>
                        <Typography sx={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                          Available Balance
                        </Typography>
                      </>
                    )}
                  </Box>
                  <NetworkLogo network={card.network} />
                </Stack>
              </Box>
            </Box>
          </Box>
        </CardBackground>

        {/* ── Activity Section ─────────────────────────────────────── */}
        <DialogContent sx={{ px: 3, pb: 3, pt: 2 }}>
          {cycleGroups.length === 0 ? (
            <EmptyLayout
              title="No charges yet"
              description="Transactions on this card will appear here grouped by cycle."
            />
          ) : (
            <Stack spacing={0} divider={<Divider />}>
              {cycleGroups.slice(0, visibleCycleCount).map((group) => {
                return (
                  <Box key={group.groupId}>
                    {/* Cycle group header */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {group.cycleName}
                        </Typography>
                        {group.cycleDateRange && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {group.cycleDateRange}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {group.charges.length} charge{group.charges.length !== 1 ? 's' : ''}
                      </Typography>
                    </Stack>

                    {/* Charges in this cycle */}
                    {group.charges.map((c) => {
                      const cat = c.categoryId ? categories.find(ct => ct.id === c.categoryId) : null;
                      const currency = card.currency;

                      return (
                        <Stack
                          key={c.lineId}
                          direction="row"
                          alignItems="flex-start"
                          spacing={1.5}
                          sx={{ py: 1 }}
                        >
                          {/* Transaction icon */}
                          <TransactionIcon type={c.txType} size={38} isCreditCard={card.kind === 'credit'} />

                          {/* Details */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                fontSize: '13.5px',
                                color: c.paid ? 'text.disabled' : 'text.primary',
                                textDecoration: c.paid ? 'line-through' : 'none',
                              }}
                            >
                              {cat?.name ?? c.txType}
                            </Typography>
                            {c.description && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '11px',
                                  mt: 0.25,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {c.description}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px', mt: 0.25, display: 'block' }}>
                              {c.date}
                            </Typography>
                          </Box>

                          {/* Amount + actions */}
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: 1 }}>
                            {c.paid ? (
                              <>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '13.5px',
                                    color: 'text.disabled',
                                    textDecoration: 'line-through',
                                  }}
                                >
                                  −{currency} {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Typography>
                                <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                              </>
                            ) : (
                              <>
                                <Typography
                                  variant="body1"
                                  sx={{ fontWeight: 700, fontSize: '13.5px', color: 'text.primary' }}
                                >
                                  −{currency} {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Typography>
                                {isCredit && (
                                  <Button
                                    size="small"
                                    onClick={() => openPayOne(c)}
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '11px',
                                      px: 1.5,
                                      borderRadius: '8px',
                                      minWidth: 'auto',
                                    }}
                                  >
                                    Pay
                                  </Button>
                                )}
                              </>
                            )}
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Box>
                );
              })}

              {/* Load next cycle */}
              {visibleCycleCount < cycleGroups.length && (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Button
                    size="small"
                    onClick={loadNextCycle}
                    sx={{
                      fontWeight: 600,
                      fontSize: '12px',
                      color: 'primary.main',
                      textTransform: 'none',
                      px: 2,
                    }}
                  >
                    Load previous cycle ({cycleGroups.length - visibleCycleCount} remaining)
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Pay Confirm Dialog ────────────────────────────────────── */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)}>
        <DialogTitle>{payLabel}</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Amount (EGP)"
            value={payAmount}
            onChange={e => setPayAmount(e.target.value ? Number(e.target.value) : '')}
            autoFocus
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={payCard.isPending} onClick={handlePay}>
            {payCard.isPending ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

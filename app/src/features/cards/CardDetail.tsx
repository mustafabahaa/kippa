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
} from '@/hooks/useFinance';
import type { Card } from '@/domain/financeTypes';

type Charge = {
  lineId: string;
  txId: string;
  date: string;
  description: string;
  amount: number; // positive
  paid: boolean;
};

const NETWORK_GRADIENTS: Record<string, string> = {
  visa: 'linear-gradient(135deg, #1a1f71 0%, #2d35a8 100%)',
  mastercard: 'linear-gradient(135deg, #0f766e 0%, #005c55 100%)',
  meeza: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
  other: 'linear-gradient(135deg, #495167 0%, #2d3344 100%)',
};

export function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { householdId } = useAppContext();
  const { data: allTransactions = [] } = useTransactions(householdId);
  const { data: allLines = [] } = useLedgerLines(householdId);
  const payCard = usePayCardMutation();

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
        description: tx.description ?? tx.type, amount: Math.abs(line.signedAmount),
        paid: false,
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

  const openPayAll = () => {
    setPayAmount(Number(totalDebt.toFixed(2)));
    setPayLabel(`Pay all (EGP ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);
    setPayOpen(true);
  };

  const openPayOne = (charge: Charge) => {
    setPayAmount(Number(charge.amount.toFixed(2)));
    setPayLabel(`Pay ${charge.description} (EGP ${charge.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);
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

  const gradient = NETWORK_GRADIENTS[card.network ?? 'other'];
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
        <Box
          sx={{
            background: card.isActive ? gradient : undefined,
            filter: card.isActive ? 'none' : 'grayscale(0.7) brightness(0.7)',
            p: 3,
            pb: 4,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Subtle dot pattern overlay */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.06,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              pointerEvents: 'none',
            }}
          />

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

          <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
              {card.kind.toUpperCase()} &bull; {card.network?.toUpperCase() ?? 'OTHER'}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '20px', color: '#fff', mt: 0.5 }}>
              {card.name}
            </Typography>

            <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, letterSpacing: '3px', fontFamily: 'monospace', color: '#fff', opacity: 0.9 }}>
                &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {card.last4 ?? '----'}
              </Typography>
              {card.expiryMonth && card.expiryYear && (
                <Typography sx={{ fontSize: '11px', color: '#fff', opacity: 0.6 }}>
                  Exp {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                </Typography>
              )}
            </Stack>

            {/* Balance / Debt */}
            <Box sx={{ mt: 2 }}>
              {isCredit ? (
                <>
                  <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    EGP {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
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
                          bgcolor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: utilizationPct > 95 ? '#ef4444' : utilizationPct > 80 ? '#F9AB00' : '#4ade80',
                            borderRadius: 3,
                          },
                        }}
                      />
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                        <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>
                          {utilizationPct}% utilized
                        </Typography>
                        {card.creditLimit != null && (
                          <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>
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
                      color: '#fff',
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
                  <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    {formattedBalance}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                    Available Balance
                  </Typography>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.6)' }}>
                        Total Spent
                      </Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        −EGP {charges.reduce((s, c) => s + c.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── Activity Section ─────────────────────────────────────── */}
        <DialogContent sx={{ px: 3, pb: 3, pt: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
            {isCredit ? 'Charges on this card' : 'Recent activity'}
          </Typography>

          {charges.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">No charges yet.</Typography>
            </Box>
          ) : (
            <Stack spacing={0}>
              {[...charges].reverse().map((c, idx) => (
                <Box key={c.lineId}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.5 }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color: c.paid ? 'text.disabled' : 'text.primary',
                          textDecoration: c.paid ? 'line-through' : 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.description}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                        {c.date}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: 2 }}>
                      {c.paid ? (
                        <>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: 'text.disabled',
                              textDecoration: 'line-through',
                            }}
                          >
                            −EGP {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        </>
                      ) : (
                        <>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 700, color: 'text.primary' }}
                          >
                            −EGP {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  {idx < charges.length - 1 && <Divider />}
                </Box>
              ))}
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

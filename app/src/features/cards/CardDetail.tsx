import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography,
  Box, Divider,
} from '@mui/material';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useTransactions, useLedgerLines, usePayCardMutation,
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
      // A purchase — queue it.
      charges.push({
        lineId: line.id, txId: tx.id, date: tx.date,
        description: tx.description ?? tx.type, amount: Math.abs(line.signedAmount),
        paid: false,
      });
    } else {
      // A payment — applies to oldest unpaid charges first.
      remainingPayments += line.signedAmount;
    }
  }
  // Mark oldest charges as paid until payments run out.
  for (const c of charges) {
    if (remainingPayments >= c.amount) {
      c.paid = true;
      remainingPayments -= c.amount;
    }
  }

  const unpaidCharges = charges.filter(c => !c.paid);
  const totalDebt = unpaidCharges.reduce((s, c) => s + c.amount, 0);

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

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{card.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Summary */}
          {isCredit ? (
            <Box>
              <Typography variant="body2" color="text.secondary">Outstanding debt</Typography>
              <Typography variant="h3">EGP {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
              <Button sx={{ mt: 1 }} variant="contained" disabled={totalDebt <= 0} onClick={openPayAll}>
                Pay all
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Debit card — purchases draw directly from the linked account.
            </Typography>
          )}

          <Divider />

          {/* Charges */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {isCredit ? 'Charges on this card' : 'Recent activity'}
            </Typography>
            {charges.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No charges yet.</Typography>
            ) : (
              <Stack spacing={1}>
                {[...charges].reverse().map(c => (
                  <Stack key={c.lineId} direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{
                        fontWeight: 500,
                        textDecoration: c.paid ? 'line-through' : 'none',
                        color: c.paid ? 'text.disabled' : 'text.primary',
                      }}>
                        {c.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{c.date}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        color: c.paid ? 'text.disabled' : 'error.main',
                        textDecoration: c.paid ? 'line-through' : 'none',
                      }}>
                        −EGP {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                      {isCredit && !c.paid && (
                        <Button size="small" onClick={() => openPayOne(c)}>Pay</Button>
                      )}
                      {c.paid && (
                        <Typography variant="caption" color="success.main">paid</Typography>
                      )}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Pay confirm */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)}>
        <DialogTitle>{payLabel}</DialogTitle>
        <DialogContent>
          <TextField type="number" label="Amount (EGP)" value={payAmount}
            onChange={e => setPayAmount(e.target.value ? Number(e.target.value) : '')} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={payCard.isPending} onClick={handlePay}>
            {payCard.isPending ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

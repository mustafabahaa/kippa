import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography,
  Box, Chip, IconButton, Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useCardStatements, useMarkAsPaidMutation, useTransactions, useLedgerLines,
} from '@/hooks/useFinance';
import { cardsLib } from '@/libs/cards';
import { dbLib } from '@/libs/db';
import { currentCyclePurchases } from '@/libs/cardSelectors';
import type { Card, CardStatement } from '@/domain/financeTypes';

export function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { householdId } = useAppContext();
  const { data: statements = [] } = useCardStatements(householdId, card.id);
  const { data: allTransactions = [] } = useTransactions(householdId);
  const { data: allLines = [] } = useLedgerLines(householdId);
  const markAsPaid = useMarkAsPaidMutation();

  const [logging, setLogging] = useState(false);
  const [stmtDate, setStmtDate] = useState('');
  const [stmtBalance, setStmtBalance] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');

  const lastStatement = statements[0] ?? null;

  // Charges on this card's credit account: posted outflows with their transaction detail.
  const postedTxIds = new Set(allTransactions.filter(t => t.status === 'posted').map(t => t.id));
  const cardCharges = allLines
    .filter(l => l.accountId === card.parentAccountId && postedTxIds.has(l.transactionId) && l.signedAmount < 0)
    .map(l => ({
      line: l,
      tx: allTransactions.find(t => t.id === l.transactionId),
    }))
    .filter(x => x.tx)
    .sort((a, b) => (b.tx!.date).localeCompare(a.tx!.date));

  const totalDebt = cardCharges.reduce((s, x) => s + Math.abs(x.line.signedAmount), 0);
  const cyclePurchases = lastStatement
    ? currentCyclePurchases(allLines, allTransactions, card.parentAccountId, lastStatement)
    : totalDebt;

  const handleLogStatement = async () => {
    if (!stmtDate || stmtBalance === '' || !dueDate) return;
    const id = crypto.randomUUID();
    const stmt: CardStatement = {
      id, householdId, cardId: card.id, creditAccountId: card.parentAccountId,
      statementDate: stmtDate, statementBalance: Number(stmtBalance),
      dueDate, status: 'pending', createdAt: new Date().toISOString(),
    };
    await dbLib.setDoc(householdId, 'cardStatements', id, stmt);
    setLogging(false); setStmtDate(''); setStmtBalance(''); setDueDate('');
  };

  const handleMarkPaid = async () => {
    if (!lastStatement || payAmount === '') return;
    try {
      await markAsPaid.mutateAsync({ householdId, statement: lastStatement, card, amount: Number(payAmount) });
      setPayOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openPay = () => {
    setPayAmount(lastStatement?.statementBalance ?? 0);
    setPayOpen(true);
  };

  const handleDelete = async (stmtId: string) => {
    try {
      await cardsLib.deleteStatement(householdId, stmtId);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const statusColor = { pending: 'warning', partial: 'info', paid: 'success' } as const;
  const isCredit = card.kind === 'credit';

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{card.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Summary header */}
          {isCredit ? (
            <Box>
              <Typography variant="body2" color="text.secondary">Current debt</Typography>
              <Typography variant="h3">EGP {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
              {lastStatement && (
                <Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Bill due {lastStatement.dueDate}: EGP {lastStatement.statementBalance.toLocaleString()}
                  </Typography>
                  <Chip size="small" color={statusColor[lastStatement.status]} label={lastStatement.status} />
                  <Button size="small" variant="contained" disabled={lastStatement.status === 'paid'} onClick={openPay}>
                    Mark as paid
                  </Button>
                </Stack>
              )}
              {!lastStatement && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No statement logged yet. Cycles since last statement: EGP {cyclePurchases.toLocaleString()}.
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Debit card — purchases draw directly from {card.parentAccountId}.
            </Typography>
          )}

          <Divider />

          {/* The actual charges */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {isCredit ? 'Charges on this card' : 'Recent activity'}
            </Typography>
            {cardCharges.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No charges yet.</Typography>
            ) : (
              <Stack spacing={1}>
                {cardCharges.map(({ line, tx }) => (
                  <Stack key={line.id} direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {tx!.description ?? tx!.type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tx!.date} • {tx!.categoryId ?? 'uncategorized'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                      −EGP {Math.abs(line.signedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>

          {/* Statement management */}
          {isCredit && (
            <>
              <Divider />
              <Button onClick={() => setLogging(s => !s)}>Log statement</Button>
              {logging && (
                <Stack spacing={1}>
                  <TextField type="date" label="Statement date" value={stmtDate}
                    onChange={e => setStmtDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField type="number" label="Statement balance (EGP)" value={stmtBalance}
                    onChange={e => setStmtBalance(e.target.value ? Number(e.target.value) : '')} />
                  <TextField type="date" label="Due date" value={dueDate}
                    onChange={e => setDueDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  <Button variant="contained" onClick={handleLogStatement}>Save statement</Button>
                </Stack>
              )}

              {statements.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Statements</Typography>
                  {statements.map(s => (
                    <Stack key={s.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                      <Box>
                        <Typography variant="body2">{s.statementDate} — EGP {s.statementBalance.toLocaleString()}</Typography>
                        <Chip size="small" color={statusColor[s.status]} label={s.status} />
                      </Box>
                      {s.status === 'pending' && (
                        <IconButton size="small" onClick={() => handleDelete(s.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Mark as paid confirm */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)}>
        <DialogTitle>Mark as paid</DialogTitle>
        <DialogContent>
          <TextField type="number" label="Amount (EGP)" value={payAmount}
            onChange={e => setPayAmount(e.target.value ? Number(e.target.value) : '')} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={markAsPaid.isPending} onClick={handleMarkPaid}>
            {markAsPaid.isPending ? 'Saving…' : 'Confirm payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

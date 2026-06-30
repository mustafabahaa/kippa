import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography,
  Box, Chip, IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppContext } from '@/hooks/useAppContext';
import { useCardStatements, useMarkAsPaidMutation } from '@/hooks/useFinance';
import { cardsLib } from '@/libs/cards';
import { dbLib } from '@/libs/db';
import type { Card, CardStatement } from '@/domain/financeTypes';

export function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { householdId } = useAppContext();
  const { data: statements = [] } = useCardStatements(householdId, card.id);
  const markAsPaid = useMarkAsPaidMutation();

  const [logging, setLogging] = useState(false);
  const [stmtDate, setStmtDate] = useState('');
  const [stmtBalance, setStmtBalance] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');

  const lastStatement = statements[0] ?? null;

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

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{card.name} — statements</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {lastStatement && (
            <Box>
              <Typography variant="body2" color="text.secondary">Last bill</Typography>
              <Typography variant="h3">EGP {lastStatement.statementBalance.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Due {lastStatement.dueDate}</Typography>
              <Button sx={{ mt: 1 }} variant="contained" disabled={lastStatement.status === 'paid'} onClick={openPay}>
                Mark as paid
              </Button>
            </Box>
          )}

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

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>History</Typography>
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

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Stack, Typography,
} from '@mui/material';
import { useAppContext } from '@/hooks/useAppContext';
import { useAccounts, useCreateDebitCardMutation, useCreateCreditCardMutation } from '@/hooks/useFinance';
import type { CardKind, CardNetwork, CurrencyCode } from '@/domain/financeTypes';

export function AddCardDialog({ open, preselectAccountId, onClose }: { open: boolean; preselectAccountId: string | null; onClose: () => void }) {
  return open ? (
    <AddCardDialogInner key={preselectAccountId ?? 'none'} preselectAccountId={preselectAccountId} onClose={onClose} />
  ) : null;
}

function AddCardDialogInner({ preselectAccountId, onClose }: { preselectAccountId: string | null; onClose: () => void }) {
  const { householdId } = useAppContext();
  const { data: accounts = [] } = useAccounts(householdId);
  const createDebit = useCreateDebitCardMutation();
  const createCredit = useCreateCreditCardMutation();

  const preAcc = preselectAccountId ? accounts.find(a => a.id === preselectAccountId) : undefined;
  const [kind, setKind] = useState<CardKind>('debit');
  const [name, setName] = useState('');
  const [last4, setLast4] = useState('');
  const [network, setNetwork] = useState<CardNetwork>('visa');
  const [expiryMonth, setExpiryMonth] = useState<number | ''>('');
  const [expiryYear, setExpiryYear] = useState<number | ''>('');
  const [currency, setCurrency] = useState<CurrencyCode>(preAcc?.currency ?? 'EGP');
  const [parentAccountId, setParentAccountId] = useState(preselectAccountId ?? '');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [paymentAccountId, setPaymentAccountId] = useState(preselectAccountId ?? '');
  const [error, setError] = useState('');

  const depositAccounts = accounts.filter(a => a.type === 'running' || a.type === 'savings');

  const handleSave = async () => {
    setError('');
    try {
      const base = {
        kind, name: name.trim(), last4: last4 || undefined,
        network, currency, isActive: true,
        expiryMonth: expiryMonth || undefined,
        expiryYear: expiryYear || undefined,
        parentAccountId: kind === 'debit' ? parentAccountId : '',
      } as any;
      if (kind === 'debit') {
        await createDebit.mutateAsync({ householdId, card: base, accounts });
      } else {
        if (creditLimit === '' || !paymentAccountId) throw new Error('Credit limit and payment account are required.');
        const nextOrder = accounts.length > 0 ? Math.max(...accounts.map(a => a.sortOrder)) + 1 : 1;
        await createCredit.mutateAsync({
          householdId,
          card: { ...base, creditLimit: Number(creditLimit), paymentAccountId },
          accounts, sortOrder: nextOrder,
        });
      }
      onClose();
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add a card</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Card type</InputLabel>
            <Select value={kind} label="Card type" onChange={e => setKind(e.target.value as CardKind)}>
              <MenuItem value="debit">Debit</MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{kind === 'debit' ? 'Draws from account' : 'Payment account (pays the bill)'}</InputLabel>
            <Select
              value={kind === 'debit' ? parentAccountId : paymentAccountId}
              label={kind === 'debit' ? 'Draws from account' : 'Payment account (pays the bill)'}
              onChange={e => {
                const id = e.target.value as string;
                const acc = accounts.find(a => a.id === id);
                if (kind === 'debit') setParentAccountId(id);
                else setPaymentAccountId(id);
                if (acc) setCurrency(acc.currency);
              }}
            >
              {depositAccounts.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.name} ({a.currency})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Card name" value={name} onChange={e => setName(e.target.value)} fullWidth />
          <TextField label="Last 4 digits" value={last4} onChange={e => setLast4(e.target.value.slice(0, 4))} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Network</InputLabel>
            <Select value={network} label="Network" onChange={e => setNetwork(e.target.value as CardNetwork)}>
              <MenuItem value="visa">Visa</MenuItem>
              <MenuItem value="mastercard">Mastercard</MenuItem>
              <MenuItem value="meeza">Meeza</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField label="Expiry month (1-12)" type="number" value={expiryMonth}
              onChange={e => setExpiryMonth(e.target.value ? Number(e.target.value) : '')} />
            <TextField label="Expiry year" type="number" value={expiryYear}
              onChange={e => setExpiryYear(e.target.value ? Number(e.target.value) : '')} />
          </Stack>

          {kind === 'credit' && (
            <TextField label="Credit limit" type="number" value={creditLimit}
              onChange={e => setCreditLimit(e.target.value ? Number(e.target.value) : '')} fullWidth />
          )}

          {error && <Typography color="error" variant="body2">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}
          disabled={!name.trim() || (kind === 'debit' ? !parentAccountId : !paymentAccountId)}>
          Save card
        </Button>
      </DialogActions>
    </Dialog>
  );
}

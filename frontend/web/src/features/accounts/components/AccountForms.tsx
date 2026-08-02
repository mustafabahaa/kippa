import { useState } from 'react';
import { Button, Card, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { Account, AccountType, CurrencyCode } from '@kippa/domain';
import { CurrencySelect } from '@/features/shared/components/CurrencySelect';

const TYPES: Array<{ label: string; value: AccountType }> = [{ label: 'Running Bank', value: 'running' }, { label: 'Savings Bank', value: 'savings' }, { label: 'Cash', value: 'cash' }, { label: 'Wallet', value: 'wallet' }];
function TypeSelect({ id, onChange, value }: { id: string; onChange: (value: AccountType) => void; value: AccountType }) { return <FormControl fullWidth><InputLabel id={id}>Account Type</InputLabel><Select labelId={id} value={value} label="Account Type" onChange={(event) => onChange(event.target.value as AccountType)}>{TYPES.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}</Select></FormControl>; }

export function AddAccountCard({ baseCurrency, busy, onCreate }: { baseCurrency: CurrencyCode; busy: boolean; onCreate: (draft: { name: string; type: AccountType; currency: CurrencyCode }) => Promise<void> }) {
  const [draft, setDraft] = useState({ name: '', type: 'running' as AccountType, currency: baseCurrency });
  const create = async () => { if (!draft.name.trim()) return; await onCreate({ ...draft, name: draft.name.trim() }); setDraft((current) => ({ ...current, name: '' })); };
  return <Card sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}><CardContent><Stack spacing={2.5}><div><Typography variant="h3">Add new account</Typography><Typography variant="body2" color="text.secondary">Connect cash, a wallet, or a bank balance.</Typography></div><TextField fullWidth label="Account Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /><TypeSelect id="acc-type-label" value={draft.type} onChange={(type) => setDraft({ ...draft, type })} /><CurrencySelect labelId="acc-currency-label" value={draft.currency} onChange={(currency) => setDraft({ ...draft, currency })} /><Button fullWidth variant="contained" onClick={create} loading={busy}>Create Account</Button></Stack></CardContent></Card>;
}

export function EditAccountDialog({ account, busy, onClose, onSave }: { account: Account; busy: boolean; onClose: () => void; onSave: (account: Account) => Promise<void> }) {
  const [draft, setDraft] = useState(account);
  return <Dialog open onClose={onClose}><DialogTitle>Edit Account</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><TextField fullWidth label="Account Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /><TypeSelect id="edit-acc-type-label" value={draft.type} onChange={(type) => setDraft({ ...draft, type })} /><CurrencySelect labelId="edit-acc-currency-label" value={draft.currency} onChange={(currency) => setDraft({ ...draft, currency })} /><FormControlLabel control={<Checkbox checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />} label="Account is Active" /></Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button onClick={() => onSave({ ...draft, name: draft.name.trim() })} variant="contained" loading={busy} disabled={!draft.name.trim()}>Save Changes</Button></DialogActions></Dialog>;
}

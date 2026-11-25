import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@monochrome-ui/design-system';
import type { Account, Category, PendingFinancialMessage } from '@kippa/domain';
import { Money } from '@/components/Money';
import { calculateCardPayment } from '@/libs/cardPayment';
import { DEFAULT_CARD_FEE_RATE } from '@/libs/creditCardFees';
import { PendingCategoryPicker } from './PendingCategoryPicker';
import { CheckCircleIcon, DeleteIcon } from '@/components/AppIcon';

type Props = {
  accountId: string;
  accounts: Account[];
  busy: boolean;
  categories: Category[];
  categoryId: string;
  destinationAccountId: string;
  destinationAccounts: Account[];
  item: PendingFinancialMessage | null;
  onAccountChange: (id: string) => void;
  onApprove: (edits: { amount?: number; note?: string }) => void;
  onCategoryChange: (id: string) => void;
  onClose: () => void;
  onDestinationChange: (id: string) => void;
  onDiscard: () => void;
  state: 'idle' | 'approving' | 'discarding' | 'settled';
  suggestedCategoryIds?: string[];
};

export function PendingReviewDialog(props: Props) {
  return props.item ? <PendingReviewForm key={props.item.id} {...props} item={props.item} /> : null;
}

function PendingReviewForm(props: Props & { item: PendingFinancialMessage }) {
  const {
    accountId,
    accounts,
    busy,
    categories,
    categoryId,
    destinationAccountId,
    destinationAccounts,
    item,
    onAccountChange,
    onApprove,
    onCategoryChange,
    onClose,
    onDestinationChange,
    onDiscard,
    state,
    suggestedCategoryIds = [],
  } = props;
  const [amountDraft, setAmountDraft] = useState(String(item.amount));
  const [editingAmount, setEditingAmount] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const amountEditor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!editingAmount || !amountEditor.current) return;
    const editor = amountEditor.current;
    editor.focus();
    window.getSelection()?.selectAllChildren(editor);
  }, [editingAmount]);
  const transfer = item.kind === 'transfer';
  const crossCurrency = !!item.destinationCurrency && item.destinationCurrency !== item.currency;
  const halfPending = !!item.transferLeg;
  const loanPayment = !!item.suggestedLoanId;
  const amount = Number(amountDraft);
  const validAmount = /^\d*\.?\d+$/.test(amountDraft.trim()) && amount > 0 && amount <= Number.MAX_SAFE_INTEGER;
  const creditCardPurchase =
    !transfer &&
    !loanPayment &&
    item.kind === 'expense' &&
    accounts.find((account) => account.id === accountId)?.type === 'credit' &&
    item.currency === 'EGP';
  const cardPayment = creditCardPurchase && validAmount ? calculateCardPayment(amount, DEFAULT_CARD_FEE_RATE) : null;
  const canApprove = validAmount && (transfer
    ? !halfPending && !!accountId && !!destinationAccountId
    : !!accountId && (loanPayment || !!categoryId));
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {transfer ? 'Review transfer' : `Review detected ${item.kind}`}
        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Nothing enters your ledger until you approve.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Box>
            <Stack direction="row" alignItems="baseline" gap={1} flexWrap="wrap">
              {editingAmount ? (
                <Stack direction="row" alignItems="baseline" gap={1} sx={{ minWidth: 0, maxWidth: '100%' }}>
                  <Typography component="span" variant="amountValue">{item.currency}</Typography>
                  <Typography
                    ref={amountEditor}
                    component="span"
                    variant="amountValue"
                    role="textbox"
                    aria-label={`Amount (${item.currency})`}
                    aria-invalid={!validAmount}
                    aria-disabled={busy}
                    inputMode="decimal"
                    contentEditable={busy ? false : 'plaintext-only'}
                    suppressContentEditableWarning
                    onInput={(event) => setAmountDraft(event.currentTarget.textContent ?? '')}
                    onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}
                    sx={{ minWidth: '1ch', overflowWrap: 'anywhere' }}
                  >
                    {String(item.amount)}
                  </Typography>
                </Stack>
              ) : loanPayment ? (
                <Typography variant="amountValue">
                  <Money amount={item.amount} code={item.currency} maxDigits={2} />
                </Typography>
              ) : (
                <ButtonBase aria-label="Edit amount" disabled={busy} onClick={() => setEditingAmount(true)}>
                  <Typography variant="amountValue">
                    <Money amount={item.amount} code={item.currency} maxDigits={2} />
                  </Typography>
                </ButtonBase>
              )}
              {transfer && crossCurrency && (
                <Typography variant="amountValue">
                  → <Money amount={item.destinationAmount ?? 0} code={item.destinationCurrency ?? item.currency} maxDigits={2} />
                </Typography>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {item.description}
            </Typography>
            {editingAmount && !validAmount && (
              <Typography variant="fieldHint" color="error">Enter a valid amount greater than zero.</Typography>
            )}
            {cardPayment?.valid && (
              <Stack spacing={0.5} sx={{ mt: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="sectionLabel" color="text.secondary">
                    Bank fee (3%)
                  </Typography>
                  <Typography variant="body2">
                    <Money amount={cardPayment.feeAmount} code={item.currency} maxDigits={2} />
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="sectionLabel" color="primary">
                    Total
                  </Typography>
                  <Typography variant="body2" color="primary">
                    <Money amount={cardPayment.totalAmount} code={item.currency} maxDigits={2} />
                  </Typography>
                </Stack>
              </Stack>
            )}
            {loanPayment && (
              <Chip
                color="success"
                label={`${item.suggestedLoanName ?? 'Loan'} · installment ${item.suggestedLoanInstallmentNumber}`}
                sx={{ mt: 1 }}
              />
            )}
            {halfPending && (
              <Typography variant="fieldHint" color="warning">
                Waiting for the other leg of this transfer…
              </Typography>
            )}
          </Box>
          <Divider />
          <Stack spacing={2}>
            {!transfer && !loanPayment && (
              <>
                {suggestedCategoryIds.length > 1 && (
                  <Box>
                    <Typography variant="sectionLabel" color="primary">
                      This merchant fits more than one — pick one
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
                      {suggestedCategoryIds.map((id) => {
                        const candidate = categories.find((category) => category.id === id);
                        if (!candidate) return null;
                        const picked = categoryId === id;
                        return (
                          <Chip
                            key={id}
                            label={candidate.name}
                            variant={picked ? 'filterSelected' : 'filter'}
                            onClick={() => onCategoryChange(id)}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                )}
                <PendingCategoryPicker
                  categories={categories}
                  categoryId={categoryId}
                  mode={item.kind === 'income' ? 'income' : 'expense'}
                  onChange={onCategoryChange}
                />
                {suggestedCategoryIds.length === 1 && categoryId === suggestedCategoryIds[0] && (
                  <Typography variant="fieldHint" color="primary" sx={{ mt: -0.5 }}>
                    Category auto-filled from this merchant — tap another to change it.
                  </Typography>
                )}
              </>
            )}
            <FormControl fullWidth>
              <InputLabel id="pending-account-label">
                {item.kind === 'income' ? 'To account' : 'From account'}
              </InputLabel>
              <Select
                size="medium"
                labelId="pending-account-label"
                value={accountId}
                label={item.kind === 'income' ? 'To account' : 'From account'}
                onChange={(event) => onAccountChange(event.target.value)}
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {transfer && (
              <FormControl fullWidth>
                <InputLabel id="pending-destination-label">To account</InputLabel>
                <Select
                  size="medium"
                  labelId="pending-destination-label"
                  value={destinationAccountId}
                  label="To account"
                  onChange={(event) => onDestinationChange(event.target.value)}
                >
                  {destinationAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
          <Divider />
          <Box>
            <Typography variant="sectionLabel" color="primary">
              Bank message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {item.messagePreview}
            </Typography>
          </Box>
          <TextField
            label="Note (optional)"
            helperText="Added after the description from the bank message."
            multiline
            minRows={2}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          color="inherit"
          loading={state === 'discarding'}
          startIcon={state === 'discarding' ? undefined : <DeleteIcon />}
          onClick={onDiscard}
          disabled={busy}
        >
          {state === 'discarding' ? null : 'Discard'}
        </Button>
        <Button
          variant="contained"
          loading={state === 'approving'}
          startIcon={state === 'approving' ? undefined : <CheckCircleIcon />}
          onClick={() => onApprove({
            amount: amount === item.amount ? undefined : amount,
            note: noteDraft.trim() || undefined,
          })}
          disabled={!canApprove || busy}
        >
          {state === 'approving' ? null : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

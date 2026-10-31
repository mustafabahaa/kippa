import { Box, Button, Fab, Paper, Typography } from '@monochrome-ui/design-system';
import { BackspaceIcon, CheckCircleIcon } from '@/components/AppIcon';

type Props = {
  activeDestination: boolean;
  amount: string;
  crossCurrency: boolean;
  destinationAmount: string;
  destinationCurrency: string;
  mode: 'expense' | 'income' | 'transfer';
  onDestinationFocus: () => void;
  onKeyPress: (key: string) => void;
  onSave: () => void;
  onSourceFocus: () => void;
  saving: boolean;
  sourceCurrency: string;
};
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

function formatEntryAmount(amount: string, currency: string) {
  const isEmpty = amount === '' || amount === '0';
  if (isEmpty) return { text: `${currency} 0.00`, isPlaceholder: true };

  const hasTrailingDecimal = amount.endsWith('.');
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return { text: `${currency} ${amount}`, isPlaceholder: false };

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasTrailingDecimal ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
  return {
    text: `${currency} ${formatted}${hasTrailingDecimal ? '.' : ''}`,
    isPlaceholder: false,
  };
}

export function EntryKeypad(props: Props) {
  const {
    activeDestination,
    amount,
    crossCurrency,
    destinationAmount,
    destinationCurrency,
    mode,
    onDestinationFocus,
    onKeyPress,
    onSave,
    onSourceFocus,
    saving,
    sourceCurrency,
  } = props;
  const sourceActive = !activeDestination || !crossCurrency;
  const source = Number(amount);
  const destination = Number(destinationAmount);
  const sourceDisplay = formatEntryAmount(amount, sourceCurrency);
  const destinationDisplay = formatEntryAmount(destinationAmount, destinationCurrency);
  const saveLabel = mode === 'expense' ? 'Save Expense' : mode === 'income' ? 'Save Income' : 'Save Transaction';
  return (
    <Box sx={{ order: 1, minWidth: 0 }}>
      <Paper
        onClick={onSourceFocus}
        variant={sourceActive ? 'amountPanel' : 'amountPanelInactive'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          mb: 1.5,
          cursor: crossCurrency ? 'pointer' : 'default',
        }}
      >
        <Typography
          aria-label={`${mode === 'transfer' ? 'Source amount' : 'Amount to log'}: ${sourceDisplay.text}`}
          color={sourceDisplay.isPlaceholder ? 'text.secondary' : 'inherit'}
          variant={sourceDisplay.isPlaceholder ? 'amountPlaceholder' : 'amountValue'}
        >
          {sourceDisplay.text}
        </Typography>
      </Paper>
      {crossCurrency && (
        <Paper
          onClick={onDestinationFocus}
          variant={activeDestination ? 'amountPanel' : 'amountPanelInactive'}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1.5, mb: 1.5, cursor: 'pointer' }}
        >
          <Typography
            aria-label={`Destination amount: ${destinationDisplay.text}`}
            color={destinationDisplay.isPlaceholder ? 'text.secondary' : 'inherit'}
            variant={destinationDisplay.isPlaceholder ? 'amountPlaceholder' : 'amountValue'}
          >
            {destinationDisplay.text}
          </Typography>
        </Paper>
      )}
      {crossCurrency && source > 0 && destination > 0 && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1.5 }}>
          Rate: 1 {sourceCurrency} = {(destination / source).toFixed(2)} {destinationCurrency}
        </Typography>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {KEYS.map((key) => (
          <Button
            key={key}
            aria-label={key === 'back' ? 'Delete last digit' : key}
            onClick={() => onKeyPress(key)}
            disableRipple
            fullWidth
            variant={key === 'back' ? 'keypadBack' : 'keypad'}
          >
            {key === 'back' ? <BackspaceIcon fontSize="small" /> : key}
          </Button>
        ))}
      </Box>
      <Fab
        variant="extended"
        color="primary"
        aria-label={saveLabel}
        onClick={onSave}
        disabled={saving}
        sx={{
          display: { xs: 'flex', lg: 'none' },
          position: 'fixed',
          right: 18,
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          zIndex: (theme) => theme.zIndex.appBar + 1,
          minWidth: 112,
          gap: 1,
        }}
      >
        <CheckCircleIcon fontSize="small" />
        {saving ? 'Saving…' : saveLabel}
      </Fab>
    </Box>
  );
}

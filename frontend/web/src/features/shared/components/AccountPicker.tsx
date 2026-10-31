import { Box, Card, CardActionArea, Typography } from '@mui/material';
import type { Account } from '@kippa/domain';
import { AccountBalanceIcon, CheckCircleIcon, PaymentsIcon, SavingsIcon } from '@/components/AppIcon';

type AccountPickerProps = {
  accounts: Account[];
  emptyMessage?: string;
  label: string;
  onSelect: (accountId: string) => void;
  selectedAccountId: string | null;
};

function AccountTypeIcon({ type }: { type: string }) {
  const normalizedType = type.toLowerCase();

  if (normalizedType === 'savings' || normalizedType === 'savings bank') {
    return <SavingsIcon fontSize="small" />;
  }
  if (normalizedType === 'cash' || normalizedType === 'wallet') {
    return <PaymentsIcon fontSize="small" />;
  }
  return <AccountBalanceIcon fontSize="small" />;
}

export function AccountPicker({ accounts, emptyMessage, label, onSelect, selectedAccountId }: AccountPickerProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="sectionLabel">{label}</Typography>
        {!selectedAccountId && accounts.length > 0 && (
          <Typography variant="fieldHint" color="error">
            Tap to select
          </Typography>
        )}
      </Box>

      {accounts.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {accounts.map((account) => {
            const isSelected = selectedAccountId === account.id;
            return (
              <Card
                key={account.id}
                variant={isSelected ? 'selectableSelected' : 'selectable'}
                sx={{
                  flex: '1 1 calc(50% - 6px)',
                  minWidth: 0,
                }}
              >
                <CardActionArea
                  onClick={() => onSelect(account.id)}
                  aria-pressed={isSelected}
                  sx={{ p: 1.5, height: '100%' }}
                >
                  <Box display="flex" alignItems="center" gap={1} sx={{ width: '100%', mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <AccountTypeIcon type={account.type} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {account.type}
                    </Typography>
                    {isSelected && <CheckCircleIcon fontSize="small" sx={{ ml: 'auto' }} />}
                  </Box>
                  <Typography
                    variant="sectionLabel"
                    color={isSelected ? 'primary' : 'text.primary'}
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                    }}
                  >
                    {account.name}
                  </Typography>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );
}

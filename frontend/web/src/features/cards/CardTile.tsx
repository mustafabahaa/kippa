import { Box, Typography, Stack, IconButton, LinearProgress } from '@monochrome-ui/design-system';
import { AcUnitIcon, EditIcon } from '@/components/AppIcon';
import type { Card } from '@kippa/domain';
import type { CardSummary } from '@/libs/cardSelectors';
import { Money } from '@/components/Money';
import { useFormattedMoney } from '@/hooks/useFormattedMoney';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { BankLogo, NetworkLogo, CardBackground, CardChip, ContactlessIcon, TierLabel } from './CardDesign';

export function CardTile({
  card,
  summary,
  parentAccountBalance,
  onFreeze,
  onEdit,
  onOpenDetail,
}: {
  card: Card;
  summary?: CardSummary;
  parentAccountBalance?: number;
  onFreeze?: () => void;
  onEdit?: () => void;
  onOpenDetail?: () => void;
}) {
  const isCredit = card.kind === 'credit';
  const formatMoney = useFormattedMoney();
  const { maskText } = usePrivacyMask();
  const formattedBalance = parentAccountBalance != null ? formatMoney(parentAccountBalance, card.currency, 2) : null;

  return (
    <CardBackground
      bankId={card.bankId}
      kind={card.kind}
      inactive={!card.isActive}
      clickable={Boolean(onOpenDetail)}
      onClick={onOpenDetail}
      sx={{
        cursor: onOpenDetail ? 'pointer' : 'default',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: { xs: '1 1 100%', sm: '1 1 280px' },
        maxWidth: { xs: '100%', sm: 340 },
        boxSizing: 'border-box',
      }}
    >
      {!card.isActive && (
        <Box sx={{ position: 'absolute', top: 14, right: 16, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <AcUnitIcon variant="Linear" fontSize="small" />
          <Typography variant="sectionSubtitle">Frozen</Typography>
        </Box>
      )}

      <Box sx={{ p: 2.5, pb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <BankLogo bankId={card.bankId} kind={card.kind} />
          <Typography variant="sectionSubtitle">{isCredit ? 'Credit' : 'Debit'}</Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
          <CardChip />
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <TierLabel bankId={card.bankId} tierId={card.tierId} />
            <ContactlessIcon />
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25, mb: 1.5 }}>
          <Typography variant="cardNumber">•••• •••• •••• {maskText(card.last4 ?? '----')}</Typography>
          {card.expiryMonth && card.expiryYear && (
            <Typography variant="sectionSubtitle">
              {maskText(`${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`)}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            {isCredit && summary ? (
              <>
                <Typography variant="cardAmount" component="div">
                  <Money amount={summary.currentDebt} code={card.currency} maxDigits={2} />
                </Typography>
                <Typography variant="sectionSubtitle">Outstanding</Typography>
                {summary.nextDueDate && <Typography variant="sectionSubtitle">Due {summary.nextDueDate}</Typography>}
                {summary.utilization != null && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, summary.utilization * 100))}
                    className="bank-card-utilization"
                  />
                )}
              </>
            ) : formattedBalance ? (
              <>
                <Typography variant="cardAmount" component="div">
                  {formattedBalance}
                </Typography>
                <Typography variant="sectionSubtitle">Available balance</Typography>
              </>
            ) : null}
          </Box>
          <Stack alignItems="flex-end" spacing={1} sx={{ flexShrink: 0, ml: 2 }}>
            <NetworkLogo network={card.network} />
          </Stack>
        </Stack>

        {(onFreeze || onEdit) && (
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="flex-end"
            sx={{ position: 'absolute', right: 8, bottom: 8 }}
            onClick={(event) => event.stopPropagation()}
          >
            {onFreeze && (
              <IconButton size="small" aria-label={card.isActive ? 'Freeze card' : 'Unfreeze card'} onClick={onFreeze}>
                <AcUnitIcon variant="Linear" fontSize="small" />
              </IconButton>
            )}
            {onEdit && (
              <IconButton size="small" aria-label="Edit card" onClick={onEdit}>
                <EditIcon variant="Linear" fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )}
      </Box>
    </CardBackground>
  );
}

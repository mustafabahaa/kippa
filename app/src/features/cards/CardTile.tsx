import { Box, Typography, LinearProgress, Stack, IconButton, Chip } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import EditIcon from '@mui/icons-material/Edit';
import type { Card } from '@/domain/financeTypes';
import type { CardSummary } from '@/libs/cardSelectors';
import { HsbcLionBackground, HsbcLogo, CardChip, CardBrandLogo, ContactlessIcon } from './HsbcCardDesign';

const NETWORK_GRADIENTS: Record<string, string> = {
  visa: 'linear-gradient(135deg, #1a1f71 0%, #2d35a8 100%)',
  mastercard: 'linear-gradient(135deg, #0f766e 0%, #005c55 100%)',
  meeza: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
  other: 'linear-gradient(135deg, #495167 0%, #2d3344 100%)',
};

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
  const gradient = NETWORK_GRADIENTS[card.network ?? 'other'];
  const utilizationPct = summary?.utilization != null ? Math.round(summary.utilization * 100) : null;
  const barColor = utilizationPct == null ? 'primary' : utilizationPct > 95 ? 'error' : utilizationPct > 80 ? 'warning' : 'success';
  const isCredit = card.kind === 'credit';

  const formattedBalance = parentAccountBalance != null ? (
    card.currency === 'USD'
      ? `$${parentAccountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${parentAccountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${card.currency}`
  ) : null;

  const isHsbc = card.name.toLowerCase().includes('hsbc');
  const hsbcKind = card.kind;
  const hsbcBackground = hsbcKind === 'credit'
    ? 'linear-gradient(135deg, #7A0A10 0%, #4A0205 60%, #200002 100%)'
    : 'linear-gradient(135deg, #0e1635 0%, #1b213b 30%, #12141a 60%, #0b0c10 100%)';

  if (isHsbc) {
    return (
      <Box
        onClick={onOpenDetail}
        sx={{
          background: card.isActive ? hsbcBackground : undefined,
          filter: card.isActive ? 'none' : 'grayscale(0.7) brightness(0.7)',
          borderRadius: '20px',
          p: 2.5,
          color: '#fff',
          cursor: onOpenDetail ? 'pointer' : 'default',
          minHeight: isCredit ? 180 : 170,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          border: card.isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid',
          borderColor: card.isActive ? undefined : 'divider',
          flex: { xs: '1 1 100%', sm: '1 1 280px' },
          maxWidth: { xs: '100%', sm: 340 },
          boxSizing: 'border-box',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          overflow: 'hidden',
          '&:hover': onOpenDetail ? {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          } : {},
        }}
      >
        <HsbcLionBackground kind={hsbcKind} />

        {!card.isActive && (
          <Chip
            icon={<AcUnitIcon sx={{ fontSize: 14 }} />}
            label="Frozen"
            size="small"
            sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', zIndex: 2 }}
          />
        )}

        <Stack direction="row" justifyContent="flex-end" sx={{ position: 'relative', zIndex: 1 }}>
          <HsbcLogo kind={hsbcKind} />
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1, position: 'relative', zIndex: 1 }}>
          <CardChip />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {hsbcKind === 'credit' && (
              <Typography
                sx={{
                  fontFamily: '"Outfit", "Inter", sans-serif',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: '#ffffff',
                  opacity: 0.6,
                  letterSpacing: '0.5px',
                }}
              >
                platinum
              </Typography>
            )}
            {hsbcKind === 'debit' && (
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffffff',
                  mr: 0.5,
                }}
              >
                Debit
              </Typography>
            )}
            <ContactlessIcon />
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5, mb: 0.5, position: 'relative', zIndex: 1 }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '2px',
              fontFamily: 'monospace',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            •••• •••• {card.last4 ?? '----'}
          </Typography>

          {card.expiryMonth && card.expiryYear && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ opacity: 0.9 }}>
              <Typography sx={{ fontSize: '7px', fontWeight: 700, color: '#ffffff', opacity: 0.7, mr: 0.25 }}>
                THRU ▶
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  color: '#ffffff',
                }}
              >
                {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Box sx={{ mt: 'auto', position: 'relative', zIndex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
            <Box sx={{ flex: 1, mr: 2 }}>
              {isCredit && summary && (
                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1, color: '#ffffff' }}>
                    {card.currency === 'USD' ? '$' : ''}{summary.currentDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {card.currency !== 'USD' ? card.currency : ''}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#ffffff', opacity: 0.7 }}>
                      Outstanding
                    </Typography>
                    {summary.nextDueDate && (
                      <Typography sx={{ fontSize: '9px', fontWeight: 600, color: '#ffffff', opacity: 0.8 }}>
                        Due {summary.nextDueDate}
                      </Typography>
                    )}
                  </Stack>
                  {utilizationPct != null && (
                    <Box sx={{ mt: 0.5 }}>
                      <LinearProgress
                        color={barColor as any}
                        variant="determinate"
                        value={Math.min(100, utilizationPct)}
                        sx={{
                          height: 5,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(255,255,255,0.25)',
                        }}
                      />
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.25 }}>
                        <Typography sx={{ fontSize: '8px', color: '#ffffff', opacity: 0.7 }}>
                          {utilizationPct}% utilized
                        </Typography>
                        {card.creditLimit != null && (
                          <Typography sx={{ fontSize: '8px', color: '#ffffff', opacity: 0.7 }}>
                            Limit: {card.currency} {card.creditLimit.toLocaleString()}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}

              {!isCredit && formattedBalance && (
                <Stack spacing={0.25}>
                  <Typography sx={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1, color: '#ffffff' }}>
                    {formattedBalance}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#ffffff', opacity: 0.7 }}>
                    Available Balance
                  </Typography>
                </Stack>
              )}
            </Box>

            <CardBrandLogo kind={hsbcKind} />
          </Stack>

          {(onFreeze || onEdit) && (
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }} onClick={e => e.stopPropagation()}>
              {onFreeze && (
                <IconButton
                  size="small"
                  onClick={onFreeze}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                  }}
                >
                  <AcUnitIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )}
              {onEdit && (
                <IconButton
                  size="small"
                  onClick={onEdit}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                  }}
                >
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      onClick={onOpenDetail}
      sx={{
        background: card.isActive ? gradient : undefined,
        filter: card.isActive ? 'none' : 'grayscale(0.7) brightness(0.7)',
        borderRadius: '20px',
        p: 2.5,
        color: card.isActive ? '#fff' : 'text.primary',
        cursor: onOpenDetail ? 'pointer' : 'default',
        minHeight: isCredit ? 200 : 190,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        border: card.isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid',
        borderColor: card.isActive ? undefined : 'divider',
        flex: '1 1 280px',
        maxWidth: { xs: '100%', sm: 340 },
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': onOpenDetail ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        } : {},
      }}
    >
      {!card.isActive && (
        <Chip
          icon={<AcUnitIcon sx={{ fontSize: 14 }} />}
          label="Frozen"
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
        />
      )}
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '18px', lineHeight: 1.2, color: 'inherit' }}>
          {card.name}
        </Typography>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, mt: 0.5, letterSpacing: '0.5px', color: 'inherit', opacity: 0.8 }}>
          {card.kind.toUpperCase()} • {card.network?.toUpperCase() ?? 'OTHER'}
        </Typography>
      </Box>

      <Box sx={{ mt: isCredit ? 2 : 3, mb: isCredit ? 2 : 1 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700, letterSpacing: '3px', fontFamily: 'monospace', color: 'inherit' }}>
          •••• •••• •••• {card.last4 ?? '----'}
        </Typography>
        {card.expiryMonth && card.expiryYear && (
          <Typography sx={{ fontSize: '11px', mt: 0.5, color: 'inherit', opacity: 0.75 }}>
            Expires {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
          </Typography>
        )}
      </Box>

      <Box sx={{ mt: 'auto' }}>
        {isCredit && summary && (
          <Stack spacing={0.5} sx={{ mb: (onFreeze || onEdit) ? 1.5 : 0 }}>
            <Typography sx={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, color: 'inherit' }}>
              {card.currency === 'USD' ? '$' : ''}{summary.currentDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {card.currency !== 'USD' ? card.currency : ''}
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'inherit', opacity: 0.65 }}>
                Outstanding Balance
              </Typography>
              {summary.nextDueDate && (
                <Typography sx={{ fontSize: '10px', fontWeight: 600, color: 'inherit', opacity: 0.8 }}>
                  Due {summary.nextDueDate}
                </Typography>
              )}
            </Stack>
            {utilizationPct != null && (
              <Box sx={{ mt: 0.5 }}>
                <LinearProgress
                  color={barColor as any}
                  variant="determinate"
                  value={Math.min(100, utilizationPct)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.2)',
                  }}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography sx={{ fontSize: '9px', color: 'inherit', opacity: 0.6 }}>
                    {utilizationPct}% utilized
                  </Typography>
                  {card.creditLimit != null && (
                    <Typography sx={{ fontSize: '9px', color: 'inherit', opacity: 0.6 }}>
                      Limit: {card.currency} {card.creditLimit.toLocaleString()}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        )}

        {!isCredit && formattedBalance && (
          <Stack spacing={0.25} sx={{ mb: (onFreeze || onEdit) ? 1.5 : 0 }}>
            <Typography sx={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, color: 'inherit' }}>
              {formattedBalance}
            </Typography>
            <Typography sx={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'inherit', opacity: 0.65 }}>
              Available Balance
            </Typography>
          </Stack>
        )}

        {(onFreeze || onEdit) && (
          <Stack direction="row" spacing={1} justifyContent="flex-end" onClick={e => e.stopPropagation()}>
            {onFreeze && (
              <IconButton
                size="small"
                onClick={onFreeze}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <AcUnitIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            {onEdit && (
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

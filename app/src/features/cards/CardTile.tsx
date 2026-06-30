import { Box, Typography, LinearProgress, Stack, IconButton, Chip } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import EditIcon from '@mui/icons-material/Edit';
import type { Card } from '@/domain/financeTypes';
import type { CardSummary } from '@/libs/cardSelectors';

const NETWORK_GRADIENTS: Record<string, string> = {
  visa: 'linear-gradient(135deg, #1a1f71 0%, #2d35a8 100%)',
  mastercard: 'linear-gradient(135deg, #0f766e 0%, #005c55 100%)',
  meeza: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
  other: 'linear-gradient(135deg, #495167 0%, #2d3344 100%)',
};

export function CardTile({
  card,
  summary,
  onFreeze,
  onEdit,
  onOpenDetail,
}: {
  card: Card;
  summary?: CardSummary;
  onFreeze?: () => void;
  onEdit?: () => void;
  onOpenDetail?: () => void;
}) {
  const gradient = NETWORK_GRADIENTS[card.network ?? 'other'];
  const utilizationPct = summary?.utilization != null ? Math.round(summary.utilization * 100) : null;
  const barColor = utilizationPct == null ? 'primary' : utilizationPct > 95 ? 'error' : utilizationPct > 80 ? 'warning' : 'success';

  return (
    <Box
      onClick={onOpenDetail}
      sx={{
        background: card.isActive ? gradient : undefined,
        filter: card.isActive ? 'none' : 'grayscale(0.7) brightness(0.7)',
        borderRadius: '20px',
        p: 2,
        color: '#fff',
        cursor: onOpenDetail ? 'pointer' : 'default',
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {!card.isActive && (
        <Chip
          icon={<AcUnitIcon sx={{ fontSize: 14, color: '#fff' }} />}
          label="Frozen"
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}
        />
      )}
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{card.name}</Typography>
        <Typography sx={{ fontSize: 13, opacity: 0.85 }}>{card.kind.toUpperCase()}</Typography>
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            •••• {card.last4 ?? '----'}
          </Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.8 }}>
            {card.network?.toUpperCase() ?? ''}
            {card.expiryMonth && card.expiryYear
              ? `  ${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`
              : ''}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          {summary && (
            <>
              {card.kind === 'credit' && (
                <Typography sx={{ fontSize: 12, opacity: 0.85 }}>
                  {`EGP ${summary.currentDebt.toLocaleString()} owed`}
                </Typography>
              )}
              {card.kind === 'credit' && utilizationPct != null && (
                <LinearProgress
                  color={barColor as any}
                  variant="determinate"
                  value={Math.min(100, utilizationPct)}
                  sx={{ width: 120, bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              )}
              {summary.nextDueDate && (
                <Typography sx={{ fontSize: 10, opacity: 0.8 }}>Due {summary.nextDueDate}</Typography>
              )}
            </>
          )}
        </Stack>
      </Stack>
      {(onFreeze || onEdit) && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }} onClick={e => e.stopPropagation()}>
          {onFreeze && (
            <IconButton size="small" onClick={onFreeze} sx={{ color: '#fff' }}>
              <AcUnitIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          {onEdit && (
            <IconButton size="small" onClick={onEdit} sx={{ color: '#fff' }}>
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Stack>
      )}
    </Box>
  );
}

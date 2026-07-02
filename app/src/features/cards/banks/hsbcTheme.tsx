import { Box, Typography, Stack } from '@mui/material';
import type { CardKind } from '@/domain/financeTypes';

export const HSBC_GRADIENT_CREDIT = 'linear-gradient(135deg, #7A0A10 0%, #4A0205 60%, #200002 100%)';
export const HSBC_GRADIENT_DEBIT = 'linear-gradient(135deg, #0e1635 0%, #1b213b 30%, #12141a 60%, #0b0c10 100%)';

// 37 Triangles forming the low-poly lion face and extending to the right edge of the card (aspect ratio 1.6)
const triangles: { points: string; type: 'light' | 'dark'; opacity: number }[] = [
  // Nose & muzzle
  { points: '10,44 18,32 24,30', type: 'light', opacity: 0.15 },
  { points: '18,32 28,20 24,30', type: 'light', opacity: 0.22 },
  { points: '28,20 42,14 50,24', type: 'light', opacity: 0.18 },
  { points: '42,14 55,10 50,24', type: 'light', opacity: 0.12 },
  { points: '55,10 58,8 50,24', type: 'dark', opacity: 0.12 },
  { points: '28,20 24,30 50,24', type: 'dark', opacity: 0.08 },
  { points: '24,30 36,32 50,24', type: 'light', opacity: 0.16 },
  { points: '24,30 34,46 28,58', type: 'dark', opacity: 0.15 },
  { points: '24,30 36,32 34,46', type: 'dark', opacity: 0.20 },
  { points: '10,44 24,30 34,46', type: 'light', opacity: 0.08 },
  { points: '10,44 12,50 34,46', type: 'dark', opacity: 0.12 },
  { points: '12,50 14,58 28,58', type: 'light', opacity: 0.14 },
  { points: '34,46 12,50 28,58', type: 'dark', opacity: 0.25 },
  { points: '34,46 28,58 32,70', type: 'dark', opacity: 0.18 },
  { points: '28,58 18,80 32,70', type: 'dark', opacity: 0.10 },

  // Mane front
  { points: '50,24 68,22 72,42', type: 'light', opacity: 0.10 },
  { points: '36,32 50,24 72,42', type: 'light', opacity: 0.14 },
  { points: '36,32 34,46 72,42', type: 'dark', opacity: 0.06 },
  { points: '34,46 68,62 72,42', type: 'dark', opacity: 0.08 },
  { points: '34,46 32,70 68,62', type: 'dark', opacity: 0.12 },
  { points: '32,70 52,78 68,62', type: 'dark', opacity: 0.15 },
  { points: '32,70 18,80 52,78', type: 'light', opacity: 0.08 },

  // Mane middle
  { points: '58,8 68,22 82,18', type: 'light', opacity: 0.16 },
  { points: '68,22 72,42 82,18', type: 'light', opacity: 0.12 },
  { points: '72,42 68,62 88,40', type: 'dark', opacity: 0.05 },
  { points: '68,62 52,78 82,68', type: 'dark', opacity: 0.10 },
  { points: '52,78 68,86 82,68', type: 'dark', opacity: 0.16 },
  { points: '82,18 72,42 88,40', type: 'light', opacity: 0.08 },
  { points: '88,40 68,62 82,68', type: 'dark', opacity: 0.08 },
  { points: '82,68 52,78 68,86', type: 'dark', opacity: 0.12 },

  // Background facets extending to right edge (160)
  { points: '82,18 110,0 160,0', type: 'light', opacity: 0.04 },
  { points: '82,18 88,40 110,0', type: 'light', opacity: 0.03 },
  { points: '88,40 110,0 160,50', type: 'dark', opacity: 0.03 },
  { points: '88,40 82,68 160,50', type: 'dark', opacity: 0.04 },
  { points: '82,68 68,86 110,100', type: 'dark', opacity: 0.05 },
  { points: '82,68 110,100 160,100', type: 'dark', opacity: 0.06 },
  { points: '82,68 160,50 160,100', type: 'dark', opacity: 0.05 },
];

export function HsbcLionBackground({ kind = 'credit' }: { kind?: CardKind }) {
  const isCredit = kind === 'credit';
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: { xs: '100%', sm: '360px' }, // Limit width on wide containers like dialog headers
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 160 100"
        width="100%"
        height="100%"
        preserveAspectRatio="xMinYMid slice" // Maintain uniform scaling without stretching
        style={{ display: 'block' }}
      >
        {triangles.map((t, idx) => {
          const fill = isCredit
            ? (t.type === 'light' ? '#ffffff' : '#000000')
            : (t.type === 'light' ? '#5c7df2' : '#080c21');
          const opacity = isCredit
            ? t.opacity
            : (t.type === 'light' ? Math.min(0.9, t.opacity * 2.2) : Math.min(0.9, t.opacity * 1.5));
          return (
            <polygon
              key={idx}
              points={t.points}
              fill={fill}
              fillOpacity={opacity}
            />
          );
        })}
      </svg>
    </Box>
  );
}

export function HsbcEmblem({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 86.6" style={{ width: size, height: size * 0.866, flexShrink: 0 }}>
      <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3" fill="#ffffff" />
      <polygon points="0,43.3 25,0 50,43.3 25,86.6" fill="#db0011" />
      <polygon points="100,43.3 75,0 50,43.3 75,86.6" fill="#db0011" />
    </svg>
  );
}

export function HsbcLogo({ kind }: { kind: CardKind }) {
  const isCredit = kind === 'credit';
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <HsbcEmblem size={28} />
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <Typography
          sx={{
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 800,
            fontSize: '15px',
            color: '#ffffff',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          HSBC
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
            fontWeight: 300,
            fontSize: '13px',
            color: '#ffffff',
            opacity: 0.9,
            letterSpacing: '0.2px',
          }}
        >
          {isCredit ? 'Advance' : 'Premier'}
        </Typography>
      </Box>
    </Stack>
  );
}

// Bank-neutral generic components, re-exported by a later CardDesign.tsx
export function CardChip() {
  return (
    <Box sx={{ position: 'relative', width: 44, height: 32, flexShrink: 0 }}>
      {/* Arrow left */}
      <svg viewBox="0 0 10 16" width="6" height="10" style={{ position: 'absolute', left: -10, top: 11 }}>
        <polygon points="10,0 0,8 10,16" fill="#ffffff" />
      </svg>
      {/* Metallic Chip Body */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #e4e4e7 0%, #b4b4b8 50%, #8e8e93 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.2)',
          border: '0.8px solid rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg viewBox="0 0 44 32" width="100%" height="100%">
          <rect x="0" y="0" width="44" height="32" rx="6" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
          <path
            d="M 9 0 L 9 32 M 35 0 L 35 32 M 0 11 L 9 11 M 35 11 L 44 11 M 0 21 L 9 21 M 35 21 L 44 21 M 9 16 L 35 16 M 22 0 L 22 11 M 22 21 L 22 32"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.8"
            fill="none"
          />
          <rect x="15" y="9" width="14" height="14" rx="2" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
        </svg>
      </Box>
    </Box>
  );
}

export function ContactlessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ opacity: 0.8 }}
    >
      <path d="M 5 8 A 6 6 0 0 1 5 16" opacity="0.3" />
      <path d="M 9 6 A 10 10 0 0 1 9 18" opacity="0.5" />
      <path d="M 13 4 A 14 14 0 0 1 13 20" opacity="0.7" />
      <path d="M 17 2 A 18 18 0 0 1 17 22" />
    </svg>
  );
}

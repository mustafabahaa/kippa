import type { FC } from 'react';
import { Box } from '@mui/material';
import { HSBC_GRADIENT_CREDIT, HSBC_GRADIENT_DEBIT } from './hsbcTheme';

/**
 * Bank card backgrounds: universal tier gradients + per-bank brand gradients,
 * plus subtle full-card SVG pattern overlays per bank.
 *
 * `tierGradient(tierId, bankId)` resolves which CSS gradient to paint:
 *  1. Universal tier gradient (gold/platinum/titanium/...) overrides brand color.
 *  2. HSBC special tiers (premier/advance) keep their existing HSBC gradients.
 *  3. Otherwise fall back to the bank's dark brand-color gradient.
 *
 * `BANK_PATTERNS` maps bankId -> a subtle full-card overlay component (or null).
 */

// ---------------------------------------------------------------------------
// Universal tier gradients (apply to any bank)
// ---------------------------------------------------------------------------
const TIER_GRADIENTS: Record<string, string> = {
  gold: 'linear-gradient(135deg, #8B6914 0%, #B8860B 30%, #D4AF37 60%, #F5E6A8 100%)',
  platinum: 'linear-gradient(135deg, #6A6A75 0%, #8A8A95 30%, #C0C0C8 60%, #E8E8F0 100%)',
  titanium: 'linear-gradient(135deg, #1A1A1E 0%, #2A2A2E 50%, #3A3A40 100%)',
  world: 'linear-gradient(135deg, #0D0D2E 0%, #1A1A4E 50%, #2E2E6E 100%)',
  signature: 'linear-gradient(135deg, #000000 0%, #0D0D0D 50%, #1A1A1A 100%)',
  infinite: 'linear-gradient(135deg, #000000 0%, #050505 60%, #0A0A0A 100%)',
  black: 'linear-gradient(135deg, #000000 0%, #0A0A0A 60%, #1A1A1A 100%)',
};

// ---------------------------------------------------------------------------
// Bank default brand-color gradients (used when no tier override applies)
// ---------------------------------------------------------------------------
const BANK_DEFAULT_GRADIENT: Record<string, string> = {
  hsbc: HSBC_GRADIENT_DEBIT,
  cib: 'linear-gradient(135deg, #0B2D4A 0%, #1F4F7A 100%)',
  nbe: 'linear-gradient(135deg, #143A17 0%, #2E7D32 100%)',
  'banque-misr': 'linear-gradient(135deg, #5A1212 0%, #C62828 100%)',
  qnb: 'linear-gradient(135deg, #2A1240 0%, #5B2C83 100%)',
  'arab-bank': 'linear-gradient(135deg, #0B3A66 0%, #1976D2 100%)',
  adcb: 'linear-gradient(135deg, #5A1212 0%, #D32F2F 100%)',
  aaib: 'linear-gradient(135deg, #0A2E5C 0%, #1565C0 100%)',
  fabmisr: 'linear-gradient(135deg, #300D44 0%, #6A1B9A 100%)',
  egbank: 'linear-gradient(135deg, #00332C 0%, #00695C 100%)',
  other: 'linear-gradient(135deg, #2A2E3A 0%, #495167 100%)',
};

// ---------------------------------------------------------------------------
// tierGradient
// ---------------------------------------------------------------------------
export function tierGradient(tierId: string | undefined, bankId: string): string {
  // 1. Universal tier gradient
  if (tierId && TIER_GRADIENTS[tierId]) {
    return TIER_GRADIENTS[tierId];
  }

  // 2. HSBC special tiers keep existing HSBC gradients
  if (bankId === 'hsbc') {
    if (tierId === 'premier') return HSBC_GRADIENT_DEBIT;
    if (tierId === 'advance') return HSBC_GRADIENT_CREDIT;
  }

  // 3. Bank default brand gradient
  return BANK_DEFAULT_GRADIENT[bankId] ?? BANK_DEFAULT_GRADIENT.other;
}

// ===========================================================================
// Pattern overlay components
// Each is a subtle full-card SVG at low opacity (~0.04-0.08).
// ===========================================================================

const overlayBoxSx = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 0,
  overflow: 'hidden',
} as const;

// CIB — faint hexagon grid tessellation
export const CibPattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      {/* rows of small pointy-top hexagons (~12px across), stroke white 0.05 */}
      <g fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.05">
        {Array.from({ length: 7 }).map((_, row) =>
          Array.from({ length: 10 }).map((__, col) => {
            const r = 7;
            const w = r * Math.sqrt(3);
            const x = col * w + (row % 2 ? w / 2 : 0) - 4;
            const y = row * (r * 1.5) - 4;
            return (
              <polygon
                key={`${row}-${col}`}
                points={`${x},${y - r} ${x + w / 2},${y - r / 2} ${x + w / 2},${y + r / 2} ${x},${y + r} ${x - w / 2},${y + r / 2} ${x - w / 2},${y - r / 2}`}
              />
            );
          }),
        )}
      </g>
    </svg>
  </Box>
);

// NBE — subtle gold hieroglyphic-style chevrons across middle-bottom
export const NbePattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <g stroke="#E0B341" strokeWidth="1" opacity="0.06" fill="none">
        <polyline points="0,78 20,70 40,78 60,70 80,78 100,70 120,78 140,70 160,78" />
        <polyline points="0,84 20,76 40,84 60,76 80,84 100,76 120,84 140,76 160,84" />
        <polyline points="0,90 20,82 40,90 60,82 80,90 100,82 120,90 140,82 160,90" />
      </g>
      <g fill="#E0B341" opacity="0.05">
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={i} cx={10 + i * 18} cy={66} r={1.2} />
        ))}
      </g>
    </svg>
  </Box>
);

// Banque Misr — row of small lotus/papyrus silhouettes along the bottom edge
export const BanqueMisrPattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <g fill="#ffffff" opacity="0.05">
        {Array.from({ length: 8 }).map((_, i) => {
          const cx = 10 + i * 20;
          return (
            <g key={i} transform={`translate(${cx},86)`}>
              {/* stem */}
              <rect x="-0.4" y="-14" width="0.8" height="14" />
              {/* flower head */}
              <path d="M0,-18 C1.5,-16 1.5,-13 0,-11 C-1.5,-13 -1.5,-16 0,-18 Z" />
            </g>
          );
        })}
      </g>
    </svg>
  </Box>
);

// QNB — radiating lines from top-right corner (starburst)
export const QnbPattern: FC = () => {
  const cx = 160;
  const cy = 0;
  return (
    <Box sx={overlayBoxSx}>
      <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <g stroke="#ffffff" strokeWidth="0.8" opacity="0.05">
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (Math.PI * i) / 14; // 0..PI pointing left/down from top-right
            const len = 130;
            const x2 = cx - Math.cos(angle) * len;
            const y2 = cy + Math.sin(angle) * len;
            return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} />;
          })}
        </g>
      </svg>
    </Box>
  );
};

// Arab Bank — three large faint overlapping ring outlines centered-right
export const ArabBankPattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <g fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.05">
        <circle cx="90" cy="50" r="30" />
        <circle cx="120" cy="50" r="30" />
        <circle cx="150" cy="50" r="30" />
      </g>
    </svg>
  </Box>
);

// ADCB — two large faint interlocking triangles centered-left
export const AdcbPattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <g fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.05" strokeLinejoin="round">
        <polygon points="50,18 86,70 14,70" />
        <polygon points="50,82 86,30 14,30" />
      </g>
    </svg>
  </Box>
);

// AAIB — faint diagonal diamond/grid pattern (gold)
export const AaibPattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <g fill="none" stroke="#E0B341" strokeWidth="0.6" opacity="0.05">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`a${i}`} x1={-40 + i * 20} y1={0} x2={20 + i * 20} y2={100} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`b${i}`} x1={20 + i * 20} y1={0} x2={-40 + i * 20} y2={100} />
        ))}
      </g>
    </svg>
  </Box>
);

// FABMISR — faint vertical pillar lines
export const FabmisrPattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <g stroke="#ffffff" strokeWidth="3" opacity="0.04">
        {[20, 50, 80, 110, 140].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={100} />
        ))}
      </g>
    </svg>
  </Box>
);

// EGBank — large faint infinity/loop watermark centered (cyan)
export const EgbankPattern: FC = () => (
  <Box sx={overlayBoxSx}>
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <g fill="none" stroke="#22D3EE" strokeWidth="2.5" opacity="0.06" strokeLinecap="round">
        <path d="M55,50 C40,30 10,30 10,50 C10,70 40,70 55,50 C70,30 100,30 100,50 C100,70 70,70 55,50 Z" transform="translate(25,0) scale(1.4)" transform-origin="55 50" />
      </g>
    </svg>
  </Box>
);

// ---------------------------------------------------------------------------
// BANK_PATTERNS map
// ---------------------------------------------------------------------------
export const BANK_PATTERNS: Record<string, FC | null> = {
  hsbc: null, // HSBC uses its own lion background
  cib: CibPattern,
  nbe: NbePattern,
  'banque-misr': BanqueMisrPattern,
  qnb: QnbPattern,
  'arab-bank': ArabBankPattern,
  adcb: AdcbPattern,
  aaib: AaibPattern,
  fabmisr: FabmisrPattern,
  egbank: EgbankPattern,
  other: null,
};

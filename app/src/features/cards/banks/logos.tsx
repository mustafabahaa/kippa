import { Box, Typography, Stack } from '@mui/material';
import type { CardKind } from '@/domain/financeTypes';

/**
 * Hand-built SVG wordmarks for the non-HSBC Egyptian banks.
 * Each renders a small accent geometric mark + the bank name text.
 * They appear small on colored card backgrounds, so text is white.
 */

const nameStyle = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 700,
  fontSize: '15px',
  color: '#ffffff',
  letterSpacing: '0.3px',
  textTransform: 'uppercase',
  lineHeight: 1.1,
} as const;

/**
 * A small geometric accent mark — a rounded square rotated 45° (diamond)
 * in the bank's brand color, with a subtle inset highlight.
 */
function AccentMark({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="4"
          transform="rotate(45 12 12)"
          fill={color}
        />
        <rect
          x="8"
          y="8"
          width="8"
          height="8"
          rx="2"
          transform="rotate(45 12 12)"
          fill="rgba(255,255,255,0.25)"
        />
      </svg>
    </Box>
  );
}

export function CibLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#1F4F7A" />
      <Typography sx={nameStyle}>CIB</Typography>
    </Stack>
  );
}

export function NbeLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#2E7D32" />
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <Typography sx={nameStyle}>NBE</Typography>
      </Box>
    </Stack>
  );
}

export function BanqueMisrLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#C62828" />
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <Typography sx={{ ...nameStyle, fontSize: '13px' }}>Banque</Typography>
        <Typography sx={{ ...nameStyle, fontSize: '13px' }}>Misr</Typography>
      </Box>
    </Stack>
  );
}

export function QnbLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#5B2C83" />
      <Typography sx={nameStyle}>QNB</Typography>
    </Stack>
  );
}

export function ArabBankLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#1976D2" />
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <Typography sx={{ ...nameStyle, fontSize: '13px' }}>Arab</Typography>
        <Typography sx={{ ...nameStyle, fontSize: '13px' }}>Bank</Typography>
      </Box>
    </Stack>
  );
}

export function AdcbLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#D32F2F" />
      <Typography sx={nameStyle}>ADCB</Typography>
    </Stack>
  );
}

export function AaibLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#1565C0" />
      <Typography sx={nameStyle}>AAIB</Typography>
    </Stack>
  );
}

export function FabmisrLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#6A1B9A" />
      <Typography sx={nameStyle}>FABMISR</Typography>
    </Stack>
  );
}

export function EgbankLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <AccentMark color="#00695C" />
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <Typography sx={{ ...nameStyle, fontSize: '13px' }}>EG</Typography>
        <Typography sx={{ ...nameStyle, fontSize: '13px' }}>Bank</Typography>
      </Box>
    </Stack>
  );
}

/** Generic fallback for the "Other" bank. */
export function OtherLogo({ kind: _kind }: { kind: CardKind }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 22,
          height: 22,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#ffffff" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </Box>
      <Typography sx={nameStyle}>Other</Typography>
    </Stack>
  );
}

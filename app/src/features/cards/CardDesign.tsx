import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { CardKind, CardNetwork } from '@/domain/financeTypes';
import { getBank, getTier } from './banks/banks';
import { CardChip, ContactlessIcon } from './banks/hsbcTheme';

/**
 * Renders the bank's background (gradient + optional overlay) wrapping children.
 */
export function CardBackground({
  bankId,
  kind,
  tierId,
  children,
  fill,
}: {
  bankId: string;
  kind: CardKind;
  tierId?: string;
  children: ReactNode;
  /** Fill the parent's height (used by tiles in a flex-stretched row). */
  fill?: boolean;
}) {
  const bank = getBank(bankId) ?? getBank('other')!;
  const { css, overlay } = bank.background({ kind, tierId });
  return (
    <Box sx={{ position: 'relative', background: css, overflow: 'hidden', height: fill ? '100%' : undefined, flexShrink: 0 }}>
      {overlay}
      <Box sx={{ position: 'relative', zIndex: 1, height: fill ? '100%' : undefined }}>{children}</Box>
    </Box>
  );
}

/**
 * Renders the bank's logo by id.
 */
export function BankLogo({ bankId, kind }: { bankId: string; kind: CardKind }) {
  const bank = getBank(bankId) ?? getBank('other')!;
  return <>{bank.logo({ kind })}</>;
}

/**
 * Renders the card network mark (Visa / Mastercard / Meeza).
 * `other`/undefined -> null.
 */
export function NetworkLogo({ network }: { network?: CardNetwork }) {
  switch (network) {
    case 'visa':
      return (
        <svg
          viewBox="0 0 24 24"
          width="44"
          height="15"
          fill="#ffffff"
          style={{ display: 'block' }}
          aria-label="Visa"
          role="img"
        >
          <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z" />
        </svg>
      );
    case 'mastercard':
      return (
        <svg
          viewBox="0 0 50 30"
          width="42"
          height="25"
          style={{ display: 'block' }}
          aria-label="Mastercard"
          role="img"
        >
          <circle cx="17" cy="15" r="13" fill="#eb001b" />
          <circle cx="33" cy="15" r="13" fill="#f79e1b" opacity="0.85" />
        </svg>
      );
    case 'meeza':
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 0.8,
            py: 0.3,
            borderRadius: '3px',
            border: '1px solid rgba(255,255,255,0.7)',
            flexShrink: 0,
          }}
          aria-label="Meeza"
          role="img"
        >
          <Typography
            sx={{
              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
              fontWeight: 700,
              fontSize: '10px',
              color: '#ffffff',
              letterSpacing: '0.5px',
              textTransform: 'lowercase',
              lineHeight: 1,
            }}
          >
            meeza
          </Typography>
        </Box>
      );
    default:
      return null;
  }
}

/**
 * Small uppercase label of the tier, white text.
 */
export function TierLabel({ bankId, tierId }: { bankId: string; tierId?: string }) {
  const tier = getTier(bankId, tierId);
  if (!tier) return null;
  return (
    <Typography
      sx={{
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
        fontSize: '11px',
        color: '#ffffff',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        opacity: 0.9,
      }}
    >
      {tier.label}
    </Typography>
  );
}

// Re-export neutral components so consumers can import everything from one place.
export { CardChip, ContactlessIcon };

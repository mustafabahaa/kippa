import { Box, Chip, Paper, Typography } from '@monochrome-ui/design-system';
import { BankCardArtwork, CardChip, ContactlessIcon } from '@monochrome-ui/design-system';
import type { ReactNode } from 'react';
import type { CardKind, CardNetwork } from '@kippa/domain';
import { getBank, getTier } from './banks/banks';

/** Shared monochrome card shell. Bank, product, and tier never change its appearance. */
export function CardBackground(props: {
  bankId: string;
  kind: CardKind;
  tierId?: string;
  children: ReactNode;
  surface?: 'bankCard' | 'bankCardHeader';
  fill?: boolean;
  inactive?: boolean;
  clickable?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  sx?: object;
}) {
  const { children, surface = 'bankCard', fill, inactive, clickable, onClick, sx } = props;
  return (
    <Paper
      variant={surface}
      data-inactive={inactive || undefined}
      data-clickable={clickable || undefined}
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: fill ? '1 1 auto' : undefined,
        ...sx,
      }}
    >
      <BankCardArtwork />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: fill ? 'flex' : undefined,
          flexDirection: 'column',
          flex: fill ? '1 1 auto' : undefined,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

/** Use one neutral wordmark treatment while retaining the selected bank's name. */
export function BankLogo({ bankId }: { bankId: string; kind: CardKind }) {
  const bank = getBank(bankId) ?? getBank('other')!;
  return <Typography variant="sectionTitle">{bank.name}</Typography>;
}

/** Network marks use the same monochrome color as the shared card face. */
export function NetworkLogo({ network }: { network?: CardNetwork }) {
  if (!network || network === 'other') return null;
  if (network === 'mastercard') {
    return (
      <svg viewBox="0 0 50 30" width="38" height="23" style={{ display: 'block' }} aria-label="Mastercard" role="img">
        <circle cx="17" cy="15" r="13" fill="currentColor" />
        <circle cx="33" cy="15" r="13" fill="currentColor" opacity="0.5" />
      </svg>
    );
  }
  if (network === 'visa') {
    return (
      <Typography variant="sectionTitle" aria-label="Visa">
        VISA
      </Typography>
    );
  }
  return <Chip aria-label="Meeza" label="meeza" size="small" variant="outlined" />;
}

/** Kept for the detail screen's metadata, without tier-specific styling. */
export function TierLabel({ bankId, tierId }: { bankId: string; tierId?: string }) {
  if (!tierId) return null;
  return <Typography variant="sectionSubtitle">{getTier(bankId, tierId)?.label ?? tierId}</Typography>;
}

export { CardChip, ContactlessIcon };

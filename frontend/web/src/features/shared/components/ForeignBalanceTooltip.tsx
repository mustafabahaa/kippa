import type { ReactElement } from 'react';
import { Stack, Tooltip, Typography } from '@mui/material';
import type { CurrencyCode } from '@kippa/domain';
import { Money } from '@/components/Money';

interface ForeignBalanceTooltipProps {
  amount: number;
  currency: CurrencyCode;
  baseCurrency: CurrencyCode;
  rate?: number;
  children: ReactElement;
}

export function ForeignBalanceTooltip({
  amount,
  currency,
  baseCurrency,
  rate,
  children,
}: ForeignBalanceTooltipProps) {
  if (currency === baseCurrency) return children;

  const hasRate = typeof rate === 'number' && Number.isFinite(rate) && rate > 0;

  return (
    <Tooltip
      arrow
      placement="top"
      enterTouchDelay={300}
      title={
        <Stack spacing={0.5} sx={{ py: 0.25 }}>
          <Typography sx={{ color: 'inherit', fontSize: 12, fontWeight: 700 }}>
            {hasRate ? (
              <>Base equivalent: <Money amount={amount * rate} code={baseCurrency} maxDigits={2} /></>
            ) : 'Base equivalent unavailable'}
          </Typography>
          <Typography sx={{ color: 'inherit', fontSize: 11, fontWeight: 500 }}>
            {hasRate ? (
              <>Current rate: 1 {currency} = <Money amount={rate} code={baseCurrency} maxDigits={4} /></>
            ) : `No current ${currency}/${baseCurrency} rate`}
          </Typography>
        </Stack>
      }
    >
      {children}
    </Tooltip>
  );
}

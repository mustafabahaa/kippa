import { forwardRef } from 'react';
import Paper, { type PaperProps } from '@mui/material/Paper';
import { alpha, styled } from '@mui/material/styles';

export type BudgetMetricTone = 'planned' | 'spent' | 'error' | 'success';

export type BudgetMetricBadgeProps = Omit<PaperProps, 'color' | 'variant'> & {
  tone: BudgetMetricTone;
};

const Root = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: BudgetMetricTone }>(({ theme, tone }) => {
  const color = {
    planned: theme.palette.secondary.main,
    spent: theme.palette.primary.main,
    error: theme.palette.error.main,
    success: theme.palette.success.main,
  }[tone];

  return {
    width: 36,
    height: 36,
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 10,
    color,
    backgroundColor: alpha(color, 0.1),
    boxShadow: 'none',
  };
});

/** Named accent badge for budget metrics; tone selects a semantic theme color. */
export const BudgetMetricBadge = forwardRef<HTMLDivElement, BudgetMetricBadgeProps>(function BudgetMetricBadge(
  { tone, ...props },
  ref,
) {
  return <Root ref={ref} tone={tone} {...props} />;
});

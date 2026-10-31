import type { ComponentProps, ReactNode } from 'react';
import { Box, Skeleton, Typography, type TypographyProps } from '@mui/material';
import { alpha, styled, type Theme } from '@mui/material/styles';

export type BudgetPulseStatusTone = 'success' | 'warning' | 'error';
export type BudgetPulseCategoryTone = 'primary' | 'secondary' | 'accent';
export type BudgetPulseCategoryRank = 'first' | 'second' | 'third';
export type BudgetPulseSkeletonVariant = 'status' | 'progress';

const PulseSkeletonRoot = styled(Skeleton, {
  name: 'KippaBudgetPulseSkeleton',
  slot: 'Root',
  shouldForwardProp: (prop) => prop !== 'pulseVariant',
})<{ pulseVariant: BudgetPulseSkeletonVariant }>(({ theme, pulseVariant }) => ({
  borderRadius: pulseVariant === 'status' ? theme.shape.borderRadius : 4,
}));

export function BudgetPulseSkeleton({
  pulseVariant,
  ...props
}: Omit<ComponentProps<typeof Skeleton>, 'variant'> & { pulseVariant: BudgetPulseSkeletonVariant }) {
  return <PulseSkeletonRoot variant="rectangular" pulseVariant={pulseVariant} {...props} />;
}

type BudgetPulseStatusProps = {
  tone: BudgetPulseStatusTone;
  children: ReactNode;
};

const StatusRoot = styled(Box, {
  name: 'KippaBudgetPulseStatus',
  slot: 'Root',
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: BudgetPulseStatusTone }>(({ theme, tone }) => ({
  width: 'fit-content',
  borderRadius: 9,
  padding: '4.8px 8px',
  backgroundColor: alpha(theme.palette[tone].main, 0.1),
  color: theme.palette[tone].main,
}));

export function BudgetPulseStatus({ tone, children }: BudgetPulseStatusProps) {
  return (
    <StatusRoot tone={tone}>
      <Typography variant="budgetPulseStatus">{children}</Typography>
    </StatusRoot>
  );
}

type BudgetPulseValueProps = { value: number };

const ValueRoot = styled(Typography, {
  name: 'KippaBudgetPulseValue',
  slot: 'Root',
})(({ theme }) => ({ [theme.breakpoints.up('lg')]: { fontSize: 40 } }));

export function BudgetPulseValue({ value }: BudgetPulseValueProps) {
  return (
    <ValueRoot variant="budgetPulseValue" color="text.primary">
      {value}
      <Typography component="span" variant="budgetPulseValueSuffix" sx={{ ml: 0.75 }}>
        %
      </Typography>
    </ValueRoot>
  );
}

export function BudgetPulseSummary({ children, sx }: { children: ReactNode; sx?: TypographyProps['sx'] }) {
  return (
    <Typography variant="budgetPulseSummary" color="text.secondary" sx={sx}>
      {children}
    </Typography>
  );
}

type BudgetPulseCategoryTileProps = {
  tone: BudgetPulseCategoryTone;
  rank: BudgetPulseCategoryRank;
  usedPercent: number;
  category: string;
  remainingTitle: string;
  children: ReactNode;
};

const categoryTileToneStyles = {
  primary: (theme: Theme) => ({
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
  }),
  secondary: (theme: Theme) => ({
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  }),
  accent: (theme: Theme) => ({
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  }),
} as const;

const categoryTileRankHeights: Record<BudgetPulseCategoryRank, number> = {
  first: 120,
  second: 104,
  third: 88,
};

const CategoryTileRoot = styled(Box, {
  name: 'KippaBudgetPulseCategoryTile',
  slot: 'Root',
  shouldForwardProp: (prop) => prop !== 'tone' && prop !== 'rank',
})<Pick<BudgetPulseCategoryTileProps, 'tone' | 'rank'>>(({ theme, tone, rank }) => ({
  boxSizing: 'border-box',
  display: 'flex',
  flex: '1 1 0',
  minWidth: 0,
  height: categoryTileRankHeights[rank],
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(1.25),
  borderRadius: '13px 13px 9px 9px',
  ...categoryTileToneStyles[tone](theme),
}));

export function BudgetPulseCategoryTile({
  tone,
  rank,
  usedPercent,
  category,
  remainingTitle,
  children,
}: BudgetPulseCategoryTileProps) {
  const compactPercent = usedPercent >= 100;

  return (
    <CategoryTileRoot tone={tone} rank={rank}>
      <Box>
        <Typography variant={compactPercent ? 'budgetPulsePercentCompact' : 'budgetPulsePercent'}>
          {usedPercent}%
        </Typography>
        <Typography variant="budgetPulseCategory">
          {category}
        </Typography>
      </Box>
      <Typography variant="budgetPulseAmount" noWrap title={remainingTitle}>
        {children}
      </Typography>
    </CategoryTileRoot>
  );
}

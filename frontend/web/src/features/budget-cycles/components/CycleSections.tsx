import { BarChartIcon, CheckCircleIcon, EditIcon, EventIcon, ExpandLessIcon, TimerIcon } from '@/components/AppIcon';

import { Box, Button, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import type { BudgetCycle, CurrencyCode } from '@kippa/domain';
import { Money } from '@/components/Money';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { formatCycleDate, type CycleDaysInfo } from '../cycleUtils';

type ActiveCycleSectionProps = {
  cycle: BudgetCycle;
  daysInfo: CycleDaysInfo;
  stats?: CycleHistoryStats;
  isEditingBudget: boolean;
  onCloseCycle: () => void;
  onToggleBudget: () => void;
};

export function ActiveCycleSection({
  cycle,
  daysInfo,
  stats,
  onCloseCycle,
  isEditingBudget,
  onToggleBudget,
}: ActiveCycleSectionProps) {
  return (
    <Stack spacing={2.5}>
      <SectionHeading
        icon={<EventIcon size={22} strokeWidth={1.8} />}
        title={cycle.name}
        subtitle={`${formatCycleDate(cycle.startDate)}${cycle.endDate ? ` — ${formatCycleDate(cycle.endDate)}` : ' — Ongoing'}`}
        trailing={<Chip label="Active" color="success" />}
      />

      {daysInfo.progress !== null ? (
        <Stack spacing={0.75}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Day {daysInfo.elapsed} of {daysInfo.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {daysInfo.progress}% elapsed
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={daysInfo.progress} />
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <TimerIcon size={20} strokeWidth={1.8} />
          <Typography variant="body2" color="text.secondary">
            Day {daysInfo.elapsed + 1} · no end date set
          </Typography>
        </Stack>
      )}

      {stats?.plannedBudget != null && (
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="fieldHint" color="text.secondary">
              Planned
            </Typography>
            <Typography variant="loanMetricCompact">
              <Money amount={stats.plannedBudget} code={stats.baseCurrency} />
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="fieldHint" color="text.secondary">
              Spent
            </Typography>
            <Typography variant="loanMetricCompact">
              <Money amount={stats.actualExpense ?? 0} code={stats.baseCurrency} />
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="fieldHint" color="text.secondary">
              Remaining
            </Typography>
            <Typography
              variant="loanMetricCompact"
              color={stats.plannedBudget - (stats.actualExpense ?? 0) < 0 ? 'error.main' : 'text.primary'}
            >
              <Money amount={stats.plannedBudget - (stats.actualExpense ?? 0)} code={stats.baseCurrency} />
            </Typography>
          </Grid>
        </Grid>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <Button
          variant="contained"
          startIcon={
            isEditingBudget ? <ExpandLessIcon size={20} strokeWidth={1.8} /> : <EditIcon size={20} strokeWidth={1.8} />
          }
          onClick={onToggleBudget}
        >
          {isEditingBudget ? 'Hide budget' : 'Edit budget'}
        </Button>
        <Button variant="outlined" startIcon={<CheckCircleIcon size={20} strokeWidth={1.8} />} onClick={onCloseCycle}>
          Close cycle
        </Button>
      </Stack>
    </Stack>
  );
}

export type CycleHistoryStats = {
  baseCurrency: CurrencyCode;
  plannedBudget?: number;
  actualExpense?: number;
};

type CycleHistoryItemProps = {
  cycle: BudgetCycle;
  isEditing: boolean;
  onToggleBudget: () => void;
  onViewReport?: () => void;
  stats?: CycleHistoryStats;
};

export function CycleHistoryItem({ cycle, isEditing, onToggleBudget, onViewReport, stats }: CycleHistoryItemProps) {
  const utilization = stats?.plannedBudget
    ? Math.round(((stats.actualExpense ?? 0) / stats.plannedBudget) * 100)
    : null;
  const overBudget = utilization !== null && utilization > 100;
  const statusLabel = cycle.status === 'planned' ? 'Planned' : 'Closed';

  return (
    <Box component="article" sx={{ py: { xs: 0.5, md: 1 } }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="loanTitle">{cycle.name}</Typography>
            <Typography variant="loanMeta" color="text.secondary">
              {formatCycleDate(cycle.startDate)}
              {cycle.endDate ? ` — ${formatCycleDate(cycle.endDate)}` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            <Chip label={statusLabel} variant="outlined" />
            {onViewReport && (
              <Button
                variant="segmented"
                startIcon={<BarChartIcon size={20} strokeWidth={1.8} />}
                onClick={onViewReport}
              >
                View report
              </Button>
            )}
            <Button
              variant="segmented"
              startIcon={
                isEditing ? <ExpandLessIcon size={20} strokeWidth={1.8} /> : <EditIcon size={20} strokeWidth={1.8} />
              }
              onClick={onToggleBudget}
            >
              {isEditing ? 'Hide budget' : 'Edit budget'}
            </Button>
          </Stack>
        </Stack>

        {stats && (stats.plannedBudget != null || stats.actualExpense != null) && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={{ xs: 2, sm: 4 }} useFlexGap flexWrap="wrap">
              <Box>
                <Typography variant="fieldHint" color="text.secondary">
                  Planned
                </Typography>
                <Typography variant="loanMetricCompact">
                  {stats.plannedBudget != null ? <Money amount={stats.plannedBudget} code={stats.baseCurrency} /> : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="fieldHint" color="text.secondary">
                  Spent
                </Typography>
                <Typography variant="loanMetricCompact" color={overBudget ? 'error.main' : 'text.primary'}>
                  {stats.actualExpense != null ? <Money amount={stats.actualExpense} code={stats.baseCurrency} /> : '—'}
                </Typography>
              </Box>
              {utilization !== null && (
                <Box>
                  <Typography variant="fieldHint" color="text.secondary">
                    Budget used
                  </Typography>
                  <Typography variant="loanMetricCompact" color={overBudget ? 'error.main' : 'text.primary'}>
                    {utilization}%
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

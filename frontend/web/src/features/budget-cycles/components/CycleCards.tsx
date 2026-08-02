import { alpha, Box, Button, Card, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import type { BudgetCycle } from '@kippa/domain';
import { CalendarTodayIcon, CheckCircleOutlineIcon, EditIcon, EventIcon, ExpandLessIcon, TimerIcon } from '@/components/AppIcon';
import { formatCycleDate, type CycleDaysInfo } from '../cycleUtils';

type ActiveCycleCardProps = {
  cycle: BudgetCycle;
  daysInfo: CycleDaysInfo;
  isEditingBudget: boolean;
  onCloseCycle: () => void;
  onToggleBudget: () => void;
};

export function ActiveCycleCard({ cycle, daysInfo, onCloseCycle, isEditingBudget, onToggleBudget }: ActiveCycleCardProps) {
  return (
    <Card sx={{ width: '100%', p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Chip
          label="ACTIVE"
          size="small"
          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />}
          sx={{ fontWeight: 700, fontSize: 10, height: 24, borderRadius: 0.75, bgcolor: (theme) => alpha(theme.palette.success.main, 0.08), color: 'success.main', alignSelf: 'flex-start', mb: 1.5, '& .MuiChip-icon': { display: 'block', ml: 1, mr: -0.5 } }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: 24, fontWeight: 800, color: 'text.primary' }}>{cycle.name}</Typography>
            <Box display="flex" alignItems="center" gap={0.75} sx={{ mt: 0.5 }}>
              <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatCycleDate(cycle.startDate)}{cycle.endDate ? ` — ${formatCycleDate(cycle.endDate)}` : ' — Ongoing'}
              </Typography>
            </Box>
          </Box>
        </Box>
        {daysInfo.progress !== null ? (
          <Box sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Day {daysInfo.elapsed} of {daysInfo.total} days total</Typography>
              <Typography variant="body2">{daysInfo.progress}% Elapsed</Typography>
            </Box>
            <LinearProgress variant="determinate" value={daysInfo.progress} color={daysInfo.progress > 85 ? 'warning' : 'primary'} />
          </Box>
        ) : (
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon color="primary" sx={{ fontSize: 16 }} />
            <Typography variant="body2">Day {daysInfo.elapsed + 1} — No end date set</Typography>
          </Box>
        )}
        <Stack direction={{ xs: 'column', sm: 'row', lg: 'column', xl: 'row' }} alignItems="flex-start" spacing={1.5} sx={{ mt: 3.5 }}>
          <Button variant="contained" startIcon={isEditingBudget ? <ExpandLessIcon /> : <EditIcon />} onClick={onToggleBudget}>
            {isEditingBudget ? 'Hide Budget' : 'Edit Budget'}
          </Button>
          <Button variant="outlined" startIcon={<CheckCircleOutlineIcon />} onClick={onCloseCycle}>Close Cycle</Button>
        </Stack>
      </Box>
    </Card>
  );
}

type CycleHistoryCardProps = {
  cycle: BudgetCycle;
  isEditing: boolean;
  onToggleBudget: () => void;
};

export function CycleHistoryCard({ cycle, isEditing, onToggleBudget }: CycleHistoryCardProps) {
  const theme = useTheme();
  const statusColor = cycle.status === 'open' ? theme.palette.success.main : cycle.status === 'planned' ? theme.palette.primary.main : theme.palette.text.secondary;
  const statusBg = alpha(statusColor, cycle.status === 'closed' ? 0.12 : 0.08);
  return (
    <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', borderColor: isEditing ? 'primary.main' : undefined }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: statusBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CalendarTodayIcon sx={{ fontSize: 18, color: statusColor }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="sectionLabel">{cycle.name}</Typography>
          <Typography variant="fieldHint" color="text.secondary" sx={{ mt: 0.25 }}>
            {formatCycleDate(cycle.startDate)}{cycle.endDate ? ` — ${formatCycleDate(cycle.endDate)}` : ''}
          </Typography>
        </Box>
        <Chip label={cycle.status.toUpperCase()} size="small" sx={{ bgcolor: statusBg, color: statusColor }} />
      </Box>
      <Button variant="outlined" startIcon={isEditing ? <ExpandLessIcon /> : <EditIcon />} onClick={onToggleBudget} sx={{ mt: 2, alignSelf: 'flex-end', minWidth: 138 }}>
        {isEditing ? 'Hide Budget' : 'Edit Budget'}
      </Button>
    </Card>
  );
}

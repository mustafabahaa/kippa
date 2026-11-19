import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@monochrome-ui/design-system';
import type { DashboardData } from '@/libs/selectors';

type CategoryPace = DashboardData['categoryStatus'][number];

export function CategoryPaceChart({ categories }: { categories: CategoryPace[] }) {
  const visible = [...categories]
    .filter((category) => category.planned > 0 || category.spent > 0)
    .sort((a, b) => Math.max(b.planned, b.spent) - Math.max(a.planned, a.spent));
  if (!visible.length) return null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="sectionLabel">Category pace</Typography>
          <Typography variant="body2" color="text.secondary">
            Every category compared by percentage of its plan used.
          </Typography>
        </Box>
        <Chip label={`${visible.length} categories`} />
      </Stack>
      <Box sx={{ minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))`,
            minWidth: `${Math.max(320, visible.length * 88)}px`,
            columnGap: 1,
            alignItems: 'end',
          }}
        >
          {visible.map((category) => {
            const hasUnplannedSpend = category.planned <= 0 && category.spent > 0;
            const percent = category.planned > 0 ? (category.spent / category.planned) * 100 : 0;
            const fill = hasUnplannedSpend ? 100 : Math.max(category.spent > 0 ? 5 : 0, Math.min(100, percent));
            const over = category.spent > category.planned;
            const fillVariant = over
              ? 'capacityFillError'
              : percent >= 80
                ? 'capacityFillWarning'
                : 'capacityFillSuccess';
            const tooltip = hasUnplannedSpend
              ? `${category.categoryName}: unplanned spend · ${category.spent.toLocaleString()} spent with no budget`
              : `${category.categoryName}: ${Math.round(percent)}% used · ${category.spent.toLocaleString()} spent of ${category.planned.toLocaleString()} planned`;
            return (
              <Stack key={category.categoryId} spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                <Tooltip
                  arrow
                  placement="top"
                  title={tooltip}
                >
                  <Paper variant="capacityTrack" sx={{ width: '100%', maxWidth: 46, height: { xs: 72, sm: 88 } }}>
                    <Paper
                      variant={fillVariant}
                      sx={{ height: `${fill}%` }}
                    />
                  </Paper>
                </Tooltip>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    width: '100%',
                    minWidth: 0,
                    minHeight: '1.5em',
                  }}
                >
                  <Typography
                    variant="metricMetadata"
                    color="text.secondary"
                    title={category.categoryName}
                    textAlign="center"
                    noWrap
                    sx={{ width: '100%', minWidth: 0 }}
                  >
                    {category.categoryName}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
}

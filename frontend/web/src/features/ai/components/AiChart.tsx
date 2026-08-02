import { Box, Paper, Typography, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import type { AiChartSpec } from '../types';

export function AiChart({ chart }: { chart: AiChartSpec }) {
  const theme = useTheme();
  const colors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main, theme.palette.warning.main];
  const common = { height: 260, margin: { top: 24, right: 16, bottom: 42, left: 52 } } as const;

  return (
    <Paper variant="assistantChart" sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="sectionLabel">{chart.title}</Typography>
      <Box sx={{ width: '100%', height: 260, mt: 1 }}>
        {chart.type === 'bar' && (
          <BarChart
            {...common}
            xAxis={[{ scaleType: 'band', data: chart.labels }]}
            series={chart.series.map((series, index) => ({ ...series, color: colors[index % colors.length] }))}
            grid={{ horizontal: true }}
          />
        )}
        {chart.type === 'line' && (
          <LineChart
            {...common}
            xAxis={[{ scaleType: 'point', data: chart.labels }]}
            series={chart.series.map((series, index) => ({ ...series, color: colors[index % colors.length], showMark: chart.labels.length <= 16 }))}
            grid={{ horizontal: true }}
          />
        )}
        {chart.type === 'pie' && (
          <PieChart
            height={260}
            series={[{ data: chart.labels.map((label, index) => ({ id: index, label, value: chart.series[0].data[index], color: colors[index % colors.length] })), innerRadius: 48, paddingAngle: 2 }]}
          />
        )}
      </Box>
    </Paper>
  );
}

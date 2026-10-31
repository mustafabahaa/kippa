import { Box, Typography } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';

export const CycleChartSwatch = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'swatchColor',
})<{ swatchColor: string }>(({ swatchColor }) => ({
  width: 10,
  height: 10,
  flexShrink: 0,
  borderRadius: 3,
  backgroundColor: swatchColor,
}));

export const CycleCashFlowGuide = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: '47%',
  borderTop: `1px dashed ${alpha(theme.palette.primary.main, 0.55)}`,
  pointerEvents: 'none',
}));

export const CycleTrendLineChart = styled(LineChart)(({ theme }) => ({
  '& .MuiAreaElement-root': {
    fill: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
  },
  '& .MuiLineElement-root': { strokeWidth: 3 },
  '& .MuiChartsGrid-line': {
    stroke: alpha(theme.palette.text.primary, 0.07),
    strokeDasharray: '3 5',
  },
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
    stroke: theme.palette.divider,
  },
  '& .MuiChartsAxis-line': { strokeWidth: 1 },
  '& .MuiChartsAxis-tickLabel text': {
    fill: `${theme.palette.text.secondary} !important`,
    fontSize: '11px !important',
  },
  '& .MuiChartsLegend-root text': {
    fill: `${theme.palette.text.primary} !important`,
    fontSize: '12px !important',
  },
}));

interface CycleCashFlowColumnProps {
  cycleName: string;
  income: number;
  spent: number;
  currency: string;
  capacityHeight: number;
  incomeHeight: number;
  spendHeight: number;
}

export function CycleCashFlowColumn({
  cycleName,
  income,
  spent,
  currency,
  capacityHeight,
  incomeHeight,
  spendHeight,
}: CycleCashFlowColumnProps) {
  return (
    <Box
      sx={{
        flex: '1 1 0',
        minWidth: { xs: 34, sm: 54 },
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        '&:hover .cycle-cashflow-tooltip, &:focus-within .cycle-cashflow-tooltip': {
          opacity: 1,
          transform: 'translate(-50%, -8px)',
        },
      }}
    >
      <Box
        tabIndex={0}
        aria-label={`${cycleName}: income ${income.toLocaleString()} ${currency}, spent ${spent.toLocaleString()} ${currency}`}
        sx={(theme) => ({
          width: '100%',
          height: `${capacityHeight}%`,
          maxWidth: 76,
          minHeight: 84,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '18px 18px 12px 12px',
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.075),
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 9px, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.07)} 9px 11px)`,
          outline: 'none',
        })}
      >
        <Box
          sx={(theme) => ({
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            height: `${incomeHeight}%`,
            minHeight: 5,
            backgroundColor: theme.palette.primary.dark,
            borderRadius: '14px 14px 10px 10px',
            transition: 'height 300ms ease',
          })}
        />
        <Box
          sx={(theme) => ({
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            height: `${spendHeight}%`,
            minHeight: 4,
            backgroundColor: theme.palette.secondary.main,
            borderRadius: '14px 14px 10px 10px',
            transition: 'height 300ms ease',
          })}
        />
      </Box>

      <Box
        className="cycle-cashflow-tooltip"
        sx={(theme) => ({
          position: 'absolute',
          zIndex: 2,
          left: '50%',
          bottom: `${Math.min(88, capacityHeight)}%`,
          opacity: 0,
          transform: 'translate(-50%, 0)',
          transition: 'opacity 160ms ease, transform 160ms ease',
          backgroundColor: theme.palette.text.primary,
          color: theme.palette.background.paper,
          borderRadius: 12,
          px: 1.5,
          py: 1,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: theme.shadows[3],
        })}
      >
        <Typography variant="caption" color="inherit" sx={{ opacity: 0.72 }}>Income</Typography>
        <Typography variant="chartTooltipValue" color="inherit">
          {income.toLocaleString()} {currency}
        </Typography>
      </Box>

      <Typography
        variant="chartCycleLabel"
        color="text.secondary"
        title={cycleName}
        sx={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {cycleName}
      </Typography>
    </Box>
  );
}

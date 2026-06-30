import { Box, Tooltip, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface InfoTooltipProps {
  /** Plain-text explanation shown inside the tooltip popover. */
  text: ReactNode;
  /** Optional shorter label to render inline next to the info icon. */
  label?: ReactNode;
  /** Override the default icon size. */
  iconSize?: number;
  /** Custom styling for the inline wrapper. */
  sx?: SxProps<Theme>;
}

/**
 * A small inline info icon that, on hover (or tap, when `interactive`),
 * reveals a plain-language explanation of a financial term shown on screen.
 *
 * Used to demystify jargon like "Spending ratio", "Cycle progress",
 * "Safe Daily", etc. for users who don't know what the metric means.
 */
export function InfoTooltip({ text, label, iconSize = 14, sx }: InfoTooltipProps) {
  return (
    <Tooltip
      title={<Box sx={{ maxWidth: 260, fontSize: '12.5px', lineHeight: 1.45 }}>{text}</Box>}
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={4000}
      placement="top"
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.4,
          cursor: 'help',
          verticalAlign: 'middle',
          ...sx,
        }}
      >
        {label}
        <InfoOutlinedIcon
          sx={{ fontSize: `${iconSize}px`, color: 'text.secondary', opacity: 0.7 }}
        />
      </Box>
    </Tooltip>
  );
}

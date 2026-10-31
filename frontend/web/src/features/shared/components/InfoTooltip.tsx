import { InfoOutlinedIcon } from '@/components/AppIcon';

import { Box, Tooltip, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface InfoTooltipProps {
  /** Plain-text explanation shown inside the tooltip popover. */
  text: ReactNode;
  /** Optional shorter label to render inline next to the info icon. */
  label?: ReactNode;
  /** Override the default icon size. */
  iconSize?: number;
}

/**
 * A small inline info icon that, on hover (or tap, when `interactive`),
 * reveals a plain-language explanation of a financial term shown on screen.
 *
 * Used to demystify jargon like "Spending ratio", "Cycle progress",
 * "Safe Daily", etc. for users who don't know what the metric means.
 */
export function InfoTooltip({ text, label, iconSize = 14 }: InfoTooltipProps) {
  return (
    <Tooltip
      title={
        <Typography component="div" variant="sectionSubtitle" sx={{ maxWidth: 260 }}>
          {text}
        </Typography>
      }
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
        }}
      >
        {label}
        <InfoOutlinedIcon size={iconSize} strokeWidth={1.8} />
      </Box>
    </Tooltip>
  );
}

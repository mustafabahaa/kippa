import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

/**
 * Shared content heading using the canonical icon-badge treatment:
 * a 44×44 secondary-tinted rounded badge (`Paper variant="iconBadge"`)
 * plus `sectionTitle`/`sectionSubtitle` typography. Use it for headed groups so
 * heading style stays consistent across features.
 */
export function SectionHeading({
  icon,
  title,
  subtitle,
  trailing,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      useFlexGap
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={2}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        {icon && <Paper variant="iconBadge">{icon}</Paper>}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="sectionTitle" noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="sectionSubtitle" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {trailing && <Box sx={{ flexShrink: 0 }}>{trailing}</Box>}
    </Stack>
  );
}

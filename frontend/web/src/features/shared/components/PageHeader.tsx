import { Box, Typography } from '@monochrome-ui/design-system';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Shared page header component for consistent heading style across all pages.
 * Matches the Dashboard / Reconciliation heading pattern:
 *   - Title:    h2, 24px, fontWeight 700
 *   - Subtitle: body1, 13px, text.secondary
 */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        mt: 0.5,
        gap: 2,
        flexWrap: 'wrap',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: action ? 'center' : 'flex-start',
      }}
    >
      <Box>
        <Typography variant="pageTitle" color="text.primary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}

import { Box, Typography } from '@mui/material';
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
        mt: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: action ? 'center' : 'flex-start',
      }}
    >
      <Box>
        <Typography
          variant="h2"
          sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}

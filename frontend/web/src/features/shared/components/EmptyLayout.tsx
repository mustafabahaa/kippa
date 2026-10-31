import { Box, Paper, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyLayoutProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/**
 * EmptyLayout renders a premium empty state container with dashed borders,
 * the Kippa logo icon, title, description, and an optional action.
 */
export function EmptyLayout({ title, description, action, icon }: EmptyLayoutProps) {
  const theme = useTheme();
  const logoSrc = theme.palette.mode === 'dark' ? '/icons/logo_white_transparent.png' : '/icons/logo_black_transparent.png';

  return (
    <Paper variant="emptyState">
      {icon ? (
        <Paper variant="emptyStateIcon">
          {icon}
        </Paper>
      ) : (
        <Paper
          component="img"
          variant="emptyStateLogo"
          src={logoSrc}
          alt="Kippa Logo"
        />
      )}
      <Typography variant="emptyStateTitle" color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="emptyStateDescription" color="text.secondary" sx={{ mt: 0.75, maxWidth: '80%' }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Paper>
  );
}

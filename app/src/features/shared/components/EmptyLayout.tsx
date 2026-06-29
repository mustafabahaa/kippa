import { Box, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyLayoutProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyLayout renders a premium empty state container with dashed borders,
 * the Kippa logo icon, title, description, and an optional action.
 */
export function EmptyLayout({ title, description, action }: EmptyLayoutProps) {
  const theme = useTheme();
  const logoSrc = theme.palette.mode === 'dark' ? '/icons/icon-dark.svg' : '/icons/icon.svg';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 4,
        px: 3,
        borderRadius: '24px',
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Box
        component="img"
        src={logoSrc}
        alt="Kippa Logo"
        sx={{
          width: 52,
          height: 52,
          opacity: 0.25,
          mb: 2,
          filter: theme.palette.mode === 'dark' ? 'none' : 'grayscale(100%)',
        }}
      />
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: 'text.primary', fontSize: '15px' }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.75, maxW: '80%' }}
        >
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}

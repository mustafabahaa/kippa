import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

type EmptyFeatureCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function EmptyFeatureCard({ title, description, icon }: EmptyFeatureCardProps) {
  return (
    <Stack
      spacing={2}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 5,
        p: 2.5,
        minHeight: 180,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          color: 'primary.main',
          display: 'grid',
          placeItems: 'center',
          width: 48,
          height: 48,
          borderRadius: 12,
          bgcolor: 'info.light',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h3">{title}</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}


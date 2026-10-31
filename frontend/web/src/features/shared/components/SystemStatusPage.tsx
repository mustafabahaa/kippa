import { Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { EmptyLayout } from './EmptyLayout';

export type SystemStatus = 'notFound' | 'error';

interface SystemStatusPageProps {
  status: SystemStatus;
  onRetry?: () => void;
}

const copy = {
  notFound: {
    title: 'Page not found',
    description: 'This page may have moved, or the address may be incorrect.',
  },
  error: {
    title: 'Something went wrong',
    description: 'Kippa hit an unexpected problem. Reload the page to try again.',
  },
} satisfies Record<SystemStatus, { title: string; description: string }>;

export function SystemStatusPage({ status, onRetry }: SystemStatusPageProps) {
  const content = copy[status];
  const action = onRetry ? (
    <Button variant="contained" onClick={onRetry}>
      Reload page
    </Button>
  ) : (
    <Button component={Link} to="/" variant="contained">
      Go to dashboard
    </Button>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <EmptyLayout title={content.title} description={content.description} action={action} />
      </Box>
    </Box>
  );
}

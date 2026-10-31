import { Button, SystemStatusLayout, useTheme } from '@monochrome-ui/design-system';
import { Link } from 'react-router-dom';

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
  const theme = useTheme();
  const content = copy[status];
  const logoSrc = theme.palette.mode === 'dark' ? '/icons/logo_white_transparent.png' : '/icons/logo_black_transparent.png';
  const action = onRetry ? (
    <Button variant="contained" onClick={onRetry}>
      Reload page
    </Button>
  ) : (
    <Button component={Link} to="/" variant="contained">
      Back to Kippa
    </Button>
  );

  return (
    <SystemStatusLayout
      logoSrc={logoSrc}
      code={status === 'notFound' ? '404' : 'ERROR'}
      title={content.title}
      description={content.description}
      action={action}
    />
  );
}

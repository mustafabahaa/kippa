import { EmptyStateLayout, useTheme } from '@monochrome-ui/design-system';
import type { ReactNode } from 'react';

interface EmptyLayoutProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/** Kippa-branded empty state composed from the shared presentation component. */
export function EmptyLayout({ title, description, action, icon }: EmptyLayoutProps) {
  const theme = useTheme();
  const logoSrc = theme.palette.mode === 'dark' ? '/icons/logo_white_transparent.png' : '/icons/logo_black_transparent.png';
  return <EmptyStateLayout title={title} description={description} action={action} icon={icon} logoSrc={icon ? undefined : logoSrc} />;
}

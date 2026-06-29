import { AppBar, Toolbar, Typography } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';

export interface OfflineBannerProps {
  isOnline: boolean;
}

/**
 * Slim banner pinned at the top of the app shell when the device is offline.
 * Auto-dismisses on reconnect (driven by the parent's `isOnline` prop).
 */
export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  if (isOnline) return null;
  return (
    <AppBar
      position="sticky"
      color="warning"
      elevation={0}
      sx={{ top: 0 }}
    >
      <Toolbar variant="dense" sx={{ justifyContent: 'center', gap: 1, minHeight: '40px !important' }}>
        <CloudOffIcon fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          You're offline — changes will sync when reconnected
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

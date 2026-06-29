import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';

interface Props {
  onClose?: () => void;
}

/**
 * Shown on iOS Safari when the app is not installed to the Home Screen.
 * iOS web push only works from a Home Screen install (iOS 16.4+).
 */
export function IosInstallBanner({ onClose }: Props) {
  return (
    <Alert
      severity="info"
      icon={false}
      action={
        onClose ? (
          <Button color="inherit" size="small" onClick={onClose}>
            Dismiss
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>Enable notifications on iPhone</AlertTitle>
      <Stack spacing={1}>
        <span>To receive push notifications, add Kippa to your Home Screen:</span>
        <span>
          <strong>1.</strong> Tap the{' '}
          <IosShareIcon fontSize="small" sx={{ verticalAlign: 'middle' }} /> Share button in
          Safari's toolbar.
        </span>
        <span>
          <strong>2.</strong> Select <strong>"Add to Home Screen"</strong>.
        </span>
        <span>
          <strong>3.</strong> Open Kippa from the Home Screen icon, then enable notifications.
        </span>
        <span style={{ opacity: 0.7, fontSize: '0.85em' }}>Requires iOS 16.4 or later.</span>
      </Stack>
    </Alert>
  );
}

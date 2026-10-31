import { Alert, AlertTitle, Button, Stack } from '@monochrome-ui/design-system';
import { IosShareIcon } from '@/components/AppIcon';
import { Typography } from '@monochrome-ui/design-system';

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
          <Button color="inherit" onClick={onClose}>
            Dismiss
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>Enable notifications on iPhone</AlertTitle>
      <Stack spacing={1}>
        <Typography variant="body2">To receive push notifications, add Kippa to your Home Screen:</Typography>
        <Typography variant="body2">
          <strong>1.</strong> Tap the <IosShareIcon fontSize="small" /> Share button in Safari's toolbar.
        </Typography>
        <Typography variant="body2">
          <strong>2.</strong> Select <strong>"Add to Home Screen"</strong>.
        </Typography>
        <Typography variant="body2">
          <strong>3.</strong> Open Kippa from the Home Screen icon, then enable notifications.
        </Typography>
        <Typography variant="fieldHint" color="text.secondary">
          Requires iOS 16.4 or later.
        </Typography>
      </Stack>
    </Alert>
  );
}

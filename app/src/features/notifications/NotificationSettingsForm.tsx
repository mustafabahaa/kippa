import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  Skeleton
} from '@mui/material';
import { NotificationSettings } from '@/domain/financeTypes';
import { useNotifications } from '@/notifications/useNotifications';
import { IosInstallBanner } from '@/notifications/IosInstallBanner';

interface NotificationSettingsFormProps {
  dbSettings: NotificationSettings;
  onSave: (settings: NotificationSettings) => Promise<void>;
  isSaving: boolean;
  /** The user's householdId, used to drive the notification permission flow. */
  householdId: string;
}

export function NotificationSettingsForm({
  dbSettings,
  onSave,
  isSaving,
  householdId
}: NotificationSettingsFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(dbSettings);
  const { status: notifStatus, requestPermission, disable } = useNotifications(householdId);

  const [permissionActionLoading, setPermissionActionLoading] = useState(false);

  const handleSaveNotifications = async () => {
    await onSave(notifSettings);
    enqueueSnackbar('Notification settings updated!', { variant: 'success' });
  };

  const handleEnableNotifications = async () => {
    setPermissionActionLoading(true);
    try {
      // MUST be a user gesture (button click) — iOS Safari requires this.
      await requestPermission();
      if (Notification.permission === 'granted') {
        enqueueSnackbar('Notifications enabled!', { variant: 'success' });
      }
    } finally {
      setPermissionActionLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setPermissionActionLoading(true);
    try {
      await disable();
      enqueueSnackbar('Notifications disabled', { variant: 'info' });
    } finally {
      setPermissionActionLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Reminders & Alerts
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            Manage reminder alerts, warning levels, and email notification configurations
          </Typography>
        </Box>

        {/* Push notification enablement — status + action.
            On iOS the permission prompt must come from a user gesture (click),
            hence the explicit button rather than an auto-prompt. */}
        {notifStatus === 'ios-not-installed' && <IosInstallBanner />}

        {notifStatus === 'unsupported' && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography color="text.secondary" sx={{ fontSize: '14px' }}>
                Push notifications aren't supported in this browser. For iPhone, add Kippa to your
                Home Screen (iOS 16.4+) to enable them.
              </Typography>
            </CardContent>
          </Card>
        )}

        {notifStatus === 'permission-denied' && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography color="text.secondary" sx={{ fontSize: '14px' }}>
                Notifications are blocked. Enable them in your device/browser settings, then reopen
                Kippa.
              </Typography>
            </CardContent>
          </Card>
        )}

        {notifStatus === 'checking' && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="180px" height={24} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="320px" height={18} />
                </Box>
                <Skeleton
                  variant="rectangular"
                  width={140}
                  height={36}
                  sx={{
                    ml: 'auto',
                    borderRadius: '12px',
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {(notifStatus === 'pending' || notifStatus === 'enabled') && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>
                    Push notifications {notifStatus === 'enabled' ? 'enabled' : 'not enabled yet'}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: '13px' }}>
                    Get reminded to log expenses and notified of household activity.
                  </Typography>
                </Box>
                 {notifStatus === 'enabled' ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisableNotifications}
                    loading={permissionActionLoading}
                    sx={{
                      ml: 'auto',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      textTransform: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleEnableNotifications}
                    loading={permissionActionLoading}
                    sx={{
                      ml: 'auto',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      textTransform: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    Enable notifications
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifSettings.dailyReminderEnabled}
                    onChange={e => setNotifSettings({ ...notifSettings, dailyReminderEnabled: e.target.checked })}
                  />
                }
                label="Daily Logging Reminder"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifSettings.auditReminderEnabled}
                    onChange={e => setNotifSettings({ ...notifSettings, auditReminderEnabled: e.target.checked })}
                  />
                }
                label="Daily Audit Reminder"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5, ml: 4 }}>
                Gentle daily reminder to check your cash and bank balances.
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifSettings.categoryWarningEnabled}
                    onChange={e => setNotifSettings({ ...notifSettings, categoryWarningEnabled: e.target.checked })}
                  />
                }
                label="Budget Warn Alerts (Category warning)"
              />

              <Button
                variant="contained"
                onClick={handleSaveNotifications}
                loading={isSaving}
                sx={{
                  mt: 1,
                  py: 1.2,
                  borderRadius: '12px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Save Preferences
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

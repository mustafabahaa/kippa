import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Button, Chip, Divider, Grid, Paper, Skeleton, Stack, Switch, Typography } from '@mui/material';
import { NotificationSettings } from '@kippa/domain';
import {
  CalendarTodayIcon,
  CreditCardIcon,
  GroupAddIcon,
  NotificationsActiveIcon,
  NotificationsIcon,
} from '@/components/AppIcon';
import { useNotifications } from '@/notifications/useNotifications';
import { IosInstallBanner } from '@/notifications/IosInstallBanner';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { SectionHeading } from '@/features/shared/components/SectionHeading';

interface NotificationSettingsFormProps {
  dbSettings: NotificationSettings;
  onSave: (settings: NotificationSettings) => Promise<void>;
  isSaving: boolean;
  /** The user's householdId, used to drive the notification permission flow. */
  householdId: string;
}

export function NotificationSettingsForm({ dbSettings, onSave, isSaving, householdId }: NotificationSettingsFormProps) {
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

  const preferences = [
    {
      key: 'dailyReminderEnabled' as const,
      title: 'Daily logging reminder',
      description: 'A gentle prompt to keep your daily records complete.',
      Icon: CalendarTodayIcon,
    },
    {
      key: 'categoryWarningEnabled' as const,
      title: 'Budget warning alerts',
      description: 'Get notified when spending approaches a category limit.',
      Icon: NotificationsIcon,
    },
    {
      key: 'cardExpiryWarningEnabled' as const,
      title: 'Card expiry reminders',
      description: 'Receive an alert before one of your linked cards expires.',
      Icon: CreditCardIcon,
    },
    {
      key: 'joinRequestEnabled' as const,
      title: 'Household join requests',
      description: 'Stay informed when a member requests access or a decision is made.',
      Icon: GroupAddIcon,
    },
  ];

  const statusContent = {
    enabled: {
      title: 'Notifications are enabled',
      description: 'Kippa can send reminders and household updates to this device.',
      label: 'Enabled',
      color: 'success' as const,
    },
    'permission-denied': {
      title: 'Notifications are blocked',
      description: 'Allow notifications in your browser or device settings, then reopen Kippa.',
      label: 'Blocked',
      color: 'error' as const,
    },
    unsupported: {
      title: 'Push is unavailable here',
      description: 'On iPhone, add Kippa to your Home Screen on iOS 16.4 or later.',
      label: 'Unavailable',
      color: 'default' as const,
    },
    pending: {
      title: 'Notifications are not enabled',
      description: 'Enable push delivery to receive reminders outside the app.',
      label: 'Not enabled',
      color: 'default' as const,
    },
    checking: {
      title: 'Checking notification status',
      description: 'Checking whether this device can receive notifications.',
      label: 'Checking',
      color: 'default' as const,
    },
    'ios-not-installed': {
      title: 'Install Kippa to enable push',
      description: 'Add Kippa to your iPhone Home Screen, then enable notifications.',
      label: 'Needs setup',
      color: 'default' as const,
    },
  }[notifStatus];

  return (
    <Box sx={{ py: 0.5 }}>
      <Stack spacing={{ xs: 3, md: 4 }}>
        <PageHeader
          title="Reminders & Alerts"
          subtitle="Choose what deserves your attention and how Kippa should reach you."
        />

        {notifStatus === 'ios-not-installed' && <IosInstallBanner />}

        <Box sx={{ width: '100%', maxWidth: 1250, alignSelf: 'center', pl: { xs: 0, md: 2 } }}>
          <Grid container columns={12} spacing={{ xs: 4, md: 5 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                <SectionHeading
                  icon={<NotificationsIcon />}
                  title="Alert preferences"
                  subtitle="Only enable the updates that help you act."
                />

                <Box sx={{ pl: { xs: 0, md: 4 } }}>
                  <Stack divider={<Divider />}>
                    {preferences.map(({ key, title, description, Icon }) => (
                      <Stack key={key} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.75 }}>
                        <Paper variant="iconBadge">
                          <Icon fontSize="small" />
                        </Paper>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="sectionLabel">{title}</Typography>
                          <Typography variant="sectionSubtitle" color="text.secondary">
                            {description}
                          </Typography>
                        </Box>
                        <Switch
                          checked={notifSettings[key]}
                          onChange={(event) => setNotifSettings({ ...notifSettings, [key]: event.target.checked })}
                          slotProps={{ input: { 'aria-label': title } }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="flex-end" sx={{ pt: 2 }}>
                    <Button variant="contained" onClick={handleSaveNotifications} loading={isSaving}>
                      Save preferences
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2}>
                <SectionHeading
                  icon={<NotificationsActiveIcon />}
                  title="Push delivery"
                  subtitle="Notification status for this device."
                />

                <Stack spacing={2} sx={{ pl: { xs: 0, md: 4 } }}>
                  {notifStatus === 'checking' ? (
                    <Stack spacing={1.5}>
                      <Skeleton variant="text" width="65%" />
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="rounded" width={150} height={40} />
                    </Stack>
                  ) : (
                    <>
                      <Chip
                        label={statusContent.label}
                        color={statusContent.color}
                        variant={statusContent.color === 'default' ? 'outlined' : 'filled'}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                      <Box>
                        <Typography variant="sectionLabel">{statusContent.title}</Typography>
                        <Typography variant="sectionSubtitle" color="text.secondary">
                          {statusContent.description}
                        </Typography>
                      </Box>
                      {(notifStatus === 'pending' || notifStatus === 'enabled') && (
                        <Button
                          variant={notifStatus === 'enabled' ? 'outlined' : 'contained'}
                          color={notifStatus === 'enabled' ? 'error' : 'primary'}
                          onClick={notifStatus === 'enabled' ? handleDisableNotifications : handleEnableNotifications}
                          loading={permissionActionLoading}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          {notifStatus === 'enabled' ? 'Disable on this device' : 'Enable notifications'}
                        </Button>
                      )}
                    </>
                  )}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Box>
  );
}

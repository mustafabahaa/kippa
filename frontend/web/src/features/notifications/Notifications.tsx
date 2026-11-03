import { Box, Divider, Grid, Skeleton, Stack } from '@monochrome-ui/design-system';
import { useNotificationSettings, useUpdateNotificationSettingsMutation } from '@/hooks/useFinance';
import { NotificationSettings } from '@kippa/domain';
import { NotificationSettingsForm } from '@/features/notifications/NotificationSettingsForm';
import { useAppContext } from '@/hooks/useAppContext';

export function Notifications() {
  const { householdId, userProfile } = useAppContext();
  const userId = userProfile?.uid || '';

  const { data: dbSettings, isLoading } = useNotificationSettings(householdId, userId);
  const updateSettingsMutation = useUpdateNotificationSettingsMutation();

  const handleSave = async (settings: NotificationSettings) => {
    await updateSettingsMutation.mutateAsync({
      householdId,
      userId,
      settings,
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 0.5 }}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Box>
            <Skeleton variant="text" width={220} height={40} />
            <Skeleton variant="text" width="100%" height={24} sx={{ maxWidth: 390 }} />
          </Box>
          <Box sx={{ width: '100%', maxWidth: 1250, alignSelf: 'center', pl: { xs: 0, md: 2 } }}>
            <Grid container columns={12} spacing={{ xs: 4, md: 5 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={2}>
                  <Box>
                    <Skeleton variant="text" width={190} height={28} />
                    <Skeleton variant="text" width={270} height={20} />
                  </Box>
                  <Stack divider={<Divider />}>
                    {[0, 1, 2, 3].map((item) => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.75 }}>
                        <Skeleton variant="rounded" width={44} height={44} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="38%" />
                          <Skeleton variant="text" width="70%" />
                        </Box>
                        <Skeleton variant="rounded" width={40} height={24} />
                      </Stack>
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="flex-end" sx={{ pt: 2 }}>
                    <Skeleton variant="rounded" width={150} height={40} />
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={2}>
                  <Box>
                    <Skeleton variant="text" width={160} height={28} />
                    <Skeleton variant="text" width={215} height={20} />
                  </Box>
                  <Stack spacing={1.5}>
                    <Skeleton variant="rounded" width={92} height={28} />
                    <Skeleton variant="text" width="78%" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="rounded" width={170} height={40} />
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>
    );
  }

  const defaultSettings: NotificationSettings = dbSettings || {
    userId,
    householdId,
    dailyReminderEnabled: true,
    categoryWarningEnabled: true,
    cardExpiryWarningEnabled: true,
    joinRequestEnabled: true,
  };

  return (
    <NotificationSettingsForm
      key={dbSettings ? `${dbSettings.userId}-${dbSettings.householdId}` : 'loading'}
      dbSettings={defaultSettings}
      onSave={handleSave}
      isSaving={updateSettingsMutation.isPending}
      householdId={householdId}
    />
  );
}

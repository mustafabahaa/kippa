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
  TextField,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { NotificationSettings } from '../../domain/financeTypes';

interface NotificationSettingsFormProps {
  dbSettings: NotificationSettings;
  onSave: (settings: NotificationSettings) => Promise<void>;
  isSaving: boolean;
}

export function NotificationSettingsForm({
  dbSettings,
  onSave,
  isSaving
}: NotificationSettingsFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(dbSettings);

  const handleSaveNotifications = async () => {
    await onSave(notifSettings);
    enqueueSnackbar('Notification settings updated!', { variant: 'success' });
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
              
              {notifSettings.dailyReminderEnabled && (
                <TextField
                  label="Reminder Time"
                  type="time"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={notifSettings.dailyReminderTime}
                  onChange={e => setNotifSettings({ ...notifSettings, dailyReminderTime: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, width: '150px' }}
                />
              )}

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={notifSettings.categoryWarningEnabled} 
                    onChange={e => setNotifSettings({ ...notifSettings, categoryWarningEnabled: e.target.checked })} 
                  />
                }
                label="Budget Warn Alerts (Category warning)"
              />

              <FormControlLabel
                disabled
                control={
                  <Checkbox
                    checked={notifSettings.savingWarningEnabled}
                  />
                }
                label="Saving Warning Alerts"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5, ml: 4 }}>
                Coming soon
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={notifSettings.cycleCloseReminderEnabled} 
                    onChange={e => setNotifSettings({ ...notifSettings, cycleCloseReminderEnabled: e.target.checked })} 
                  />
                }
                label="Remind me to close active cycle at end of month"
              />

              <Button
                variant="contained"
                onClick={handleSaveNotifications}
                disabled={isSaving}
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

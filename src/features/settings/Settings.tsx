import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  Button, 
  TextField, 
  Divider, 
  Alert,
  FormControlLabel,
  Checkbox,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { dbService } from '../../services/dbService';
import { ledgerService } from '../../services/ledgerService';
import { NotificationSettings, Category, Account, CategoryPriority, AccountType, CurrencyCode } from '../../domain/financeTypes';

interface SettingsProps {
  householdId: string;
  userId: string;
  categories: Category[];
  accounts: Account[];
  onDataUpdated: () => void;
}

export function Settings({
  householdId,
  userId,
  categories,
  accounts,
  onDataUpdated
}: SettingsProps) {
  // Notification settings
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    userId,
    householdId,
    dailyReminderEnabled: true,
    dailyReminderTime: '21:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    categoryWarningEnabled: true,
    savingWarningEnabled: true,
    cycleCloseReminderEnabled: true
  });

  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatPriority, setNewCatPriority] = useState<CategoryPriority>('flexible');

  // New Account State
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('bank');
  const [newAccCurrency, setNewAccCurrency] = useState<CurrencyCode>('EGP');

  useEffect(() => {
    loadNotificationSettings();
  }, [userId, householdId]);

  const loadNotificationSettings = async () => {
    const data = await dbService.getDoc(householdId, 'notificationSettings', userId);
    if (data) {
      setNotifSettings(data as NotificationSettings);
    }
  };

  const handleSaveNotifications = async () => {
    setNotifSuccess(null);
    await dbService.setDoc(householdId, 'notificationSettings', userId, notifSettings);
    setNotifSuccess('Notification settings updated!');
  };

  const handleCopyHouseholdId = () => {
    navigator.clipboard.writeText(householdId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;

    await ledgerService.createCategory(householdId, {
      name: newCatName,
      type: newCatType,
      priority: newCatPriority,
      isActive: true
    });

    setNewCatName('');
    onDataUpdated();
  };

  const handleCreateAccount = async () => {
    if (!newAccName.trim()) return;

    // Calculate sort order
    const nextOrder = accounts.length > 0 ? Math.max(...accounts.map(a => a.sortOrder)) + 1 : 1;

    await ledgerService.createAccount(householdId, {
      name: newAccName,
      type: newAccType,
      currency: newAccCurrency,
      isActive: true,
      sortOrder: nextOrder
    });

    setNewAccName('');
    onDataUpdated();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h1">Settings</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure categories, accounts, sharing credentials, and reminders.
          </Typography>
        </Box>

        {/* Sharing Container */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>Household Sharing</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
              Share this household ID with your partner so they can access the same ledger.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <TextField
                fullWidth
                size="small"
                label="Household ID"
                value={householdId}
                InputProps={{ readOnly: true }}
              />
              <Button 
                variant="outlined" 
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyHouseholdId}
                sx={{ whiteSpace: 'nowrap', minHeight: 40 }}
              >
                {copySuccess ? 'Copied!' : 'Copy ID'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Notifications Preferences */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 2.5 }}>
              <NotificationsActiveIcon color="primary" />
              <Typography variant="h3">Reminders & Notifications</Typography>
            </Box>

            {notifSuccess && <Alert severity="success" sx={{ mb: 2.5 }}>{notifSuccess}</Alert>}

            <Stack spacing={2.5}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={notifSettings.dailyReminderEnabled}
                    onChange={e => setNotifSettings({ ...notifSettings, dailyReminderEnabled: e.target.checked })}
                  />
                }
                label="Daily Missing Expense Reminder (if no expenses entered by set time)"
              />

              {notifSettings.dailyReminderEnabled && (
                <Stack direction="row" spacing={2} sx={{ pl: 4 }}>
                  <TextField
                    type="time"
                    size="small"
                    label="Reminder Time"
                    value={notifSettings.dailyReminderTime}
                    onChange={e => setNotifSettings({ ...notifSettings, dailyReminderTime: e.target.value })}
                    sx={{ width: 140 }}
                  />
                  <TextField
                    size="small"
                    label="Timezone"
                    value={notifSettings.timezone}
                    InputProps={{ readOnly: true }}
                    sx={{ width: 220 }}
                  />
                </Stack>
              )}

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={notifSettings.categoryWarningEnabled}
                    onChange={e => setNotifSettings({ ...notifSettings, categoryWarningEnabled: e.target.checked })}
                  />
                }
                label="Enable category overspending warning alert"
              />

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={notifSettings.savingWarningEnabled}
                    onChange={e => setNotifSettings({ ...notifSettings, savingWarningEnabled: e.target.checked })}
                  />
                }
                label="Enable alerts when projected savings fall below target"
              />

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={notifSettings.cycleCloseReminderEnabled}
                    onChange={e => setNotifSettings({ ...notifSettings, cycleCloseReminderEnabled: e.target.checked })}
                  />
                }
                label="Enable reminder when cycle is past expected end date"
              />

              <Button 
                variant="contained" 
                onClick={handleSaveNotifications}
                sx={{ alignSelf: 'flex-start', px: 4 }}
              >
                Save Notification Settings
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Category Setup */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 2.5 }}>Manage Categories</Typography>
            
            {/* Create Category form */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
              <TextField
                size="small"
                label="New Category Name"
                placeholder="e.g. Subscriptions"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                sx={{ flex: 2 }}
              />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newCatType}
                  label="Type"
                  onChange={e => setNewCatType(e.target.value as any)}
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1.5 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newCatPriority}
                  label="Priority"
                  onChange={e => setNewCatPriority(e.target.value as any)}
                >
                  <MenuItem value="essential">Essential</MenuItem>
                  <MenuItem value="flexible">Flexible</MenuItem>
                  <MenuItem value="saving">Saving</MenuItem>
                  <MenuItem value="debt">Debt</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleCreateCategory}>
                Add
              </Button>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              EXISTING CATEGORIES
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {categories.map(cat => (
                <Chip
                  key={cat.id}
                  label={`${cat.name} (${cat.priority})`}
                  color={cat.type === 'income' ? 'success' : 'default'}
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Account Setup */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 2.5 }}>Manage Accounts</Typography>

            {/* Create Account form */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
              <TextField
                size="small"
                label="New Account Name"
                placeholder="e.g. HSBA Card"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                sx={{ flex: 2 }}
              />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newAccType}
                  label="Type"
                  onChange={e => setNewAccType(e.target.value as any)}
                >
                  <MenuItem value="bank">Bank Account</MenuItem>
                  <MenuItem value="cash">Cash Box</MenuItem>
                  <MenuItem value="wallet">Wallet</MenuItem>
                  <MenuItem value="card">Credit Card</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={newAccCurrency}
                  label="Currency"
                  onChange={e => setNewAccCurrency(e.target.value as any)}
                >
                  <MenuItem value="EGP">EGP</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleCreateAccount}>
                Add
              </Button>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              EXISTING ACCOUNTS
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {accounts.map(acc => (
                <Chip
                  key={acc.id}
                  label={`${acc.name} (${acc.currency})`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

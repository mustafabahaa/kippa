import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha
} from '@mui/material';

// Action icons
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PieChartIcon from '@mui/icons-material/PieChart';
import SavingsIcon from '@mui/icons-material/Savings';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';

import { PageHeader } from '@/features/shared/components/PageHeader';
import { useAuditLog, useUnreadActivityCount } from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { AuditAction, AuditLogEntry } from '@/domain/financeTypes';
import { TransactionIcon } from '@/features/transactions/components/TransactionIcon';

interface ActionVisual {
  Icon: React.ComponentType<{ sx?: object }>;
  color: string;
  bg: string;
}

/** Maps an audit action to its icon and color treatment. */
function getActionVisual(action: AuditAction, theme: any): ActionVisual {
  switch (action) {
    case 'transaction_created':
      // Could be income/expense/conversion — neutral-ish blue handled per-entry in summary
      return { Icon: ShoppingCartIcon, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.10) };
    case 'transaction_updated':
      return { Icon: EditIcon, color: theme.palette.text.secondary, bg: alpha(theme.palette.text.secondary, 0.10) };
    case 'transaction_voided':
      return { Icon: CancelIcon, color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.10) };
    case 'account_created':
    case 'account_updated':
      return { Icon: AccountBalanceIcon, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.10) };
    case 'category_created':
    case 'category_updated':
      return { Icon: CategoryIcon, color: theme.palette.text.secondary, bg: alpha(theme.palette.text.secondary, 0.10) };
    case 'cycle_created':
    case 'cycle_status_changed':
      return { Icon: CalendarMonthIcon, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.10) };
    case 'allocation_saved':
    case 'allocations_batch_saved':
      return { Icon: PieChartIcon, color: theme.palette.text.secondary, bg: alpha(theme.palette.text.secondary, 0.10) };
    case 'expected_income_saved':
      return { Icon: SavingsIcon, color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.10) };
    case 'reconciliation_created':
      return { Icon: SyncAltIcon, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.10) };
    case 'notification_settings_updated':
      return { Icon: NotificationsActiveIcon, color: theme.palette.text.secondary, bg: alpha(theme.palette.text.secondary, 0.10) };
    case 'household_joined':
    case 'household_left':
      return { Icon: HomeIcon, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.10) };
    default:
      return { Icon: HistoryIcon, color: theme.palette.text.secondary, bg: theme.palette.action.hover };
  }
}

/**
 * Groups raw AuditAction values into the filter options shown in the UI.
 * Mirrors the per-case icon mapping in getActionVisual above.
 */
const ACTION_GROUPS: { label: string; actions: AuditAction[] }[] = [
  { label: 'Transactions', actions: ['transaction_created', 'transaction_updated', 'transaction_voided'] },
  { label: 'Accounts', actions: ['account_created', 'account_updated'] },
  { label: 'Categories', actions: ['category_created', 'category_updated'] },
  { label: 'Budget Cycles', actions: ['cycle_created', 'cycle_status_changed'] },
  { label: 'Allocations', actions: ['allocation_saved', 'allocations_batch_saved', 'expected_income_saved'] },
  { label: 'Reconciliation', actions: ['reconciliation_created'] },
  { label: 'Household', actions: ['household_joined', 'household_left'] },
  { label: 'Settings', actions: ['notification_settings_updated'] },
];

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function isYesterday(date: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return date.getFullYear() === y.getFullYear()
    && date.getMonth() === y.getMonth()
    && date.getDate() === y.getDate();
}

function dayKey(entry: AuditLogEntry): string {
  return entry.createdAt.slice(0, 10); // YYYY-MM-DD
}

function dayLabel(key: string): string {
  const date = new Date(key + 'T00:00:00');
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Compact relative timestamp, e.g. "2m ago", "3h ago", "Just now". */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return 'Just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function initials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const theme = useTheme();
  const { maskDigits } = usePrivacyMask();
  const { Icon, color, bg } = getActionVisual(entry.action, theme);
  return (
    <ListItem
      disableGutters
      sx={{
        px: 2,
        py: 1.75,
        alignItems: 'flex-start',
        '&:hover': { bgcolor: 'action.hover' },
        transition: 'background-color 0.15s ease',
      }}
    >
      <Stack direction="row" spacing={1.75} sx={{ width: '100%', alignItems: 'flex-start' }}>
        {/* Action icon badge */}
        {entry.action === 'transaction_created' ? (
          <TransactionIcon type={entry.details?.type || 'expense'} size={38} />
        ) : (
          <Box
            sx={{
              mt: 0.25,
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color, fontSize: 20 }} />
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              fontSize: '13.5px',
              lineHeight: 1.45,
              wordBreak: 'break-word',
            }}
          >
            {maskDigits(entry.summary)}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
            <Avatar
              src={entry.userPhotoURL || undefined}
              sx={{
                width: 18,
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 600,
                bgcolor: 'primary.main',
              }}
            >
              {initials(entry.userDisplayName)}
            </Avatar>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11.5px', fontWeight: 500 }}>
              {entry.userDisplayName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'disabled', fontSize: '11.5px' }}>
              • {relativeTime(entry.createdAt)}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </ListItem>
  );
}

export function AuditLog() {
  const { householdId, userProfile } = useAppContext();
  const { entries, isLoading } = useAuditLog(householdId, 200);
  const { markSeen } = useUnreadActivityCount(householdId, userProfile?.uid);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');

  const handleSearch = (value: string) => { setSearchTerm(value); resetPage(); };
  const handleActionChange = (value: string) => { setSelectedAction(value); resetPage(); };
  const handleMemberChange = (value: string) => { setSelectedMember(value); resetPage(); };

  // Pagination State
  const PAGE_SIZE = 25;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const resetPage = () => setVisibleCount(PAGE_SIZE);

  // Clear the unread badge as soon as the feed is opened.
  useEffect(() => {
    markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unique members, derived from loaded entries (no extra query needed).
  const members = useMemo(() => {
    const map = new Map<string, { userId: string; userDisplayName: string }>();
    for (const e of entries) {
      if (e.userId && !map.has(e.userId)) {
        map.set(e.userId, { userId: e.userId, userDisplayName: e.userDisplayName });
      }
    }
    return Array.from(map.values());
  }, [entries]);

  // Apply current filters.
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 1. Text search over summary
      const searchMatch = (entry.summary || '').toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Action group
      let actionMatch = true;
      if (selectedAction !== 'all') {
        const group = ACTION_GROUPS.find((g) => g.label === selectedAction);
        actionMatch = !!group && group.actions.includes(entry.action);
      }

      // 3. Member
      let memberMatch = true;
      if (selectedMember !== 'all') {
        memberMatch = entry.userId === selectedMember;
      }

      return searchMatch && actionMatch && memberMatch;
    });
  }, [entries, searchTerm, selectedAction, selectedMember]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);

  // Group visible entries by calendar day (already sorted desc by the subscription query).
  const grouped = useMemo(() => {
    const map = new Map<string, AuditLogEntry[]>();
    for (const entry of visibleEntries) {
      const key = dayKey(entry);
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    }
    return Array.from(map.entries()); // [dayKey, entries][]
  }, [visibleEntries]);

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack spacing={3}>
        <PageHeader
          title="Activity Log"
          subtitle="A real-time timeline of everything happening in your household"
        />

        {isLoading ? (
          <Card sx={{ p: 1 }}>
            <Stack divider={<Divider />}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Stack key={i} direction="row" spacing={1.75} sx={{ p: 1.75, alignItems: 'center' }}>
                  <Skeleton variant="circular" width={38} height={38} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="85%" height={18} />
                    <Skeleton variant="text" width="40%" height={14} />
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Card>
        ) : entries.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                bgcolor: 'secondary.container',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              No activity yet
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '13px' }}>
              Actions you and your household take — logging expenses, creating cycles,
              updating accounts — will appear here in real time.
            </Typography>
          </Card>
        ) : (
          <>
            {/* Filter Bar — mirrors TransactionHistory styling */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Search activity..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '20px' }} />,
                  },
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />

              <FormControl sx={{ minWidth: 160, width: { xs: '100%', md: 'auto' } }}>
                <InputLabel id="activity-action-label">Action</InputLabel>
                <Select
                  labelId="activity-action-label"
                  value={selectedAction}
                  label="Action"
                  onChange={(e) => handleActionChange(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  {ACTION_GROUPS.map((g) => (
                    <MenuItem key={g.label} value={g.label}>{g.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 160, width: { xs: '100%', md: 'auto' } }}>
                <InputLabel id="activity-member-label">Member</InputLabel>
                <Select
                  labelId="activity-member-label"
                  value={selectedMember}
                  label="Member"
                  onChange={(e) => handleMemberChange(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="all">All Members</MenuItem>
                  {members.map((m) => (
                    <MenuItem key={m.userId} value={m.userId}>{m.userDisplayName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {filteredEntries.length === 0 ? (
              <Card sx={{ p: 5, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '13px' }}>
                  No activity matches the selected filters.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {grouped.map(([key, dayEntries]) => (
                  <Box key={key}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        mb: 1,
                        px: 0.5,
                      }}
                    >
                      {dayLabel(key)}
                    </Typography>
                    <Card sx={{ p: 0, overflow: 'hidden' }}>
                      <List disablePadding>
                        {dayEntries.map((entry, idx) => (
                          <Box key={entry.id}>
                            <AuditLogRow entry={entry} />
                            {idx < dayEntries.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    </Card>
                  </Box>
                ))}

                {visibleCount < filteredEntries.length && (
                  <Box sx={{ textAlign: 'center', py: 1.5 }}>
                    <Button
                      size="small"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      sx={{ borderRadius: '12px' }}
                    >
                      Load more ({filteredEntries.length - visibleCount} remaining)
                    </Button>
                  </Box>
                )}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

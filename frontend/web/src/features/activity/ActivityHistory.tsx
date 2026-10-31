import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Button, Chip, Grid, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material';
import type { AuditAction, AuditLogEntry } from '@kippa/domain';
import { SearchIcon } from '@/components/AppIcon';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { MultiSelectFilter } from '@/features/shared/components/MultiSelectFilter';
import { useAuditLog, useUnreadActivityCount } from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';

const PAGE_SIZE = 25;
const sectionIndent = { xs: 0, md: 2 } as const;
const contentIndent = { xs: 0, md: 2 } as const;

type ActionGroup = { id: string; label: string; actions: AuditAction[] };

const ACTION_GROUPS: ActionGroup[] = [
  {
    id: 'transactions',
    label: 'Transactions',
    actions: ['transaction_created', 'transaction_updated', 'transaction_voided'],
  },
  { id: 'accounts', label: 'Accounts', actions: ['account_created', 'account_updated'] },
  { id: 'categories', label: 'Categories', actions: ['category_created', 'category_updated'] },
  { id: 'cycles', label: 'Budget cycles', actions: ['cycle_created', 'cycle_status_changed'] },
  {
    id: 'allocations',
    label: 'Allocations',
    actions: ['allocation_saved', 'allocations_batch_saved', 'expected_income_saved'],
  },
  { id: 'reconciliation', label: 'Reconciliation', actions: ['reconciliation_created'] },
  { id: 'loans', label: 'Loans', actions: ['loan_created', 'loan_updated', 'loan_payment_recorded'] },
  { id: 'household', label: 'Household', actions: ['household_joined', 'household_left'] },
  { id: 'settings', label: 'Settings', actions: ['notification_settings_updated'] },
  { id: 'pending', label: 'Pending review', actions: ['pending_message_discarded', 'pending_message_restored'] },
];

function getActionGroup(action: AuditAction) {
  return ACTION_GROUPS.find((group) => group.actions.includes(action))?.label ?? 'Activity';
}

function formatActivityDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  return `${day} · ${time}`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs)) return '';
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function getSummary(entry: AuditLogEntry): string {
  const prefix = `${entry.userDisplayName} `;
  return entry.summary.startsWith(prefix) ? entry.summary.slice(prefix.length) : entry.summary;
}

function getActivityAmount(entry: AuditLogEntry): string | null {
  const details = entry.details ?? {};
  const amount = typeof details.amount === 'number' ? details.amount : details.plannedAmount;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
  const currency = typeof details.currency === 'string' ? ` ${details.currency}` : '';
  const sign =
    (entry.action === 'transaction_created' && details.type === 'income') || entry.action === 'expected_income_saved'
      ? '+'
      : entry.action === 'transaction_created' && details.type === 'expense'
        ? '−'
        : '';
  return `${sign}${amount.toLocaleString()}${currency}`;
}

function ActivityHistoryRow({ entry }: { entry: AuditLogEntry }) {
  const { maskDigits } = usePrivacyMask();
  const name = entry.userDisplayName || 'Household member';
  const amount = getActivityAmount(entry);

  return (
    <Paper
      component="article"
      variant="timelineRow"
      sx={{
        minHeight: 82,
        px: 2,
        py: 1.5,
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(180px, 0.7fr) minmax(0, 1.3fr)' },
        columnGap: { xs: 1.5, md: 3 },
        rowGap: { xs: 1, md: 0 },
        alignItems: 'center',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar
          className="kippa-stepper-node"
          src={entry.userPhotoURL || undefined}
          sx={{ width: 28, height: 28, flexShrink: 0 }}
        >
          {name.slice(0, 1).toUpperCase()}
        </Avatar>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {formatActivityDateTime(entry.createdAt)}
          </Typography>
        </Stack>
      </Stack>

      <Stack spacing={0.25} alignItems="flex-end" sx={{ minWidth: 0, textAlign: 'right' }}>
        {amount && (
          <Typography variant="transactionAmount" color="text.primary">
            {maskDigits(amount)}
          </Typography>
        )}
        <Typography variant="sectionLabel" sx={{ overflowWrap: 'anywhere' }}>
          {maskDigits(getSummary(entry))}
        </Typography>
        <Typography variant="sectionSubtitle" color="text.secondary">
          {getActionGroup(entry.action)} · {relativeTime(entry.createdAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ActivityHistorySkeleton() {
  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ width: '100%' }}>
      <PageHeader title="Activity history" subtitle="A chronological record of changes across your household." />
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1000, alignSelf: 'center' }}>
        <Box component="section" sx={{ px: sectionIndent }}>
          <Stack spacing={1.25} sx={{ px: contentIndent }}>
            <Box>
              <Skeleton variant="text" width={100} height={28} />
              <Skeleton variant="text" width={360} height={20} />
            </Box>
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <Skeleton variant="rounded" height={56} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rounded" height={56} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rounded" height={56} />
              </Grid>
            </Grid>
          </Stack>
        </Box>
        <Box component="section" sx={{ px: sectionIndent }}>
          <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 900, mx: 'auto', px: contentIndent }}>
            <Stack direction="row" justifyContent="space-between">
              <Skeleton variant="text" width={150} height={28} />
              <Skeleton variant="rounded" width={75} height={28} />
            </Stack>
            <Stack className="kippa-stepper">
              {[0, 1, 2, 3, 4].map((item) => (
                <Stack
                  key={item}
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  sx={{ px: 2, py: 1.5, minHeight: 82 }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { md: '35%' } }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="48%" />
                      <Skeleton variant="text" width="38%" />
                    </Box>
                  </Stack>
                  <Box sx={{ flex: 1, width: '100%' }}>
                    <Skeleton variant="text" width={115} height={24} />
                    <Skeleton variant="text" width="72%" />
                    <Skeleton variant="text" width="34%" />
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}

export function ActivityHistory() {
  const { householdId, userProfile } = useAppContext();
  const { entries, isLoading } = useAuditLog(householdId, 200);
  const { markSeen } = useUnreadActivityCount(householdId, userProfile?.uid);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionGroups, setSelectedActionGroups] = useState<string[] | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const members = useMemo(() => {
    const uniqueMembers = new Map<string, { id: string; label: string }>();
    entries.forEach((entry) => {
      if (entry.userId && !uniqueMembers.has(entry.userId)) {
        uniqueMembers.set(entry.userId, { id: entry.userId, label: entry.userDisplayName || 'Household member' });
      }
    });
    return [...uniqueMembers.values()];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const actionIds = selectedActionGroups?.length
      ? ACTION_GROUPS.filter((group) => selectedActionGroups.includes(group.id)).flatMap((group) => group.actions)
      : null;
    return entries.filter((entry) => {
      const matchesSearch = `${entry.summary} ${entry.userDisplayName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesAction = actionIds === null || actionIds.includes(entry.action);
      const matchesMember = selectedMemberIds === null || selectedMemberIds.includes(entry.userId);
      return matchesSearch && matchesAction && matchesMember;
    });
  }, [entries, searchTerm, selectedActionGroups, selectedMemberIds]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setVisibleCount(PAGE_SIZE);
  };

  if (isLoading) return <ActivityHistorySkeleton />;

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ width: '100%' }}>
      <PageHeader title="Activity history" subtitle="A chronological record of changes across your household." />

      <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ width: '100%', maxWidth: 1000, alignSelf: 'center' }}>
        <Box component="section" sx={{ px: sectionIndent }}>
          <Stack spacing={1.25} sx={{ px: contentIndent }}>
            <SectionHeading title="Filters" subtitle="Search activity and narrow it by action or household member." />
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <TextField
                  fullWidth
                  label="Search"
                  placeholder="Search activity"
                  value={searchTerm}
                  onChange={(event) => handleSearch(event.target.value)}
                  slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MultiSelectFilter
                  label="Actions"
                  allLabel="All actions"
                  searchPlaceholder={selectedActionGroups?.length === 0 ? 'No actions selected' : 'Search actions'}
                  options={ACTION_GROUPS.map(({ id, label }) => ({ id, label }))}
                  selectedIds={selectedActionGroups}
                  onChange={(value) => {
                    setSelectedActionGroups(value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MultiSelectFilter
                  label="Members"
                  allLabel="All members"
                  searchPlaceholder={selectedMemberIds?.length === 0 ? 'No members selected' : 'Search members'}
                  options={members}
                  selectedIds={selectedMemberIds}
                  onChange={(value) => {
                    setSelectedMemberIds(value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
              </Grid>
            </Grid>
          </Stack>
        </Box>

        <Box component="section" sx={{ px: sectionIndent }}>
          <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
            <SectionHeading
              title="Activity history"
              subtitle="Recent household changes, with the person and time for each event."
              trailing={<Chip size="small" label={`${filteredEntries.length} results`} />}
            />
            <Stack spacing={1.5} sx={{ px: contentIndent }}>
              {filteredEntries.length === 0 ? (
                <EmptyLayout
                  icon={<SearchIcon fontSize="small" />}
                  title={entries.length === 0 ? 'No activity yet' : 'No matching activity'}
                  description={
                    entries.length === 0
                      ? 'Changes to transactions, accounts, budgets, and household settings will appear here.'
                      : 'Try another search or broaden the selected actions and members.'
                  }
                />
              ) : (
                <>
                  <Stack className="kippa-stepper">
                    {filteredEntries.slice(0, visibleCount).map((entry) => (
                      <ActivityHistoryRow key={entry.id} entry={entry} />
                    ))}
                  </Stack>
                  {visibleCount < filteredEntries.length && (
                    <Button
                      variant="segmented"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      sx={{ alignSelf: 'center' }}
                    >
                      Show more · {filteredEntries.length - visibleCount} remaining
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}

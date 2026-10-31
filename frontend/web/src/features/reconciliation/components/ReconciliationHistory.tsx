import type { ReactNode } from 'react';
import { useState } from 'react';
import { Box, Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import type { Account, Reconciliation } from '@kippa/domain';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { CheckCircleIcon } from '@/components/AppIcon';
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/hooks/useAppContext';
import { auth } from '@/config/firebase';
import { formatShortTime } from '@/libs/dateFormatting';
import { RECONCILIATION_HISTORY_PAGE_SIZE } from '@/libs/ledger';

type Props = {
  accounts: Account[];
  pages: Reconciliation[][];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onNextPage: () => Promise<boolean>;
  mask: (value: string) => string;
  renderAccountIcon: (type: Account['type']) => ReactNode;
};

function formatReconciliationDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ReconciliationHistory({ accounts, pages, hasNextPage, isFetchingNextPage, onNextPage, mask }: Props) {
  const [page, setPage] = useState(0);
  const { householdMembers, userProfile } = useAppContext();
  const currentPage = Math.min(page, Math.max(0, pages.length - 1));
  const visibleHistory = pages[currentPage] ?? [];
  const hasPreviousPage = currentPage > 0;
  const canGoNext = currentPage < pages.length - 1 || hasNextPage;
  const startIndex = currentPage * RECONCILIATION_HISTORY_PAGE_SIZE;
  const endIndex = startIndex + visibleHistory.length;

  const handleNextPage = async () => {
    if (currentPage < pages.length - 1) {
      setPage(currentPage + 1);
      return;
    }
    if (await onNextPage()) setPage(currentPage + 1);
  };

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <SectionHeading
        icon={<CheckCircleIcon variant="Linear" />}
        title="Reconciliation history"
        subtitle="Recent balance checks and corrections."
        trailing={<Chip size="small" label={`${RECONCILIATION_HISTORY_PAGE_SIZE} per page`} />}
      />

      <Box sx={{ pl: { xs: 0, md: 4 } }}>
        {pages.length === 0 || visibleHistory.length === 0 ? (
          <EmptyLayout title="No reconciliation history" description="Completed balance checks will appear here." />
        ) : (
          <Stack className="kippa-stepper">
            {visibleHistory.map((item) => {
              const account = accounts.find((candidate) => candidate.id === item.accountId);
              const matched = Math.abs(item.difference) < 0.001;
              const differenceColor = matched ? 'text.secondary' : item.difference > 0 ? 'success.main' : 'error.main';
              const householdMember = householdMembers.find((member) => member.uid === item.createdBy);
              const isCurrentUser = item.createdBy === userProfile?.uid;
              const creator =
                isCurrentUser && userProfile
                  ? {
                      ...householdMember,
                      ...userProfile,
                      photoURL: auth?.currentUser?.photoURL || userProfile.photoURL || householdMember?.photoURL,
                    }
                  : householdMember;

              return (
                <Box
                  key={item.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1.1fr) minmax(0, 1fr)' },
                    gridTemplateAreas: { xs: '"timeline" "details"', sm: '"timeline details"' },
                    columnGap: 2,
                    rowGap: { xs: 1, sm: 0 },
                    alignItems: 'center',
                    minWidth: 0,
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, gridArea: 'timeline' }}>
                    {creator ? (
                      <Tooltip title={`Reconciled by ${creator.displayName}`}>
                        <UserAvatar
                          className="kippa-stepper-node"
                          photoURLs={[
                            isCurrentUser ? auth?.currentUser?.photoURL : undefined,
                            creator.photoURL,
                            householdMember?.photoURL,
                          ]}
                          displayName={creator.displayName}
                          sx={{ width: 28, height: 28 }}
                        />
                      </Tooltip>
                    ) : (
                      <Box
                        sx={{
                          display: 'grid',
                          placeItems: 'center',
                          width: 28,
                          height: 28,
                          flex: '0 0 28px',
                          color: 'text.secondary',
                        }}
                      >
                        <CheckCircleIcon variant="Linear" />
                      </Box>
                    )}
                    <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="transactionAmount" color={differenceColor} noWrap>
                        {matched
                          ? 'Matched'
                          : `${item.difference > 0 ? '+' : ''}${mask(`${item.difference.toFixed(2)} ${item.currency}`)}`}
                      </Typography>
                      {creator && (
                        <Typography variant="body2" color="text.primary" noWrap>
                          {creator.displayName}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {formatReconciliationDate(item.date)} · {formatShortTime(item.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack
                    sx={{ minWidth: 0, gridArea: 'details', textAlign: { xs: 'left', sm: 'right' } }}
                    spacing={0.25}
                  >
                    <Typography variant="sectionLabel" noWrap>
                      {account?.name || 'Unknown account'}
                    </Typography>
                    <Typography variant="sectionSubtitle" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      Actual{' '}
                      {mask(
                        `${item.actualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${item.currency}`,
                      )}
                      {' · '}Calculated{' '}
                      {mask(
                        `${item.calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${item.currency}`,
                      )}
                    </Typography>
                    {item.note && (
                      <Typography variant="sectionSubtitle" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {item.note}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}

        {(hasPreviousPage || canGoNext) && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ pt: 1.5 }}>
            <Typography variant="fieldHint" color="text.secondary">
              {startIndex + 1}–{endIndex}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Button size="small" disabled={!hasPreviousPage} onClick={() => setPage(currentPage - 1)}>
                Previous
              </Button>
              <Button size="small" disabled={!canGoNext || isFetchingNextPage} onClick={handleNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Next'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

import { IconCircleCheck } from '@tabler/icons-react';
import { Badge, Box, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import type { CardCharge, CardChargeGroup } from '@/libs/cardActivity';
import type { Card, Category, FinanceTransaction } from '@kippa/domain';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { UserAvatar } from '@/components/UserAvatar';
import { auth } from '@/config/firebase';
import { useAppContext } from '@/hooks/useAppContext';
import { formatShortTime } from '@/libs/dateFormatting';

type Props = {
  card: Card;
  categories: Category[];
  groups: CardChargeGroup[];
  transactions: FinanceTransaction[];
  mask: (value: string) => string;
  onLoadMore: () => void;
  onPay: (charge: CardCharge) => void;
  visibleCount: number;
};

export function CardActivityList({
  card,
  categories,
  groups,
  transactions,
  mask,
  onLoadMore,
  onPay,
  visibleCount,
}: Props) {
  const { userProfile, householdMembers } = useAppContext();
  const transactionById = new Map(transactions.map((transaction) => [transaction.id, transaction]));
  if (groups.length === 0)
    return (
      <EmptyLayout title="No charges yet" description="Transactions on this card will appear here grouped by cycle." />
    );
  return (
    <Stack divider={<Divider />} sx={{ width: '100%', minWidth: 0 }}>
      {groups.slice(0, visibleCount).map((group) => (
        <Box key={group.groupId} sx={{ width: '100%', minWidth: 0 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', minWidth: 0, px: 2, py: 1.5 }}
          >
            <Box>
              <Typography variant="sectionLabel">{group.cycleName}</Typography>
              {group.cycleDateRange && (
                <Typography variant="body2" color="text.secondary">
                  {group.cycleDateRange}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {group.charges.length} charge{group.charges.length !== 1 ? 's' : ''}
            </Typography>
          </Stack>
          <Stack className="kippa-stepper" sx={{ width: '100%', minWidth: 0 }}>
            {group.charges.map((charge) => {
              const category = charge.categoryId
                ? categories.find((candidate) => candidate.id === charge.categoryId)
                : null;
              const transaction = transactionById.get(charge.txId);
              const householdMember = householdMembers.find((member) => member.uid === transaction?.createdBy);
              const isCurrentUser = transaction?.createdBy === userProfile?.uid;
              const creator =
                isCurrentUser && userProfile
                  ? {
                      ...householdMember,
                      ...userProfile,
                      photoURL: auth?.currentUser?.photoURL || userProfile.photoURL || householdMember?.photoURL,
                    }
                  : householdMember;
              const parsedDate = new Date(`${charge.date}T12:00:00`);
              const displayDate = Number.isNaN(parsedDate.getTime())
                ? charge.date
                : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(parsedDate);
              return (
                <Paper
                  key={charge.lineId}
                  variant="timelineRow"
                  sx={{
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    minHeight: 84,
                    px: 2,
                    py: 1.5,
                    display: 'grid',
                    gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', sm: 'minmax(0, 1fr) minmax(0, 1.15fr) auto' },
                    gridTemplateAreas: { xs: '"timeline actions" "details details"', sm: '"timeline details actions"' },
                    columnGap: 2,
                    rowGap: { xs: 1, sm: 0 },
                    alignItems: 'center',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, gridArea: 'timeline' }}>
                    {creator ? (
                      <Badge
                        className="kippa-transaction-avatar-badge"
                        overlap="circular"
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        badgeContent={<Box className="kippa-transaction-type-dot" data-type={charge.txType} />}
                      >
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
                      </Badge>
                    ) : (
                      <Box sx={{ width: 28, height: 28, flex: '0 0 28px', display: 'grid', placeItems: 'center' }}>
                        <Box className="kippa-transaction-type-dot" data-type={charge.txType} aria-hidden="true" />
                      </Box>
                    )}
                    <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="transactionAmount"
                        color={charge.paid ? 'text.disabled' : 'text.primary'}
                        noWrap
                        sx={{ textDecoration: charge.paid ? 'line-through' : 'none' }}
                      >
                        {mask(
                          `−${card.currency} ${charge.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        )}
                      </Typography>
                      {creator && (
                        <Typography variant="body2" color="text.primary" noWrap>
                          {creator.displayName}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {displayDate} · {transaction?.createdAt ? formatShortTime(transaction.createdAt) : ''}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ minWidth: 0, gridArea: 'details' }}>
                    <Typography
                      variant="sectionLabel"
                      color={charge.paid ? 'text.disabled' : 'text.primary'}
                      sx={{ textDecoration: charge.paid ? 'line-through' : 'none' }}
                    >
                      {category?.name ?? charge.txType}
                    </Typography>
                    {charge.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
                        {charge.description}
                      </Typography>
                    )}
                    {charge.feeRate != null && charge.feeRate > 0 && (
                      <Typography variant="fieldHint" color="text.secondary">
                        Includes {charge.feeRate}% bank fee
                      </Typography>
                    )}
                  </Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ flexShrink: 0, gridArea: 'actions', justifySelf: 'end' }}
                  >
                    {charge.paid ? (
                      <IconCircleCheck size={22} strokeWidth={1.8} aria-label="Paid" />
                    ) : (
                      card.kind === 'credit' && (
                        <Button size="small" onClick={() => onPay(charge)}>
                          Pay
                        </Button>
                      )
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      ))}
      {visibleCount < groups.length && (
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Button size="small" onClick={onLoadMore}>
            Load previous cycle ({groups.length - visibleCount} remaining)
          </Button>
        </Box>
      )}
    </Stack>
  );
}

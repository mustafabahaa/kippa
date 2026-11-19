import { DeleteIcon, EditIcon, MoreVerticalIcon } from '@/components/AppIcon';

import React, { useState } from 'react';
import {
  Badge,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@monochrome-ui/design-system';
import { FinanceTransaction, Category, LedgerLine, Account, Card } from '@kippa/domain';
import { useAppContext } from '@/hooks/useAppContext';
import { useHouseholdBaseCurrency } from '@/hooks/useFinance';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { UserAvatar } from '@/components/UserAvatar';
import { formatShortTime } from '@/libs/dateFormatting';

interface TransactionsListItemProps {
  tx: FinanceTransaction;
  categories: Category[];
  ledgerLines: LedgerLine[];
  accounts?: Account[];
  cards?: Card[];
  compact?: boolean;
  onEdit: (tx: FinanceTransaction) => void;
  onVoid: (txId: string) => void;
}

export const TransactionsListItem: React.FC<TransactionsListItemProps> = ({
  tx,
  categories,
  ledgerLines,
  accounts = [],
  cards = [],
  compact = false,
  onEdit,
  onVoid,
}) => {
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const baseCurrency = useHouseholdBaseCurrency();
  const { userProfile, householdMembers } = useAppContext();
  const cat = categories.find((c) => c.id === tx.categoryId);

  // Find amount and accounts from ledgerLines
  const txLines = ledgerLines.filter((l) => l.transactionId === tx.id);
  const firstLine = txLines.find((l) => l.signedAmount !== 0) || txLines[0];
  const amount = firstLine ? Number(Math.abs(firstLine.signedAmount).toFixed(2)) : 0;
  const currency = firstLine ? firstLine.currency : baseCurrency;
  const paymentLine = txLines.find((line) => line.signedAmount < 0) ?? firstLine;
  const paymentAccount = accounts.find((account) => account.id === paymentLine?.accountId);
  const linkedCards = cards.filter(
    (card) => card.isActive && card.parentAccountId === paymentAccount?.id,
  );
  const paymentSource = paymentAccount
    ? paymentAccount.type === 'cash'
      ? 'Cash'
      : linkedCards.length === 1
        ? `${linkedCards[0].network && linkedCards[0].network !== 'other' ? `${linkedCards[0].network.toUpperCase()} ` : ''}${linkedCards[0].last4 ? `•••• ${linkedCards[0].last4} · ` : ''}${paymentAccount.name}`
        : paymentAccount.name
    : null;
  const { maskDigits } = usePrivacyMask();
  const householdMember = householdMembers.find((member) => member.uid === tx.createdBy);
  const isCurrentUser = tx.createdBy === userProfile?.uid;
  const creator =
    isCurrentUser && userProfile
      ? {
          ...householdMember,
          ...userProfile,
          photoURL: userProfile.photoURL || householdMember?.photoURL,
        }
      : householdMember;
  const parsedTransactionDate = new Date(`${tx.date}T12:00:00`);
  const transactionDate = Number.isNaN(parsedTransactionDate.getTime())
    ? tx.date
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(parsedTransactionDate);

  const renderItemDetails = () => {
    let title: string;
    let description: string | null | undefined;
    let source: string | null = null;

    switch (tx.type) {
      case 'transfer': {
        const fromLine = txLines.find((l) => l.signedAmount < 0);
        const toLine = txLines.find((l) => l.signedAmount > 0);
        const fromAcc = accounts.find((a) => a.id === fromLine?.accountId);
        const toAcc = accounts.find((a) => a.id === toLine?.accountId);
        const crossCurrency = !!fromLine && !!toLine && fromLine.currency !== toLine.currency;
        if (crossCurrency) {
          const fromAmt = fromLine ? Number(Math.abs(fromLine.signedAmount).toFixed(2)) : 0;
          const toAmt = toLine ? Number(Math.abs(toLine.signedAmount).toFixed(2)) : 0;
          title = tx.description || 'Transfer';
          description = `${maskDigits(`${fromAmt} ${fromLine?.currency}`)} → ${maskDigits(`${toAmt} ${toLine?.currency}`)}`;
          break;
        }
        title = tx.description || 'Transfer';
        description = `${fromAcc?.name || 'Wallet'} → ${toAcc?.name || 'Bank'}`;
        break;
      }

      case 'adjustment':
        title = 'Reconciliation';
        description = tx.description;
        source = paymentAccount ? `Account: ${paymentAccount.name}` : null;
        break;
      case 'income':
        title = cat?.name || 'Income';
        description = tx.description;
        source = paymentAccount ? `Received in ${paymentAccount.name}` : null;
        break;
      case 'expense':
      default: {
        title = cat?.name || 'Expense';
        description = tx.description;
        source = paymentSource ? `Paid from ${paymentSource}` : null;
        break;
      }
    }

    return (
      <Stack
        spacing={0.5}
        alignItems={compact ? { xs: 'flex-start', lg: 'flex-end' } : { xs: 'flex-start', sm: 'flex-end' }}
        sx={{ minWidth: 0, width: '100%' }}
      >
        <Typography
          variant="h6"
          noWrap
          color="text.primary"
          sx={{
            width: '100%', maxWidth: '100%', minWidth: 0,
            textAlign: compact ? { xs: 'left', lg: 'right' } : { xs: 'left', sm: 'right' },
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="sectionSubtitle"
            color="text.secondary"
            sx={{
              width: '100%', maxWidth: '100%',
              textAlign: compact ? { xs: 'left', lg: 'right' } : { xs: 'left', sm: 'right' },
              whiteSpace: 'normal', overflowWrap: 'anywhere',
            }}
          >
            {description}
          </Typography>
        )}
        {source && (
          <Typography
            variant="metricMetadata"
            color="text.secondary"
            sx={{
              width: '100%',
              maxWidth: '100%',
              textAlign: compact ? { xs: 'left', lg: 'right' } : { xs: 'left', sm: 'right' },
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
            {source}
          </Typography>
        )}
      </Stack>
    );
  };

  return (
    <>
      <Paper
        variant="timelineRow"
        sx={{
          minHeight: 84,
          px: 2,
          py: { xs: 2, sm: 1.75 },
          '--ds-stepper-node-y': compact ? { xs: '51px', lg: '50%' } : { xs: '51px', sm: '50%' },
          display: 'grid',
          gridTemplateColumns: compact
            ? { xs: 'minmax(0, 1fr) auto', lg: 'minmax(0, 1fr) minmax(0, 1.2fr) auto' }
            : { xs: 'minmax(0, 1fr) auto', sm: 'minmax(0, 1fr) minmax(0, 1.2fr) auto' },
          gridTemplateAreas: compact
            ? { xs: '"timeline actions" "details details"', lg: '"timeline details actions"' }
            : { xs: '"timeline actions" "details details"', sm: '"timeline details actions"' },
          columnGap: { xs: 1.5, sm: 2.5 },
          rowGap: compact ? { xs: 1.5, lg: 0 } : { xs: 1.5, sm: 0 },
          alignItems: 'center',
        }}
        data-voided={tx.status === 'voided' ? 'true' : undefined}
      >
        <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, gridArea: 'timeline' }}>
          {creator ? (
            <Tooltip title={`Added by ${creator.displayName}`}>
              <Badge
                className="ds-record-avatar-badge"
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                badgeContent={<Box className="ds-record-type-dot" data-type={tx.type} />}
              >
                <UserAvatar
                  className="ds-stepper-node"
                  photoURLs={[
                    isCurrentUser ? userProfile?.photoURL : undefined,
                    creator.photoURL,
                    householdMember?.photoURL,
                  ]}
                  displayName={creator.displayName}
                  sx={{ width: 28, height: 28 }}
                />
              </Badge>
            </Tooltip>
          ) : (
            <Box className="ds-record-type-dot" data-type={tx.type} aria-hidden="true" />
          )}
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="activityAmount" color="text.primary" noWrap>
              {maskDigits(`${amount.toLocaleString()} ${currency}`)}
            </Typography>
            {creator && (
              <Typography variant="body2" color="text.primary" noWrap>
                {creator.displayName}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" noWrap>
              {transactionDate} · {formatShortTime(tx.createdAt)}
            </Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: compact ? { xs: 'flex-start', lg: 'flex-end' } : 'flex-end',
            width: '100%', minWidth: 0, gridArea: 'details',
            pl: compact ? { xs: 5, lg: 0 } : { xs: 5, sm: 0 },
          }}
        >
          {renderItemDetails()}
        </Box>
        <IconButton
          size="small"
          aria-label={`Actions for ${tx.description || 'transaction'}`}
          aria-haspopup="menu"
          aria-expanded={Boolean(actionsAnchor)}
          onClick={(event) => setActionsAnchor(event.currentTarget)}
          sx={{ gridArea: 'actions', justifySelf: { xs: 'start', sm: 'auto' }, width: { xs: 44, sm: 36 }, height: { xs: 44, sm: 36 } }}
        >
          <MoreVerticalIcon size={20} strokeWidth={1.8} />
        </IconButton>
      </Paper>
      <Menu
        anchorEl={actionsAnchor}
        open={Boolean(actionsAnchor)}
        onClose={() => setActionsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          disabled={tx.status === 'voided'}
          onClick={() => {
            setActionsAnchor(null);
            onEdit(tx);
          }}
        >
          <ListItemIcon>
            <EditIcon size={18} strokeWidth={1.8} />
          </ListItemIcon>
          <ListItemText>Edit transaction</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setActionsAnchor(null);
            onVoid(tx.id);
          }}
        >
          <ListItemIcon>
            <DeleteIcon size={18} strokeWidth={1.8} />
          </ListItemIcon>
          <ListItemText>Void transaction</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

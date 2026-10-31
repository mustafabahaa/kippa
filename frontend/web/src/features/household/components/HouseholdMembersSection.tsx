import { Avatar, Box, Button, Divider, List, ListItem, ListItemText, Skeleton, Stack, Typography } from '@monochrome-ui/design-system';
import type { HouseholdMember, JoinRequest } from '@kippa/domain';
import { GroupAddIcon } from '@/components/AppIcon';
import { SectionHeading } from '@/features/shared/components/SectionHeading';

type Props = {
  busy: boolean;
  loading: boolean;
  members: HouseholdMember[];
  onDecide: (userId: string, decision: 'approve' | 'reject') => void;
  requests: JoinRequest[];
};

export function HouseholdMembersSection({ busy, loading, members, onDecide, requests }: Props) {
  return (
    <Stack spacing={2}>
      <SectionHeading
        icon={<GroupAddIcon />}
        title="Members"
        subtitle={`${members.length} people connected to this household`}
      />

      <Box sx={{ pl: { xs: 0, md: 4 } }}>
        <Stack spacing={1.5}>
          {loading ? (
            <Stack spacing={1.5}>
              {[0, 1].map((item) => (
                <Stack key={item} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Stack spacing={0.25} sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="42%" />
                    <Skeleton variant="text" width="65%" />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          ) : members.length === 0 ? (
            <Typography variant="sectionSubtitle" color="text.secondary" sx={{ py: 1 }}>
              No other members yet. Invite someone or approve a join request to share this household.
            </Typography>
          ) : (
            <List disablePadding>
              {members.map((member, index) => (
                <Box key={member.uid}>
                  {index > 0 && <Divider />}
                  <ListItem disableGutters sx={{ py: 1.25, gap: 1.5 }}>
                    <Avatar src={member.photoURL || undefined} sx={{ width: 36, height: 36 }}>
                      {member.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <ListItemText
                      primary={member.displayName}
                      secondary={member.email}
                      slotProps={{
                        primary: { variant: 'sectionLabel', noWrap: true },
                        secondary: { variant: 'fieldHint', noWrap: true },
                      }}
                      sx={{ minWidth: 0, my: 0 }}
                    />
                    {member.isOwner && (
                      <Typography variant="fieldHint" color="text.secondary">
                        Owner
                      </Typography>
                    )}
                  </ListItem>
                </Box>
              ))}
            </List>
          )}

          {requests.length > 0 && (
            <>
              <Divider />
              <Stack spacing={0.5}>
                <Typography variant="sectionLabel">Pending requests</Typography>
                <Typography variant="fieldHint" color="text.secondary">
                  Review requests to join this household.
                </Typography>
              </Stack>
              <List disablePadding>
                {requests.map((request, index) => (
                  <Box key={request.uid}>
                    {index > 0 && <Divider />}
                    <ListItem
                      disableGutters
                      sx={{ py: 1.25, gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.75}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => onDecide(request.uid, 'approve')}
                            disabled={busy}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => onDecide(request.uid, 'reject')}
                            disabled={busy}
                          >
                            Reject
                          </Button>
                        </Stack>
                      }
                    >
                      <Avatar src={request.photoURL || undefined} sx={{ width: 36, height: 36 }}>
                        {request.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                      <ListItemText
                        primary={request.displayName}
                        secondary={request.email}
                        slotProps={{
                          primary: { variant: 'sectionLabel', noWrap: true },
                          secondary: { variant: 'fieldHint', noWrap: true },
                        }}
                        sx={{ minWidth: 0, my: 0, mr: 12 }}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

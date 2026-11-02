import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  Chip,
  Tabs,
  Tab,
  Grid,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@monochrome-ui/design-system';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import {
  AddHomeIcon,
  CheckCircleIcon,
  ContentCopyIcon,
  GroupAddIcon,
  HomeIcon,
  HourglassEmptyIcon,
} from '@/components/AppIcon';

import type { Household, CurrencyCode } from '@kippa/domain';
import { useAppContext } from '@/hooks/useAppContext';
import { CurrencySelect } from '@/features/shared/components/CurrencySelect';
import { ledgerLib } from '@/libs/ledger';
import { PageHeader } from '@monochrome-ui/design-system';
import { HouseholdMembersSection } from './components/HouseholdMembersSection';
import { LeaveHouseholdDialog } from './components/LeaveHouseholdDialog';
import { useJoinRequestStatus } from './hooks/useJoinRequestStatus';
import { useHouseholdUi } from './hooks/useHouseholdUi';


export function Household() {
  const { enqueueSnackbar } = useSnackbar();
  const {
    userProfile,
    householdId,
    userHouseholds: householdsList,
    isLoadingHouseholds: householdsLoading,
    switchHousehold,
    createHousehold,
    requestToJoinHousehold,
    decideJoinRequest,
    leaveHousehold,
    pendingRequests,
    householdMembers,
    isMembersLoading,
  } = useAppContext();

  const {
    actionLoading,
    baseCurrencyLoading,
    copied,
    householdIdToJoin,
    householdToLeave,
    newHouseholdName,
    setActionLoading,
    setBaseCurrencyLoading,
    setCopied,
    setHouseholdIdToJoin,
    setHouseholdToLeave,
    setNewHouseholdName,
  } = useHouseholdUi();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleCopyHouseholdId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    enqueueSnackbar('Invite ID copied to clipboard!', { variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchHousehold = async (id: string, onSuccess?: () => void) => {
    setActionLoading(true);
    try {
      await switchHousehold(id);
      enqueueSnackbar('Switched to household successfully!', { variant: 'success' });
      onSuccess?.();
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to switch household.', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) {
      enqueueSnackbar('Please enter a household name', { variant: 'warning' });
      return;
    }
    setActionLoading(true);
    try {
      const newHh = await createHousehold(newHouseholdName.trim());
      setNewHouseholdName('');
      setCreateDialogOpen(false);
      enqueueSnackbar(`Household "${newHh.name}" created and set as active!`, { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to create household', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!householdIdToJoin.trim()) {
      enqueueSnackbar('Please enter a valid household ID', { variant: 'warning' });
      return;
    }
    setActionLoading(true);
    try {
      await requestToJoinHousehold(householdIdToJoin.trim());
      enqueueSnackbar('Request sent — the household owner will review it.', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to request join. Make sure the ID is correct.', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecide = async (requesterUid: string, decision: 'approve' | 'reject') => {
    if (!householdId) return;
    setActionLoading(true);
    try {
      await decideJoinRequest(householdId, requesterUid, decision);
      enqueueSnackbar(decision === 'approve' ? 'Request approved.' : 'Request rejected.', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to decide request.', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenLeaveConfirm = (hh: Household) => {
    setHouseholdToLeave(hh);
  };

  const handleCloseLeaveConfirm = () => {
    setHouseholdToLeave(null);
  };

  const handleLeaveHousehold = async () => {
    if (!householdToLeave) return;
    setActionLoading(true);
    try {
      await leaveHousehold(householdToLeave.id);
      enqueueSnackbar(`Successfully left household "${householdToLeave.name}"`, { variant: 'success' });
      handleCloseLeaveConfirm();
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to leave household.', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Find active household info
  const activeHh = householdsList.find((h) => h.id === householdId);
  const isOwner = activeHh ? activeHh.createdBy === userProfile?.uid : false;

  // Outgoing request status for the id currently in the join box.
  const outgoingStatus = useJoinRequestStatus(householdIdToJoin, userProfile?.uid);

  const handleBaseCurrencyChange = async (newCurrency: CurrencyCode) => {
    if (!activeHh || newCurrency === activeHh.baseCurrency) return;
    setBaseCurrencyLoading(true);
    try {
      await ledgerLib.updateHouseholdBaseCurrency(householdId, newCurrency);
      await queryClient.invalidateQueries({ queryKey: ['userHouseholds'] });
      enqueueSnackbar(`Base currency updated to ${newCurrency}`, { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to update base currency', { variant: 'error' });
    } finally {
      setBaseCurrencyLoading(false);
    }
  };

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <PageHeader title="Household" subtitle="Manage members, shared access, and the financial spaces you belong to." />

      <Box sx={{ width: '100%', maxWidth: 1250, alignSelf: 'center' }}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Box component="section" >
            <Stack spacing={{ xs: 2, md: 2.5 }}>
              <SectionHeading
                icon={<HomeIcon />}
                title="Your households"
                subtitle={`${householdsList.length} financial ${householdsList.length === 1 ? 'space' : 'spaces'} available`}
                trailing={
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
                    <Button variant="contained" startIcon={<AddHomeIcon />} onClick={() => setCreateDialogOpen(true)}>
                      Create household
                    </Button>
                    <Button variant="outlined" startIcon={<GroupAddIcon />} onClick={() => setJoinDialogOpen(true)}>
                      Join household
                    </Button>
                  </Stack>
                }
              />

              {householdsLoading ? (
                <Typography variant="fieldHint" color="text.secondary" >
                  Loading households…
                </Typography>
              ) : householdsList.length > 0 ? (
                <Tabs
                  value={householdId || false}
                  onChange={(event, id: string) => {
                    void event;
                    handleSwitchHousehold(id);
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile

                >
                  {householdsList.map((household) => (
                    <Tab key={household.id} value={household.id} label={household.name} disabled={actionLoading} />
                  ))}
                </Tabs>
              ) : (
                <Typography variant="sectionSubtitle" color="text.secondary" >
                  No households yet. Create one or request to join an existing household.
                </Typography>
              )}

              {activeHh && (
                <Grid container columns={12} spacing={{ xs: 3, md: 4 }} >
                  <Grid size={{ xs: 12, md: isOwner ? 4 : 12 }}>
                    <Stack spacing={{ xs: 2.5, md: 3 }}>
                      <SectionHeading
                        icon={<HomeIcon />}
                        title="Household details"
                        subtitle={`${activeHh.baseCurrency} base currency · ${isOwner ? 'Owner' : 'Member'}`}
                        trailing={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label="Active" />
                            {!isOwner && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleOpenLeaveConfirm(activeHh)}
                              >
                                Leave household
                              </Button>
                            )}
                          </Stack>
                        }
                      />

                      <Stack spacing={{ xs: 2.5, md: 3 }} >
                        <Stack spacing={1.25} alignItems="flex-start">
                          <Box>
                            <Typography variant="sectionLabel">Base currency</Typography>
                            <Typography variant="fieldHint" color="text.secondary">
                              Used for household totals and reports.
                            </Typography>
                          </Box>
                          <Box sx={{ width: '100%', maxWidth: { sm: 320 } }}>
                            <CurrencySelect
                              labelId="hh-base-currency-label"
                              value={activeHh.baseCurrency}
                              onChange={handleBaseCurrencyChange}
                            />
                          </Box>
                          {baseCurrencyLoading && (
                            <Typography variant="fieldHint" color="text.secondary">
                              Saving currency…
                            </Typography>
                          )}
                        </Stack>

                        <Stack spacing={1} sx={{ minWidth: 0 }}>
                          <Typography variant="sectionLabel">Invite ID</Typography>
                          <Typography variant="fieldHint" color="text.secondary">
                            Share this ID. The household owner can approve join requests.
                          </Typography>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1}
                            sx={{ minWidth: 0 }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ userSelect: 'all', overflowWrap: 'anywhere', minWidth: 0 }}
                            >
                              {activeHh.id}
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleCopyHouseholdId(activeHh.id)}
                              startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                            >
                              {copied ? 'Copied' : 'Copy ID'}
                            </Button>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Grid>

                  {isOwner && (
                    <Grid size={{ xs: 12, md: 8 }}>
                      <HouseholdMembersSection
                        busy={actionLoading}
                        loading={isMembersLoading}
                        members={householdMembers}
                        onDecide={handleDecide}
                        requests={pendingRequests}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
            </Stack>
          </Box>

          <Dialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            aria-labelledby="create-household-title"
            aria-describedby="create-household-description"
          >
            <DialogTitle id="create-household-title">Create a household</DialogTitle>
            <DialogContent>
              <Stack spacing={2.5} sx={{ pl: { xs: 1, sm: 2 }, pt: 1 }}>
                <DialogContentText id="create-household-description">
                  Create a separate household for another home or shared budget.
                </DialogContentText>
                <TextField
                  autoFocus
                  fullWidth
                  label="Household name"
                  placeholder="e.g. Vacation household"
                  value={newHouseholdName}
                  onChange={(event) => setNewHouseholdName(event.target.value)}
                  disabled={actionLoading}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={() => setCreateDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleCreateHousehold} disabled={actionLoading} loading={actionLoading}>
                Create household
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={joinDialogOpen}
            onClose={() => setJoinDialogOpen(false)}
            aria-labelledby="join-household-title"
            aria-describedby="join-household-description"
          >
            <DialogTitle id="join-household-title">Join a household</DialogTitle>
            <DialogContent>
              <Stack spacing={2.5} sx={{ pl: { xs: 1, sm: 2 }, pt: 1 }}>
                <DialogContentText id="join-household-description">
                  Enter an invite ID. The owner must approve your request before you can switch to that household.
                </DialogContentText>
                <TextField
                  autoFocus
                  fullWidth
                  label="Invite ID"
                  placeholder="Paste invite ID"
                  value={householdIdToJoin}
                  onChange={(event) => setHouseholdIdToJoin(event.target.value)}
                  disabled={actionLoading}
                />
                {outgoingStatus === 'pending' && (
                  <Alert severity="info" icon={<HourglassEmptyIcon />}>
                    Request pending — waiting for the owner to approve.
                  </Alert>
                )}
                {outgoingStatus === 'rejected' && (
                  <Alert severity="error">Your request was declined by the owner.</Alert>
                )}
                {outgoingStatus === 'approved' && (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    You’re approved.
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={() => setJoinDialogOpen(false)} disabled={actionLoading}>
                Close
              </Button>
              {outgoingStatus === 'approved' ? (
                <Button
                  variant="contained"
                  onClick={() => handleSwitchHousehold(householdIdToJoin.trim(), () => setJoinDialogOpen(false))}
                  disabled={householdIdToJoin.trim() === householdId || actionLoading}
                  loading={actionLoading}
                >
                  Switch household
                </Button>
              ) : outgoingStatus !== 'pending' ? (
                <Button variant="contained" onClick={handleJoinHousehold} disabled={actionLoading} loading={actionLoading}>
                  {outgoingStatus === 'rejected' ? 'Request again' : 'Request to join'}
                </Button>
              ) : null}
            </DialogActions>
          </Dialog>

          <LeaveHouseholdDialog
            busy={actionLoading}
            household={householdToLeave}
            onClose={handleCloseLeaveConfirm}
            onConfirm={handleLeaveHousehold}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

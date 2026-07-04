import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { doc as fsDoc, onSnapshot } from 'firebase/firestore';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Button,
  Divider,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Grid,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import LogoutIcon from '@mui/icons-material/Logout';
import AddHomeIcon from '@mui/icons-material/AddHome';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import type { Household, CurrencyCode, JoinStatus, JoinRequest } from '@/domain/financeTypes';
import { db as firestoreDb } from '@/config/firebase';
import { useAppContext } from '@/hooks/useAppContext';
import { CurrencySelect } from '@/features/shared/components/CurrencySelect';
import { ledgerLib } from '@/libs/ledger';

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

  // Leave Confirmation Dialog
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [householdToLeave, setHouseholdToLeave] = useState<Household | null>(null);

  const queryClient = useQueryClient();
  const [baseCurrencyLoading, setBaseCurrencyLoading] = useState(false);

  // Forms state
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [householdIdToJoin, setHouseholdIdToJoin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleCopyHouseholdId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    enqueueSnackbar('Invite ID copied to clipboard!', { variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchHousehold = async (id: string) => {
    setActionLoading(true);
    try {
      await switchHousehold(id);
      enqueueSnackbar('Switched to household successfully!', { variant: 'success' });
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
    setLeaveConfirmOpen(true);
  };

  const handleCloseLeaveConfirm = () => {
    setHouseholdToLeave(null);
    setLeaveConfirmOpen(false);
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
  const activeHh = householdsList.find(h => h.id === householdId);
  const isOwner = activeHh ? activeHh.createdBy === userProfile?.uid : false;

  // Outgoing request status for the id currently in the join box.
  const [outgoingStatus, setOutgoingStatus] = useState<JoinStatus | null>(null);
  useEffect(() => {
    const id = householdIdToJoin.trim();
    if (!id || !userProfile?.uid || !firestoreDb) {
      // Clear stale request status when the input is empty.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOutgoingStatus(null);
      return;
    }
    const unsub = onSnapshot(
      fsDoc(firestoreDb, `households/${id}/joinRequests/${userProfile.uid}`),
      (snap) => {
        setOutgoingStatus(snap.exists() ? (snap.data() as JoinRequest).status : null);
      },
    );
    return () => unsub();
  }, [householdIdToJoin, userProfile?.uid]);

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
    <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Households
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            Switch between existing households, create different containers, or request to join shared invites.
          </Typography>
        </Box>

        {/* Current Household Spotlight */}
        {activeHh && (
          <Card sx={{ borderColor: 'primary.light' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2.5}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HomeIcon sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '16px' }}>
                        {activeHh.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                        {activeHh.baseCurrency} (Base Currency) • {userProfile!.role === 'owner' ? 'Owner' : 'Member'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="Active"
                    color="primary"
                    size="small"
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                  />
                </Box>

                {/* Base Currency Setting */}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Base Currency
                  </Typography>
                  <CurrencySelect
                    labelId="hh-base-currency-label"
                    value={activeHh.baseCurrency}
                    onChange={handleBaseCurrencyChange}
                  />
                  {baseCurrencyLoading && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                      Saving…
                    </Typography>
                  )}
                </Box>

                <Divider />

                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Household Invite ID
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                    Share this ID with someone. They'll request to join, and you approve them.
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    bgcolor: 'action.hover',
                    p: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    gap: 1
                  }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '13px', color: 'text.primary', userSelect: 'all', wordBreak: 'break-all', py: 0.5 }}>
                      {activeHh.id}
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => handleCopyHouseholdId(activeHh.id)}
                      startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                      color={copied ? "success" : "primary"}
                      sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, textTransform: 'none', fontWeight: 'bold' }}
                    >
                      {copied ? "Copied!" : "Copy ID"}
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Members + Pending Requests — owner only */}
        {isOwner && (
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Typography variant="h3" sx={{ fontSize: '14px', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Members ({householdMembers.length})
                </Typography>
                {householdMembers.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
                    {isMembersLoading
                      ? 'Loading members…'
                      : 'No other members yet. Invite someone or approve a join request to share this household.'}
                  </Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {householdMembers.map((m, idx) => (
                      <Box key={m.uid}>
                        {idx > 0 && <Divider />}
                        <ListItem sx={{ px: 0, py: 1 }}>
                          <Avatar
                            src={m.photoURL || undefined}
                            sx={{ width: 36, height: 36, mr: 1.5, bgcolor: 'primary.light' }}
                          >
                            {m.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: m.isOwner ? 'bold' : 500, fontSize: '14px' }}>
                                {m.displayName}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                                {m.email}
                              </Typography>
                            }
                          />
                          {m.isOwner && (
                            <Chip label="Owner" size="small" color="primary" variant="outlined" />
                          )}
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                )}

                {pendingRequests.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h3" sx={{ fontSize: '14px', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pending Requests ({pendingRequests.length})
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {pendingRequests.map((req, idx) => (
                        <Box key={req.uid}>
                          {idx > 0 && <Divider />}
                          <ListItem sx={{ px: 0, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                              <Avatar
                                src={req.photoURL || undefined}
                                sx={{ width: 36, height: 36, mr: 1.5, bgcolor: 'action.selected' }}
                              >
                                {req.displayName?.charAt(0)?.toUpperCase() || '?'}
                              </Avatar>
                              <ListItemText
                                primary={
                                  <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>
                                    {req.displayName}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                                    {req.email}
                                  </Typography>
                                }
                              />
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleDecide(req.uid, 'approve')}
                                disabled={actionLoading}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleDecide(req.uid, 'reject')}
                                disabled={actionLoading}
                              >
                                Reject
                              </Button>
                            </Stack>
                          </ListItem>
                        </Box>
                      ))}
                    </List>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Your Households List */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1.5}>
              <Typography variant="h3" sx={{ fontSize: '14px', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Your Households ({householdsList.length})
              </Typography>
              <Card>
                {(householdsLoading || actionLoading) ? (
                  <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                    <CircularProgress size={30} />
                  </Box>
                ) : householdsList.length === 0 ? (
                  <Box p={3} textAlign="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No households found. Please create or request to join one below.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {householdsList.map((hh, index) => {
                      const isActive = hh.id === householdId;
                      return (
                        <Box key={hh.id}>
                          {index > 0 && <Divider />}
                          <ListItem sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ fontWeight: isActive ? 'bold' : 600, color: isActive ? 'primary.main' : 'text.primary', fontSize: '15px' }}>
                                  {hh.name}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.2 }}>
                                  ID: {hh.id.slice(0, 8)}... • Currency: {hh.baseCurrency}
                                </Typography>
                              }
                            />
                            <Stack direction="row" spacing={0.5} sx={{ ml: 2 }}>
                              {!isActive && (
                                <>
                                  <Tooltip title="Switch to this household">
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleSwitchHousehold(hh.id)}
                                      size="small"
                                      sx={{ bgcolor: 'action.hover' }}
                                    >
                                      <SwitchAccountIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Leave this household">
                                    <IconButton
                                      color="error"
                                      onClick={() => handleOpenLeaveConfirm(hh)}
                                      size="small"
                                      sx={{ bgcolor: 'action.hover' }}
                                    >
                                      <LogoutIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {isActive && (
                                <Chip label="Active" color="primary" size="small" sx={{ borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }} />
                              )}
                            </Stack>
                          </ListItem>
                        </Box>
                      );
                    })}
                  </List>
                )}
              </Card>
            </Stack>
          </Grid>

          {/* Right Column: Create & Join Actions (Tabbed Panel) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1.5}>
              <Typography variant="h3" sx={{ fontSize: '14px', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick Actions
              </Typography>
              <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} variant="fullWidth">
                    <Tab icon={<AddHomeIcon sx={{ fontSize: '18px' }} />} iconPosition="start" label="Create" />
                    <Tab icon={<GroupAddIcon sx={{ fontSize: '18px' }} />} iconPosition="start" label="Join" />
                  </Tabs>
                </Box>
                <CardContent sx={{ p: 2.5 }}>
                  {tabValue === 0 && (
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        Start a separate, brand-new household database container.
                      </Typography>
                      <TextField
                        fullWidth
                        label="Household Name"
                        placeholder="e.g. Vacation Household"
                        value={newHouseholdName}
                        onChange={e => setNewHouseholdName(e.target.value)}
                        disabled={actionLoading}
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCreateHousehold}
                        disabled={actionLoading}
                        sx={{ boxShadow: 'none' }}
                      >
                        Create
                      </Button>
                    </Stack>
                  )}
                  {tabValue === 1 && (
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        Paste an Invite ID from a household owner. They'll need to approve your request before you can join.
                      </Typography>
                      <TextField
                        fullWidth
                        label="Invite ID"
                        placeholder="Paste UUID here"
                        value={householdIdToJoin}
                        onChange={e => setHouseholdIdToJoin(e.target.value)}
                        disabled={actionLoading}
                      />
                      {outgoingStatus === null && (
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleJoinHousehold}
                          disabled={actionLoading}
                        >
                          Request to Join
                        </Button>
                      )}
                      {outgoingStatus === 'pending' && (
                        <Alert severity="info" icon={<HourglassEmptyIcon />}>
                          Request pending — waiting for the owner to approve.
                        </Alert>
                      )}
                      {outgoingStatus === 'rejected' && (
                        <>
                          <Alert severity="error">
                            Your request was declined by the owner.
                          </Alert>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleJoinHousehold}
                            disabled={actionLoading}
                          >
                            Request Again
                          </Button>
                        </>
                      )}
                      {outgoingStatus === 'approved' && (
                        <>
                          <Alert severity="success" icon={<CheckCircleIcon />}>
                            You're approved!
                          </Alert>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleSwitchHousehold(householdIdToJoin.trim())}
                            disabled={householdIdToJoin.trim() === householdId || actionLoading}
                          >
                            Switch to this Household
                          </Button>
                        </>
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      {/* Leave Household Confirmation Dialog */}
      <Dialog
        open={leaveConfirmOpen}
        onClose={handleCloseLeaveConfirm}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-description"
        slotProps={{
          paper: {
            sx: { borderRadius: '16px', p: 1 }
          }
        }}
      >
        <DialogTitle id="leave-dialog-title" sx={{ fontWeight: 'bold' }}>
          Leave Household?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-dialog-description">
            Are you sure you want to leave the household <strong>{householdToLeave?.name}</strong>? You will no longer be able to access its transactions and ledger details. You can only rejoin if the owner approves a new request.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={handleCloseLeaveConfirm} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleLeaveHousehold} color="error" variant="contained" disabled={actionLoading} autoFocus>
            Leave Household
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

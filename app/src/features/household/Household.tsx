import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import LogoutIcon from '@mui/icons-material/Logout';
import AddHomeIcon from '@mui/icons-material/AddHome';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';

import type { Household, CurrencyCode } from '@/domain/financeTypes';
import { useAppContext } from '@/hooks/useAppContext';
import { useThemeMode } from '@/hooks/useThemeMode';
import { CurrencySelect } from '@/features/shared/components/CurrencySelect';
import { ledgerLib } from '@/libs/ledger';

export function Household() {
  const { enqueueSnackbar } = useSnackbar();
  const { resolvedMode } = useThemeMode();
  const {
    userProfile,
    householdId,
    userHouseholds: householdsList,
    isLoadingHouseholds: householdsLoading,
    switchHousehold,
    createHousehold,
    joinHousehold,
    leaveHousehold
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
      await joinHousehold(householdIdToJoin.trim());
      setHouseholdIdToJoin('');
      enqueueSnackbar('Joined new household successfully!', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to join household. Make sure the ID is correct.', { variant: 'error' });
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
            Switch between existing households, create different containers, or join shared invites.
          </Typography>
        </Box>

        {/* Current Household Spotlight */}
        {activeHh && (
          <Card sx={{ 
            borderColor: 'primary.light',
            background: resolvedMode === 'dark'
              ? 'linear-gradient(135deg, rgba(0, 92, 85, 0.06) 0%, rgba(0, 92, 85, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(0, 92, 85, 0.02) 0%, rgba(0, 92, 85, 0.005) 100%)',
          }}>
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
                      No households found. Please create or join one below.
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
                        loading={actionLoading}
                        sx={{ boxShadow: 'none' }}
                      >
                        Create
                      </Button>
                    </Stack>
                  )}
                  {tabValue === 1 && (
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        Paste an Invite ID from a family member to access their ledger.
                      </Typography>
                      <TextField
                        fullWidth
                        label="Invite ID"
                        placeholder="Paste UUID here"
                        value={householdIdToJoin}
                        onChange={e => setHouseholdIdToJoin(e.target.value)}
                        disabled={actionLoading}
                      />
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleJoinHousehold}
                        loading={actionLoading}
                      >
                        Join
                      </Button>
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
            Are you sure you want to leave the household <strong>{householdToLeave?.name}</strong>? You will no longer be able to access its transactions and ledger details. You can only rejoin if someone gives you the Invite ID again.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={handleCloseLeaveConfirm} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleLeaveHousehold} color="error" variant="contained" loading={actionLoading} autoFocus>
            Leave Household
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

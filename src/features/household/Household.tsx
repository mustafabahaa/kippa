import { useState } from 'react';
import { useSnackbar } from 'notistack';
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
  InputAdornment,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import LogoutIcon from '@mui/icons-material/Logout';
import AddHomeIcon from '@mui/icons-material/AddHome';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { Household } from '../../domain/financeTypes';
import { useAppContext } from '../../hooks/useAppContext';

export function Household() {
  const { enqueueSnackbar } = useSnackbar();
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

  // Forms state
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [householdIdToJoin, setHouseholdIdToJoin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleCopyHouseholdId = (id: string) => {
    navigator.clipboard.writeText(id);
    enqueueSnackbar('Invite ID copied to clipboard!', { variant: 'success' });
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

  return (
    <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
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
            borderRadius: '20px', 
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'primary.light',
            background: 'linear-gradient(135deg, rgba(0, 92, 85, 0.01) 0%, rgba(0, 92, 85, 0.04) 100%)',
            position: 'relative',
            overflow: 'hidden'
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

                <Divider />

                <Box>
                  <TextField
                    fullWidth
                    label="Household Invite ID"
                    value={activeHh.id}
                    slotProps={{
                      input: {
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Copy Invite ID">
                              <IconButton onClick={() => handleCopyHouseholdId(activeHh.id)} edge="end" size="small">
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                        style: { fontFamily: 'monospace', fontSize: '13px' }
                      }
                    }}
                    size="small"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Your Households List */}
        <Box>
          <Typography variant="h3" sx={{ fontSize: '14px', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
            Your Households ({householdsList.length})
          </Typography>
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
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
                            <Typography variant="body1" sx={{ fontWeight: 600, color: isActive ? 'primary.main' : 'text.primary', fontSize: '15px' }}>
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
                              <IconButton
                                color="primary"
                                onClick={() => handleSwitchHousehold(hh.id)}
                                size="small"
                                sx={{ bgcolor: 'secondary.container', borderRadius: '8px', '&:hover': { bgcolor: 'secondary.container' } }}
                                title="Switch to this household"
                              >
                                <SwitchAccountIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenLeaveConfirm(hh)}
                                size="small"
                                sx={{ bgcolor: 'error.container', borderRadius: '8px', '&:hover': { bgcolor: 'error.container' } }}
                                title="Leave this household"
                              >
                                <LogoutIcon fontSize="small" />
                              </IconButton>
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
        </Box>

        {/* Create Household Card */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                  <AddHomeIcon color="primary" sx={{ fontSize: '20px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '15px' }}>
                    Create Household
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                  Start a separate, brand-new household database container.
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Household Name"
                placeholder="e.g. Vacation Household"
                size="small"
                value={newHouseholdName}
                onChange={e => setNewHouseholdName(e.target.value)}
                disabled={actionLoading}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreateHousehold}
                disabled={actionLoading}
                sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '12px', py: 1, boxShadow: 'none' }}
              >
                Create
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Join Household Card */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                  <GroupAddIcon color="primary" sx={{ fontSize: '20px' }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '15px' }}>
                    Join Household
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                  Paste an Invite ID from a family member to access their ledger.
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Invite ID"
                placeholder="Paste UUID here"
                size="small"
                value={householdIdToJoin}
                onChange={e => setHouseholdIdToJoin(e.target.value)}
                disabled={actionLoading}
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={handleJoinHousehold}
                disabled={actionLoading}
                sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '12px', py: 1 }}
              >
                Join
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Leave Household Confirmation Dialog */}
      <Dialog
        open={leaveConfirmOpen}
        onClose={handleCloseLeaveConfirm}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-description"
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
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
          <Button onClick={handleCloseLeaveConfirm} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleLeaveHousehold} color="error" variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', boxShadow: 'none' }} autoFocus>
            Leave Household
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

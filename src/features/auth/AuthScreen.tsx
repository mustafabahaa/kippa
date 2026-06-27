import { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  TextField, 
  Typography, 
  Alert
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import { authService } from '../../services/authService';
import { UserProfile } from '../../domain/financeTypes';

interface AuthScreenProps {
  userProfile: UserProfile | null;
  onProfileUpdated: (profile: UserProfile) => void;
}

export function AuthScreen({ userProfile, onProfileUpdated }: AuthScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Household setup state
  const [householdName, setHouseholdName] = useState('');
  const [householdIdToJoin, setHouseholdIdToJoin] = useState('');

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const profile = await authService.signInWithGoogle();
      onProfileUpdated(profile);
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!userProfile) return;
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const hh = await authService.createHousehold(userProfile.uid, householdName);
      onProfileUpdated({ ...userProfile, householdId: hh.id });
    } catch (err: any) {
      setError(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!userProfile) return;
    if (!householdIdToJoin.trim()) {
      setError('Please enter a valid household ID');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authService.joinHousehold(userProfile.uid, householdIdToJoin);
      onProfileUpdated({ ...userProfile, householdId: householdIdToJoin, role: 'member' });
    } catch (err: any) {
      setError(err.message || 'Failed to join household. Make sure the ID is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
  };

  // If user is authenticated but has no household
  if (userProfile && !userProfile.householdId) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4}>
              <Box textAlign="center">
                <Typography variant="h2" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
                  Setup Household
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                  Welcome, {userProfile.displayName}! You need to create or join a household container to start.
                </Typography>
              </Box>

              {error && <Alert severity="error">{error}</Alert>}

              <Stack spacing={3}>
                <Box>
                  <Typography variant="h3" sx={{ mb: 1.5, fontSize: '1.1rem' }}>
                    Option 1: Create a new household
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      label="Household Name"
                      placeholder="e.g. Smith Household"
                      size="small"
                      value={householdName}
                      onChange={e => setHouseholdName(e.target.value)}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleCreateHousehold}
                      disabled={loading}
                      sx={{ whiteSpace: 'nowrap', minHeight: 40 }}
                    >
                      Create
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                  <Typography variant="body2" sx={{ mx: 2, color: 'text.disabled' }}>
                    OR
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                </Box>

                <Box>
                  <Typography variant="h3" sx={{ mb: 1.5, fontSize: '1.1rem' }}>
                    Option 2: Join an existing household
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      label="Household ID"
                      placeholder="Paste ID here"
                      size="small"
                      value={householdIdToJoin}
                      onChange={e => setHouseholdIdToJoin(e.target.value)}
                    />
                    <Button 
                      variant="outlined" 
                      onClick={handleJoinHousehold}
                      disabled={loading}
                      sx={{ whiteSpace: 'nowrap', minHeight: 40 }}
                    >
                      Join
                    </Button>
                  </Stack>
                </Box>
              </Stack>

              <Button variant="text" color="error" onClick={handleLogout} sx={{ mt: 2 }}>
                Sign out
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Google Sign In Card
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4} alignItems="center">
            <Box textAlign="center" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  bgcolor: 'info.light',
                  mb: 1
                }}
              >
                <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 600 }}>
                Finance Ledger
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Secure, ledger-first household finance system
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                py: 1.8,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 4,
                borderColor: 'divider',
                color: 'text.primary',
                backgroundColor: '#ffffff',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#f7f9fe',
                  borderColor: 'divider'
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

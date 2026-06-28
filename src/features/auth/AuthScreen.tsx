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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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

  const handleBypassLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const profile = await authService.bypassLogin();
      onProfileUpdated(profile);
    } catch (err: any) {
      setError(err.message || 'Bypass failed');
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
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f9ff 0%, #ecedf7 100%)',
        p: 2
      }}>
        <Container maxWidth="sm">
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={4}>
                <Box textAlign="center">
                  <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700 }}>
                    Setup Household
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                    Welcome, {userProfile.displayName}! You need to create or join a household container to start.
                  </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                <Stack spacing={3.5}>
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

                  <Box sx={{ my: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                    <Typography variant="body2" sx={{ mx: 2, color: 'text.disabled', fontWeight: 600 }}>
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

                <Button variant="text" color="error" onClick={handleLogout} sx={{ mt: 2, alignSelf: 'center' }}>
                  Sign out
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // Google Sign In Card
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.paper',
      p: 3
    }}>
      <Container maxWidth="xs" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Stack spacing={4} alignItems="center" sx={{ w: '100%' }}>
          
          {/* Brand Identity Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/icons/icon.svg" alt="FinanceFlow Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '20px', tracking: '-0.5px' }}>
              FinanceFlow
            </Typography>
          </Box>

          {/* Sign In Header */}
          <Box sx={{ textAlign: 'center', w: '100%' }}>
            <Typography variant="h2" sx={{ fontSize: '28px', fontWeight: 500, color: 'text.primary' }}>
              Sign in
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5, fontSize: '14px' }}>
              to continue to FinanceFlow
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ width: '100%', borderRadius: '12px' }}>{error}</Alert>}

          {/* Google Sign In Button */}
          <Box sx={{ width: '100%', py: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: '8px',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                textTransform: 'none',
                height: 48,
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'text.secondary'
                }
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px' }}>
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </Typography>
              </Stack>
            </Button>
          </Box>

          {/* Contextual Information */}
          <Box sx={{ width: '100%', pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px', lineHeight: 1.5 }}>
              To continue, Google will share your name, email address, language preference, and profile picture with FinanceFlow.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                Create account
              </Typography>
            </Stack>
          </Box>

        </Stack>
      </Container>

      {/* Google-style Footer Navigation */}
      <Box 
        component="footer" 
        sx={{ 
          width: '100%', 
          maxWidth: '1024px', 
          px: 2, 
          py: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: 2,
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'pointer', px: 1, py: 0.5, borderRadius: '4px', '&:hover': { bgcolor: 'action.hover' } }}>
          <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
            English (United States)
          </Typography>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--mui-palette-text-secondary, #3e4947)' }}>arrow_drop_down</span>
        </Stack>

        <Stack direction="row" spacing={3}>
          {['Help', 'Privacy', 'Terms'].map(link => (
            <Typography key={link} variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>
              {link}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

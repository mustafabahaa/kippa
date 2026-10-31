import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Button, Container, Stack, TextField, Typography, Alert, useTheme, InputAdornment } from '@mui/material';
import { isFirebaseReady } from '@/libs/auth';
import { useAppContext } from '@/hooks/useAppContext';
import { AddHomeIcon, GroupAddIcon, HomeIcon, KeyIcon, LogoutIcon } from '@/components/AppIcon';

export function AuthScreen() {
  const theme = useTheme();
  const logoSrc =
    theme.palette.mode === 'dark' ? '/icons/logo_white_transparent.png' : '/icons/logo_black_transparent.png';
  const { enqueueSnackbar } = useSnackbar();
  const { userProfile, loginWithGoogle, logout, createHousehold, requestToJoinHousehold } = useAppContext();

  const [loading, setLoading] = useState(false);

  // Household setup state
  const [householdName, setHouseholdName] = useState('');
  const [householdIdToJoin, setHouseholdIdToJoin] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Google Authentication failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!userProfile) return;
    if (!householdName.trim()) {
      enqueueSnackbar('Please enter a household name', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await createHousehold(householdName.trim());
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to create household', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!userProfile) return;
    if (!householdIdToJoin.trim()) {
      enqueueSnackbar('Please enter a valid household ID', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await requestToJoinHousehold(householdIdToJoin.trim());
      enqueueSnackbar('Request sent — the household owner will review it.', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to request join. Make sure the ID is correct.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!isFirebaseReady) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Container maxWidth="sm">
          <Alert severity="error">
            Firebase is not configured. Copy <strong>.env.example</strong> to <strong>.env</strong> and set your{' '}
            <strong>VITE_FIREBASE_*</strong> credentials.
          </Alert>
        </Container>
      </Box>
    );
  }

  // If user is authenticated but has no household
  if (userProfile && !userProfile.householdId) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4} sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ maxWidth: 620 }}>
              <Typography variant="h2">Set up your household</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Welcome back, <strong>{userProfile.displayName}</strong>. Create a household or ask to join one you
                trust.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
                columnGap: { xs: 4, md: 6 },
                rowGap: 4,
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <AddHomeIcon />
                  <Typography variant="sectionTitle">Create a household</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Start a shared household ledger. You’ll be its owner and can invite other members later.
                </Typography>
                <TextField
                  fullWidth
                  label="Household name"
                  placeholder="e.g. Our household"
                  value={householdName}
                  onChange={(event) => setHouseholdName(event.target.value)}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  variant="primaryAction"
                  onClick={handleCreateHousehold}
                  loading={loading}
                  disabled={!householdName.trim()}
                  sx={{ alignSelf: 'flex-start', width: { xs: '100%', sm: 'auto' } }}
                >
                  Create household
                </Button>
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <GroupAddIcon />
                  <Typography variant="sectionTitle">Join a household</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Enter an invite ID from the household owner. They’ll review your request before you get access.
                </Typography>
                <TextField
                  fullWidth
                  label="Household invite ID"
                  placeholder="Paste the invite ID"
                  value={householdIdToJoin}
                  onChange={(event) => setHouseholdIdToJoin(event.target.value)}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleJoinHousehold}
                  loading={loading}
                  disabled={!householdIdToJoin.trim()}
                  sx={{ alignSelf: 'flex-start', width: { xs: '100%', sm: 'auto' } }}
                >
                  Request to join
                </Button>
              </Stack>
            </Box>

            <Stack spacing={2} alignItems="flex-start">
              <Alert severity="info" icon={false}>
                You can find your household invite ID in the profile menu after signing in.
              </Alert>
              <Button variant="segmented" onClick={handleLogout} startIcon={<LogoutIcon fontSize="small" />}>
                Sign out
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Welcome / Google sign in screen — follows the supplied finance-app
  // reference while retaining the existing authentication flow.
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 3, sm: 5 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 470,
          minHeight: { xs: '100dvh', sm: 720 },
          py: { xs: 5, sm: 7 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <img src={logoSrc} alt="Kippa Logo" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </Box>
          <Typography variant="h6" color="text.primary">
            Kippa
          </Typography>
        </Stack>

        <Box sx={{ mt: 'auto', mb: { xs: 5, sm: 2 } }}>
          <Typography variant="h1" sx={{ maxWidth: 430, textWrap: 'balance' }}>
            Track your spending effortlessly
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2.5, mb: 4.5, maxWidth: 420 }}>
            Manage your household finances, follow every expense, and keep your goals in sight.
          </Typography>

          <Box sx={{ width: '100%' }}>
            <Button fullWidth variant="primaryAction" onClick={handleGoogleSignIn} loading={loading}>
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  ></path>
                </svg>
                <Typography variant="body1">Get started with Google</Typography>
              </Stack>
            </Button>
          </Box>
          <Typography variant="fieldHint" color="text.secondary" sx={{ mt: 2.5, textAlign: 'center' }}>
            Secure sign-in · Your financial data stays private
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

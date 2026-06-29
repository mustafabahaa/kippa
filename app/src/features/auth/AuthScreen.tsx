import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
  Alert,
  useTheme,
  InputAdornment
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddHomeIcon from '@mui/icons-material/AddHome';
import LogoutIcon from '@mui/icons-material/Logout';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyIcon from '@mui/icons-material/Key';
import { isFirebaseReady } from '@/libs/auth';
import { useAppContext } from '@/hooks/useAppContext';

export function AuthScreen() {
  const theme = useTheme();
  const logoSrc = theme.palette.mode === 'dark' ? '/icons/icon-dark.svg' : '/icons/icon.svg';
  const { enqueueSnackbar } = useSnackbar();
  const {
    userProfile,
    loginWithGoogle,
    logout,
    createHousehold,
    joinHousehold
  } = useAppContext();

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
      await joinHousehold(householdIdToJoin.trim());
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to join household. Make sure the ID is correct.', { variant: 'error' });
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
          <Alert severity="error" sx={{ borderRadius: 3 }}>
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
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'transparent',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        zIndex: 1,
      }}>
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center">
            {/* Header / Intro section */}
            <Box textAlign="center" sx={{ maxWidth: 600, mb: 1 }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '1.75rem', sm: '2.25rem' }, 
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  mb: 1.5
                }}
              >
                Setup Your Workspace
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary', 
                  fontSize: { xs: '14px', sm: '16px' },
                  lineHeight: 1.6,
                  px: 2
                }}
              >
                Welcome back, <strong>{userProfile.displayName}</strong>! To get started, you need to create a new household workspace or join an existing shared one.
              </Typography>
            </Box>

            {/* Core Cards: Split Layout */}
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={4} 
              sx={{ width: '100%', alignItems: 'stretch' }}
            >
              {/* Card A: Create Household */}
              <Card 
                sx={{ 
                  flex: 1, 
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    '& .icon-badge-create': {
                      transform: 'scale(1.08)',
                      bgcolor: alpha(theme.palette.primary.main, 0.15)
                    }
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Icon Badge */}
                  <Box 
                    className="icon-badge-create"
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <AddHomeIcon sx={{ fontSize: 28 }} />
                  </Box>

                  <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 1.5 }}>
                    Create a New Household
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6, flexGrow: 1 }}>
                    Establish a brand new shared ledger workspace. As the creator, you'll be the household administrator and can invite other members via a shared ID anytime.
                  </Typography>

                  <Stack spacing={2} sx={{ mt: 'auto' }}>
                    <TextField
                      fullWidth
                      label="Household Name"
                      placeholder="e.g. My Cozy Home"
                      value={householdName}
                      onChange={e => setHouseholdName(e.target.value)}
                      disabled={loading}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <HomeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }
                      }}
                    />
                    <Button 
                      fullWidth
                      variant="contained" 
                      onClick={handleCreateHousehold}
                      loading={loading}
                    >
                      Create Household
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Card B: Join Household */}
              <Card 
                sx={{ 
                  flex: 1, 
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    '& .icon-badge-join': {
                      transform: 'scale(1.08)',
                      bgcolor: alpha(theme.palette.secondary.main, 0.15)
                    }
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Icon Badge */}
                  <Box 
                    className="icon-badge-join"
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: 'secondary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <GroupAddIcon sx={{ fontSize: 28 }} />
                  </Box>

                  <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 1.5 }}>
                    Join an Existing Household
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6, flexGrow: 1 }}>
                    Connect to an existing workspace created by someone else. You will need their Household ID to instantly sync up and share budget ledger logs.
                  </Typography>

                  <Stack spacing={2} sx={{ mt: 'auto' }}>
                    <TextField
                      fullWidth
                      label="Household ID"
                      placeholder="Paste ID here (e.g. uuid-format)"
                      value={householdIdToJoin}
                      onChange={e => setHouseholdIdToJoin(e.target.value)}
                      disabled={loading}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }
                      }}
                    />
                    <Button 
                      fullWidth
                      variant="outlined" 
                      onClick={handleJoinHousehold}
                      loading={loading}
                    >
                      Join Household
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            {/* Help Alert tip block */}
            <Alert 
              severity="info" 
              icon={<InfoOutlinedIcon fontSize="small" />}
              sx={{ width: '100%' }}
            >
              <strong>Tip:</strong> You can find your Household ID inside the user profile menu at the top-right corner of the application once logged in.
            </Alert>

            {/* Logout / Switch User */}
            <Button 
              variant="text" 
              color="error" 
              onClick={handleLogout} 
              startIcon={<LogoutIcon fontSize="small" />}
            >
              Sign out / Change Account
            </Button>
          </Stack>
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
              <img src={logoSrc} alt="Kippa Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '20px', tracking: '-0.5px' }}>
              Kippa
            </Typography>
          </Box>

          {/* Sign In Header */}
          <Box sx={{ textAlign: 'center', w: '100%' }}>
            <Typography variant="h2" sx={{ fontSize: '28px', fontWeight: 500, color: 'text.primary' }}>
              Sign in
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5, fontSize: '14px' }}>
              to continue to Kippa
            </Typography>
          </Box>

          {/* Google Sign In Button */}
          <Box sx={{ width: '100%', py: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              loading={loading}
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
                  Sign in with Google
                </Typography>
              </Stack>
            </Button>
          </Box>

        </Stack>
      </Container>
    </Box>
  );
}

import { useState } from 'react';
import { AppBar, Toolbar, Stack, Typography, IconButton, Tooltip, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ActivityBell } from '../../features/activity/ActivityBell';
import { ProfileMenu } from './ProfileMenu';
import type { ThemeModePref } from '../../hooks/useThemeMode';
import type { UserProfile, Household } from '../../domain/financeTypes';

interface TopBarProps {
  logoSrc: string;
  modePref: ThemeModePref;
  setModePref: (pref: ThemeModePref) => void;
  userProfile: UserProfile | null;
  householdId: string;
  userHouseholds: Household[];
  switchHousehold: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function TopBar({
  logoSrc,
  modePref,
  setModePref,
  userProfile,
  householdId,
  userHouseholds,
  switchHousehold,
  logout,
}: TopBarProps) {
  const navigate = useNavigate();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  const currentHousehold = userHouseholds.find(hh => hh.id === householdId);
  const householdName = currentHousehold ? currentHousehold.name : 'Personal Household';

  return (
    <>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ py: 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          {/* Left: Logo & Brand Name */}
          <Stack direction="row" spacing={1} alignItems="center">
            <img src={logoSrc} alt="Kippa Logo" style={{ height: 28, width: 'auto' }} />
            <Typography variant="h3" sx={{ fontWeight: 'bold', letterSpacing: '0.05em', color: 'primary.main' }}>
              Kippa
            </Typography>
          </Stack>

          {/* Right: Activity Bell & Profile */}
          <Stack direction="row" spacing={1} alignItems="center">
            <ActivityBell onClick={() => navigate('/activity')} />
            <Tooltip title="Account Menu">
              <IconButton
                onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                aria-label="account profile menu"
                aria-controls="profile-menu"
                aria-haspopup="true"
                sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', width: 40, height: 40 }}
              >
                <Avatar
                  src={userProfile?.photoURL || undefined}
                  sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem', fontWeight: 600 }}
                >
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <ProfileMenu
        anchorEl={profileAnchorEl}
        open={isProfileMenuOpen}
        onClose={() => setProfileAnchorEl(null)}
        modePref={modePref}
        setModePref={setModePref}
        userProfile={userProfile}
        householdId={householdId}
        userHouseholds={userHouseholds}
        householdName={householdName}
        switchHousehold={switchHousehold}
        logout={logout}
      />
    </>
  );
}

import {
  CheckIcon,
  ContentCopyIcon,
  DarkModeIcon,
  HomeIcon,
  LightModeIcon,
  LogoutIcon,
  TuneIcon,
  VisibilityIcon,
  VisibilityOffIcon,
} from '@/components/AppIcon';

import {
  Box,
  Paper,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography,
  Stack,
  Tooltip,
  IconButton,
} from '@monochrome-ui/design-system';
import type { ThemeModePref } from '@/contexts/themeModeContext';
import type { UserProfile, Household } from '@kippa/domain';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { UserAvatar } from '@/components/UserAvatar';

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  modePref: ThemeModePref;
  setModePref: (pref: ThemeModePref) => void;
  userProfile: UserProfile | null;
  householdId: string;
  userHouseholds: Household[];
  householdName: string;
  switchHousehold: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function ProfileMenu({
  anchorEl,
  open,
  onClose,
  modePref,
  setModePref,
  userProfile,
  householdId,
  userHouseholds,
  householdName,
  switchHousehold,
  logout,
}: ProfileMenuProps) {
  const { privacyMode, setPrivacyMode } = usePrivacyMode();

  const handleClose = () => {
    onClose();
  };

  return (
    <Menu
      id="profile-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          elevation: 0,
          variant: 'navigationMenu',
          sx: { mt: 1.5, minWidth: 280 },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* User details */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <UserAvatar
            photoURLs={[userProfile?.photoURL]}
            displayName={userProfile?.displayName}
            variant="profileMenu"
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="profileMenuName" color="text.primary" noWrap>
              {userProfile?.displayName || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              {userProfile?.email || 'No email associated'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Household sharing info */}
      <Box sx={{ py: 0.75 }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 2.5, mb: 1, display: 'block' }}>
          Current Household
        </Typography>

        <Paper
          component={Stack}
          variant="profileHouseholdRow"
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ mx: 1, px: 1.5, py: 1.25 }}
        >
          <HomeIcon size={22} strokeWidth={1.8} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="profileHouseholdName" color="text.primary" noWrap>
              {householdName}
            </Typography>
            <Typography variant="profileHouseholdId" color="text.secondary">
              ID: {householdId ? `${householdId.slice(0, 8)}...` : 'None'}
            </Typography>
          </Box>
          {householdId && (
            <Tooltip title="Copy Household ID">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(householdId || '');
                }}
                sx={{ p: 0.5 }}
              >
                <ContentCopyIcon size={22} strokeWidth={1.8} />
              </IconButton>
            </Tooltip>
          )}
        </Paper>
      </Box>

      {/* Quick Switch Households */}
      {userHouseholds.length > 1 && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ px: 2.5, mt: 1.5, mb: 0.5, display: 'block' }}>
            Switch Household
          </Typography>
          {userHouseholds.map((hh) => {
            if (hh.id === householdId) return null;
            return (
              <MenuItem
                key={hh.id}
                onClick={async () => {
                  handleClose();
                  try {
                    await switchHousehold(hh.id);
                  } catch (err) {
                    console.error('Failed to switch household:', err);
                  }
                }}
              >
                <ListItemIcon>
                  <HomeIcon size={22} strokeWidth={1.8} />
                </ListItemIcon>
                <ListItemText primary={hh.name} secondary={`ID: ${hh.id.slice(0, 8)}...`} />
              </MenuItem>
            );
          })}
        </>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Appearance / Theme */}
      <Typography variant="overline" color="text.secondary" sx={{ px: 2.5, mt: 0.5, mb: 0.5, display: 'block' }}>
        Appearance
      </Typography>
      {[
        { value: 'light' as ThemeModePref, label: 'Light', Icon: LightModeIcon },
        { value: 'dark' as ThemeModePref, label: 'Dark', Icon: DarkModeIcon },
        { value: 'system' as ThemeModePref, label: 'System default', Icon: TuneIcon },
      ].map(({ value, label, Icon }) => {
        const selected = modePref === value;
        return (
          <MenuItem
            key={value}
            onClick={() => {
              setModePref(value);
              handleClose();
            }}
            sx={{ py: 0.75 }}
          >
            <ListItemIcon>
              <Icon size={22} strokeWidth={1.8} />
            </ListItemIcon>
            <ListItemText primary={label} />
            {selected && <CheckIcon size={22} strokeWidth={1.8} />}
          </MenuItem>
        );
      })}

      <Divider sx={{ my: 1 }} />

      {/* Privacy mode — mask monetary values for screen sharing / demos */}
      <MenuItem
        onClick={() => {
          setPrivacyMode(!privacyMode);
          handleClose();
        }}
        sx={{ py: 0.75 }}
      >
        <ListItemIcon>
          {privacyMode ? (
            <VisibilityOffIcon size={22} strokeWidth={1.8} />
          ) : (
            <VisibilityIcon size={22} strokeWidth={1.8} />
          )}
        </ListItemIcon>
        <ListItemText primary={privacyMode ? 'Privacy Mode On' : 'Privacy Mode'} secondary="Hide balances" />
        {privacyMode && <CheckIcon size={22} strokeWidth={1.8} />}
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      <MenuItem
        onClick={() => {
          handleClose();
          logout();
        }}
        kippaTone="destructive"
      >
        <ListItemIcon>
          <LogoutIcon size={22} strokeWidth={1.8} />
        </ListItemIcon>
        <ListItemText primary="Sign Out" />
      </MenuItem>
    </Menu>
  );
}

import { IconAdjustments, IconCheck, IconCopy, IconEye, IconEyeOff, IconHome, IconLogout2, IconMoon, IconSun } from '@tabler/icons-react';
import {
  Box,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import type { ThemeModePref } from '@/contexts/themeModeContext';
import type { UserProfile, Household } from '@kippa/domain';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { auth } from '@/config/firebase';
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

const menuItemStyle = {
  mx: 1,
  my: 0.25,
  px: 1.5,
  py: 1,
  borderRadius: '8px',
  '&.MuiMenuItem-root': {
    borderRadius: '8px',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 30,
    color: 'text.primary',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'text.primary',
  },
  '& .MuiListItemText-secondary': {
    fontSize: '0.75rem',
  },
};

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
          sx: {
            overflow: 'visible',
            mt: 1.5,
            minWidth: 280,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 18,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: '1px solid',
              borderTop: '1px solid',
              borderColor: 'divider',
            },
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* User details */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <UserAvatar
            photoURLs={[auth?.currentUser?.photoURL, userProfile?.photoURL]}
            displayName={userProfile?.displayName}
            sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: '1.1rem', fontWeight: 600 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body1" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
              {userProfile?.displayName || 'User'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all', fontSize: '0.75rem' }}>
              {userProfile?.email || 'No email associated'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Household sharing info */}
      <Box sx={{ py: 0.75 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            px: 2.5,
            mb: 1,
            display: 'block',
          }}
        >
          Current Household
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            mx: 1,
            px: 1.5,
            py: 1.25,
            borderRadius: '8px',
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IconHome size={22} strokeWidth={1.8} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
              {householdName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.6875rem' }}>
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
                sx={{
                  p: 0.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '6px',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <IconCopy size={22} strokeWidth={1.8} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Quick Switch Households */}
      {userHouseholds.length > 1 && (
        <>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              px: 2.5,
              mt: 1.5,
              mb: 0.5,
              display: 'block',
            }}
          >
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
                sx={menuItemStyle}
              >
                <ListItemIcon>
                  <IconHome size={22} strokeWidth={1.8} />
                </ListItemIcon>
                <ListItemText primary={hh.name} secondary={`ID: ${hh.id.slice(0, 8)}...`} />
              </MenuItem>
            );
          })}
        </>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Appearance / Theme */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: 'text.secondary',
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          px: 2.5,
          mt: 0.5,
          mb: 0.5,
          display: 'block',
        }}
      >
        Appearance
      </Typography>
      {[
        { value: 'light' as ThemeModePref, label: 'Light', Icon: IconSun },
        { value: 'dark' as ThemeModePref, label: 'Dark', Icon: IconMoon },
        { value: 'system' as ThemeModePref, label: 'System default', Icon: IconAdjustments },
      ].map(({ value, label, Icon }) => {
        const selected = modePref === value;
        return (
          <MenuItem
            key={value}
            onClick={() => {
              setModePref(value);
              handleClose();
            }}
            sx={{ ...menuItemStyle, py: 0.75 }}
          >
            <ListItemIcon>
              <Icon size={22} strokeWidth={1.8} />
            </ListItemIcon>
            <ListItemText primary={label} />
            {selected && <IconCheck size={22} strokeWidth={1.8} />}
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
        sx={{ ...menuItemStyle, py: 0.75 }}
      >
        <ListItemIcon>
          {privacyMode ? <IconEyeOff size={22} strokeWidth={1.8} /> : <IconEye size={22} strokeWidth={1.8} />}
        </ListItemIcon>
        <ListItemText primary={privacyMode ? 'Privacy Mode On' : 'Privacy Mode'} secondary="Hide balances" />
        {privacyMode && <IconCheck size={22} strokeWidth={1.8} />}
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      <MenuItem
        onClick={() => {
          handleClose();
          logout();
        }}
        sx={{
          ...menuItemStyle,
          color: 'error.main',
          '& .MuiListItemIcon-root': { minWidth: 30, color: 'error.main' },
          '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: 600, color: 'error.main' },
        }}
      >
        <ListItemIcon>
          <IconLogout2 size={22} strokeWidth={1.8} />
        </ListItemIcon>
        <ListItemText primary="Sign Out" />
      </MenuItem>
    </Menu>
  );
}

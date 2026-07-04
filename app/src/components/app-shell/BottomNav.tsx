import { Paper, Box, Typography, useTheme, alpha } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddIcon from '@mui/icons-material/Add';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const LEFT_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Reconcile', path: '/reconciliation', icon: <SyncAltIcon /> },
];

const RIGHT_ITEMS: NavItem[] = [
  { label: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon /> },
  { label: 'Cycles', path: '/cycles', icon: <CalendarMonthIcon /> },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();

  const isEntry = pathname === '/entry';
  const isDark = theme.palette.mode === 'dark';

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.path;
    return (
      <Box
        key={item.path}
        onClick={() => navigate(item.path)}
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          py: '6px',
          px: { xs: 1, sm: 1.5 },
          borderRadius: '24px',
          cursor: 'pointer',
          color: isActive ? 'primary.main' : 'text.secondary',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'scale(1.08)' },
          '&:active': { transform: 'scale(0.92)' },
          '& .MuiSvgIcon-root': {
            fontSize: '22px',
            transition: 'all 0.2s ease',
          },
        }}
      >
        {item.icon}
        <Typography
          sx={{
            fontSize: '10px',
            fontWeight: isActive ? 700 : 500,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        bgcolor: 'background.paper',
        borderRadius: '32px',
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.25),
        boxShadow: `0 0 16px ${alpha(theme.palette.primary.main, 0.15)}, 0 0 40px ${alpha(theme.palette.primary.main, 0.08)}`,
        padding: '6px',
        maxWidth: 'calc(100vw - 24px)',
        overflow: 'visible',
        animation: 'navFloatIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        '@keyframes navFloatIn': {
          from: { opacity: 0, transform: 'translateX(-50%) translateY(20px)' },
          to: { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 52,
          gap: '4px',
        }}
      >
        {LEFT_ITEMS.map(renderNavItem)}

        {/* Center + button — emerges from the notch in the pill above */}
        <Box
          onClick={() => navigate('/entry')}
          sx={{
            width: 56,
            height: 56,
            mt: '-34px',
            mx: '6px',
            flexShrink: 0,
            borderRadius: '50%',
            bgcolor: isEntry ? 'primary.dark' : 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isDark
              ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.5)}`
              : `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: isDark
                ? `0 6px 22px ${alpha(theme.palette.primary.main, 0.65)}`
                : `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
            },
            '&:active': { transform: 'scale(0.92)' },
            '& .MuiSvgIcon-root': { fontSize: '30px' },
          }}
        >
          <AddIcon />
        </Box>

        {RIGHT_ITEMS.map(renderNavItem)}
      </Box>
    </Paper>
  );
}

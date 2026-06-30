import { Paper, BottomNavigation, BottomNavigationAction, useTheme, alpha } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Entry', path: '/entry', icon: <AddCircleIcon /> },
  { label: 'Reconcile', path: '/reconciliation', icon: <SyncAltIcon /> },
  { label: 'Cycles', path: '/cycles', icon: <CalendarMonthIcon /> },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();

  const currentPath = pathname === '/' ? '/' : pathname;

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
        overflow: 'hidden',
        animation: 'navFloatIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        '@keyframes navFloatIn': {
          from: { opacity: 0, transform: 'translateX(-50%) translateY(20px)' },
          to: { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
        },
      }}
    >
      <BottomNavigation
        value={currentPath}
        onChange={(_, newValue) => navigate(newValue)}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            minWidth: 'auto',
            paddingX: { xs: 1.5, sm: 2.5 },
            paddingY: '4px',
            borderRadius: '24px',
            transition: 'all 0.2s ease',
            '& .MuiBottomNavigationAction-label': {
              fontSize: '11px',
              fontWeight: 500,
              marginTop: '2px',
              '&.Mui-selected': { fontSize: '11px' },
            },
            '& .MuiSvgIcon-root': {
              fontSize: '22px',
              transition: 'all 0.2s ease',
            },
            '&.Mui-selected': {
              color: 'primary.main',
              '& .MuiBottomNavigationAction-label': { fontWeight: 700 },
              '& .MuiSvgIcon-root': { color: 'primary.main' },
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction key={item.path} label={item.label} value={item.path} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

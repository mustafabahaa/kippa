import {
  AccountBalanceIcon,
  CalendarMonthIcon,
  CategoryIcon,
  HistoryIcon,
  HomeIcon,
  NotificationsActiveIcon,
  PaymentsIcon,
  ReceiptLongIcon,
  SwapHorizIcon,
} from '@/components/AppIcon';

import { Menu, MenuItem, Divider, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface QuickNavMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Money',
    items: [
      { label: 'Bank Accounts', icon: <AccountBalanceIcon size={22} strokeWidth={1.8} />, path: '/accounts' },
      { label: 'Statements', icon: <ReceiptLongIcon size={22} strokeWidth={1.8} />, path: '/accounts/statements' },
      { label: 'Transactions', icon: <ReceiptLongIcon size={22} strokeWidth={1.8} />, path: '/transactions' },
      { label: 'Categories', icon: <CategoryIcon size={22} strokeWidth={1.8} />, path: '/categories' },
    ],
  },
  {
    title: 'Planning',
    items: [
      { label: 'Budget Cycles', icon: <CalendarMonthIcon size={22} strokeWidth={1.8} />, path: '/cycles' },
      { label: 'Cycle Reports', icon: <HistoryIcon size={22} strokeWidth={1.8} />, path: '/cycles/report' },
      { label: 'Loans', icon: <PaymentsIcon size={22} strokeWidth={1.8} />, path: '/loans' },
      { label: 'Reconciliation', icon: <SwapHorizIcon size={22} strokeWidth={1.8} />, path: '/reconciliation' },
    ],
  },
  {
    title: 'Household',
    items: [
      { label: 'Household Sharing', icon: <HomeIcon size={22} strokeWidth={1.8} />, path: '/household' },
      { label: 'Activity history', icon: <HistoryIcon size={22} strokeWidth={1.8} />, path: '/activity' },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        label: 'Reminders & Alerts',
        icon: <NotificationsActiveIcon size={22} strokeWidth={1.8} />,
        path: '/notifications',
      },
    ],
  },
] as const;

/**
 * Quick navigation menu — anchored to the nav icon button in the TopBar.
 * Surfaces all secondary page destinations (Accounts, Transactions, etc.)
 * so they're one tap away, separate from the settings-heavy profile menu.
 * Styled to match the profile menu: same paper, arrow, borders, sections.
 */
export function QuickNavMenu({ anchorEl, open, onClose }: QuickNavMenuProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Menu
      id="quick-nav-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
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
      {SECTIONS.map((section, sIdx) => (
        <div key={section.title}>
          {sIdx > 0 && <Divider sx={{ my: 1 }} />}
          <Typography variant="overline" color="text.secondary" sx={{ px: 2.5, mt: 0.5, mb: 0.5, display: 'block' }}>
            {section.title}
          </Typography>
          {section.items.map((item) => {
            const isActive = pathname === item.path;
            return (
              <MenuItem
                key={item.path}
                onClick={() => go(item.path)}
                selected={isActive}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            );
          })}
        </div>
      ))}
    </Menu>
  );
}

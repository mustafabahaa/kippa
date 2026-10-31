import {
  AccountBalanceIcon,
  AddIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BarChartIcon,
  CalendarMonthIcon,
  CategoryIcon,
  DashboardIcon,
  DocumentTextIcon,
  ExpandMoreIcon,
  GroupAddIcon,
  HistoryIcon,
  HomeIcon,
  MessageIcon,
  NotificationsIcon,
  PaymentsIcon,
  ReceiptLongIcon,
  SwapHorizIcon,
  SyncAltIcon,
  TimerIcon,
  WalletIcon,
} from '@/components/AppIcon';

import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Box, ButtonBase, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Tooltip } from '@monochrome-ui/design-system';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

type NavChild = { label: string; path: string; icon: typeof DashboardIcon };
type NavItem = { label: string; path: string; icon: typeof DashboardIcon; children?: NavChild[] };

const menuGroups: NavItem[][] = [
  [
    { label: 'Dashboard', path: '/', icon: DashboardIcon },
    { label: 'Ask Kip', path: '/ai', icon: MessageIcon },
    { label: 'Loans', path: '/loans', icon: PaymentsIcon },
  ],
  [
    {
      label: 'Analytics',
      path: '/cycles',
      icon: BarChartIcon,
      children: [
        { label: 'Budget cycles', path: '/cycles', icon: CalendarMonthIcon },
        { label: 'Cycle reports', path: '/cycles/report', icon: BarChartIcon },
        { label: 'Categories', path: '/categories', icon: CategoryIcon },
      ],
    },
  ],
  [
    {
      label: 'Transactions',
      path: '/transactions',
      icon: ReceiptLongIcon,
      children: [
        { label: 'All transactions', path: '/transactions', icon: ReceiptLongIcon },
        { label: 'Pending review', path: '/pending', icon: TimerIcon },
        { label: 'Expenses', path: '/transactions?type=expense', icon: ArrowDownIcon },
        { label: 'Income', path: '/transactions?type=income', icon: ArrowUpIcon },
        { label: 'Transfers', path: '/transactions?type=transfer', icon: SwapHorizIcon },
      ],
    },
  ],
  [
    {
      label: 'Accounts & cards',
      path: '/accounts',
      icon: AccountBalanceIcon,
      children: [
        { label: 'Account overview', path: '/accounts', icon: WalletIcon },
        { label: 'Statements', path: '/accounts/statements', icon: DocumentTextIcon },
        { label: 'Reconciliation', path: '/reconciliation', icon: SyncAltIcon },
      ],
    },
    {
      label: 'Household',
      path: '/household',
      icon: HomeIcon,
      children: [
        { label: 'Members & settings', path: '/household', icon: GroupAddIcon },
        { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
        { label: 'Activity history', path: '/activity', icon: HistoryIcon },
      ],
    },
  ],
];

export function SideNav() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: NavItem } | null>(null);
  const logoSrc =
    theme.palette.mode === 'dark' ? '/icons/logo_white_transparent.png' : '/icons/logo_black_transparent.png';

  const isActive = (item: NavItem) =>
    pathname === item.path || Boolean(item.children?.some((child) => pathname === child.path.split('?')[0]));

  const openItem = (event: MouseEvent<HTMLElement>, item: NavItem) => {
    if (item.children?.length) {
      setMenu({ anchor: event.currentTarget, item });
      return;
    }
    navigate(item.path);
  };

  const closeMenu = () => setMenu(null);

  return (
    <Paper
      component="aside"
      variant="workspaceSidebar"
      aria-label="Workspace sidebar"
      sx={{
        display: { xs: 'none', md: 'flex' },
        position: 'fixed',
        inset: '0 auto 0 0',
        width: 72,
        zIndex: 1200,
        flexDirection: 'column',
        alignItems: 'center',
        px: 1.25,
        py: 2.25,
      }}
    >
      <Tooltip title="Kippa" placement="right">
        <ButtonBase
          onClick={() => navigate('/')}
          aria-label="Kippa home"
          sx={{ width: 48, height: 48, mb: 2 }}
        >
          <Box component="img" src={logoSrc} alt="" sx={{ width: 36, height: 36, objectFit: 'contain' }} />
        </ButtonBase>
      </Tooltip>

      <Box
        component="nav"
        aria-label="Desktop navigation"
        sx={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column', justifyContent: 'center', gap: 2 }}
      >
        {menuGroups.map((group, index) => (
          <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
            {group.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Tooltip key={item.path} title={item.label} placement="right">
                  <ButtonBase
                    className="ds-desktop-nav-item"
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    aria-haspopup={item.children ? 'menu' : undefined}
                    data-open={menu?.item.path === item.path ? 'true' : undefined}
                    onClick={(event) => openItem(event, item)}
                  >
                    <Box
                      className="kippa-nav-icon-wrap"
                      sx={{ position: 'relative', width: 22, height: 22, display: 'grid', placeItems: 'center' }}
                    >
                      <Icon size={22} strokeWidth={1.8} />
                      {item.children && (
                        <ExpandMoreIcon className="ds-nav-submenu-caret" size={11} strokeWidth={2} />
                      )}
                    </Box>
                  </ButtonBase>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>

      <Tooltip title="Quick entry" placement="right">
        <IconButton
          className="ds-desktop-quick-entry"
          aria-label="Quick entry"
          onClick={() => navigate('/entry')}
          sx={{ width: 48, height: 48, flexShrink: 0, mb: 1 }}
        >
          <AddIcon size={22} strokeWidth={1.8} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={menu?.anchor ?? null}
        open={Boolean(menu)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      >
        {menu?.item.children?.map((child) => {
          const active = child.path.includes('?') ? `${pathname}${search}` === child.path : pathname === child.path;
          return (
            <MenuItem
              className="kippa-submenu-item"
              key={child.path}
              selected={active}
              onClick={() => {
                closeMenu();
                navigate(child.path);
              }}
            >
              <ListItemIcon>
                <child.icon size={19} strokeWidth={1.8} />
              </ListItemIcon>
              <ListItemText primary={child.label} />
            </MenuItem>
          );
        })}
      </Menu>
    </Paper>
  );
}

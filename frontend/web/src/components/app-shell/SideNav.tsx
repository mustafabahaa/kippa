import {
  IconBuildingBank,
  IconArrowsLeftRight,
  IconBell,
  IconChartBar,
  IconCalendarStats,
  IconCategory,
  IconChevronDown,
  IconClock,
  IconCreditCardPay,
  IconFileText,
  IconGitCompare,
  IconHistory,
  IconHome,
  IconLayoutDashboard,
  IconListDetails,
  IconMessage2,
  IconPlus,
  IconReportAnalytics,
  IconReceipt,
  IconArrowDownRight,
  IconArrowUpRight,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Box, ButtonBase, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

type NavChild = { label: string; path: string; icon: typeof IconLayoutDashboard };
type NavItem = { label: string; path: string; icon: typeof IconLayoutDashboard; children?: NavChild[] };

const menuGroups: NavItem[][] = [
  [
    { label: 'Dashboard', path: '/', icon: IconLayoutDashboard },
    { label: 'Ask Kip', path: '/ai', icon: IconMessage2 },
    { label: 'Loans', path: '/loans', icon: IconCreditCardPay },
  ],
  [
    {
      label: 'Analytics',
      path: '/cycles',
      icon: IconChartBar,
      children: [
        { label: 'Budget cycles', path: '/cycles', icon: IconCalendarStats },
        { label: 'Cycle reports', path: '/cycles/report', icon: IconReportAnalytics },
        { label: 'Categories', path: '/categories', icon: IconCategory },
      ],
    },
  ],
  [
    {
      label: 'Transactions',
      path: '/transactions',
      icon: IconReceipt,
      children: [
        { label: 'All transactions', path: '/transactions', icon: IconListDetails },
        { label: 'Pending review', path: '/pending', icon: IconClock },
        { label: 'Expenses', path: '/transactions?type=expense', icon: IconArrowDownRight },
        { label: 'Income', path: '/transactions?type=income', icon: IconArrowUpRight },
        { label: 'Transfers', path: '/transactions?type=transfer', icon: IconArrowsLeftRight },
      ],
    },
  ],
  [
    {
      label: 'Accounts & cards',
      path: '/accounts',
      icon: IconBuildingBank,
      children: [
        { label: 'Account overview', path: '/accounts', icon: IconWallet },
        { label: 'Statements', path: '/accounts/statements', icon: IconFileText },
        { label: 'Reconciliation', path: '/reconciliation', icon: IconGitCompare },
      ],
    },
    {
      label: 'Household',
      path: '/household',
      icon: IconHome,
      children: [
        { label: 'Members & settings', path: '/household', icon: IconUsers },
        { label: 'Notifications', path: '/notifications', icon: IconBell },
        { label: 'Activity history', path: '/activity', icon: IconHistory },
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
    <Box
      component="aside"
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
        bgcolor: 'background.sidebar',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Tooltip title="Kippa" placement="right">
        <ButtonBase
          onClick={() => navigate('/')}
          aria-label="Kippa home"
          sx={{ width: 48, height: 48, mb: 2, borderRadius: 2 }}
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
                    className="kippa-desktop-nav-item"
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
                        <IconChevronDown className="kippa-nav-submenu-caret" size={11} strokeWidth={2} />
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
        <ButtonBase
          className="kippa-desktop-quick-entry"
          aria-label="Quick entry"
          onClick={() => navigate('/entry')}
          sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: '50%', mb: 1 }}
        >
          <IconPlus size={22} strokeWidth={1.8} />
        </ButtonBase>
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
    </Box>
  );
}

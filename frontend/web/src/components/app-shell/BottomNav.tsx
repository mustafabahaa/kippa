import { AddIcon, DashboardIcon, HourglassEmptyIcon, MessageIcon, ReceiptLongIcon } from '@/components/AppIcon';

import { Box } from '@mui/material';
import {
  MobileBottomNavigationAction,
  MobileBottomNavigationItem,
  MobileBottomNavigationShape,
  MobileBottomNavigationShell,
} from '@kippa/design-system';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { usePendingFinancialMessages } from '@/hooks/useFinance';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const LEFT_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon size={22} strokeWidth={1.8} /> },
  { label: 'Kip', path: '/ai', icon: <MessageIcon size={22} strokeWidth={1.8} /> },
];

const RIGHT_ITEMS: NavItem[] = [
  { label: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon size={22} strokeWidth={1.8} /> },
  { label: 'Pending', path: '/pending', icon: <HourglassEmptyIcon size={22} strokeWidth={1.8} /> },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { householdId } = useAppContext();
  const { data: pendingItems = [] } = usePendingFinancialMessages(householdId);
  const pendingCount = pendingItems.length;

  const isEntry = pathname === '/entry';
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 64 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.target.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.path;
    const isPending = item.path === '/pending';
    return (
      <MobileBottomNavigationItem
        key={item.path}
        active={isActive}
        label={item.label}
        icon={item.icon}
        onClick={() => navigate(item.path)}
        badgeCount={isPending ? pendingCount : 0}
        ariaLabel={
          isPending && pendingCount > 0 ? `Pending review, ${pendingCount} items require attention` : item.label
        }
      />
    );
  };

  // Generate notched path dynamically — full-width bar flush to the screen
  // bottom with square corners; the top edge dips around the center + button.
  const getPathData = () => {
    const W = size.width;
    const H = size.height;
    if (W === 0) return '';

    const cX = W / 2;
    const depth = 34; // Depth of the notch dip
    const notchWidth = 48; // Width from center to start of curve

    const x0 = cX - notchWidth;
    const x1 = x0 + 20;
    const x2 = cX - 20;
    const x3 = cX + notchWidth;
    const x4 = cX + 20;
    const x5 = x3 - 20;

    // Overshoot the viewport edges by 2px so the stroke only paints along the
    // top edge and notch — the side/bottom strokes fall off-screen.
    return `
      M -2,-2
      L ${x0},0
      C ${x1},0 ${x2},${depth} ${cX},${depth}
      C ${x4},${depth} ${x5},0 ${x3},0
      L ${W + 2},0
      L ${W + 2},${H + 2}
      L -2,${H + 2}
      Z
    `
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <MobileBottomNavigationShell
      ref={containerRef}
    >
      {size.width > 0 && (
        <MobileBottomNavigationShape width={size.width} height={size.height} path={getPathData()} />
      )}

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
        <MobileBottomNavigationAction active={isEntry} onClick={() => navigate('/entry')}>
          <AddIcon size={30} strokeWidth={1.8} />
        </MobileBottomNavigationAction>

        {RIGHT_ITEMS.map(renderNavItem)}
      </Box>
    </MobileBottomNavigationShell>
  );
}

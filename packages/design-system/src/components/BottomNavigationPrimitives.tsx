import { forwardRef, type ReactNode } from 'react';
import { Badge, Paper, useTheme, type PaperProps } from '@mui/material';
import { alpha, keyframes, styled } from '@mui/material/styles';

const navFloatIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const BottomNavigationSurface = styled(Paper)(({ theme }) => ({
  display: 'block',
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  padding: '6px 6px calc(6px + env(safe-area-inset-bottom))',
  overflow: 'visible',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  boxShadow: 'none',
  animation: `${navFloatIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1)`,
  [`${theme.breakpoints.up('md')}`]: { display: 'none' },
}));

export const MobileBottomNavigationShell = forwardRef<HTMLDivElement, PaperProps>(function MobileBottomNavigationShell(
  props,
  ref,
) {
  return <BottomNavigationSurface ref={ref} elevation={0} {...props} />;
});

const NavItemRoot = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ theme, active }) => ({
  border: 0,
  backgroundColor: 'transparent',
  font: 'inherit',
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  padding: '6px 8px',
  borderRadius: 24,
  cursor: 'pointer',
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  transition: 'transform 0.2s ease, color 0.2s ease',
  '&:hover': { transform: 'scale(1.08)' },
  '&:active': { transform: 'scale(0.92)' },
}));

const PendingBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    minWidth: 18,
    height: 18,
    padding: theme.spacing(0, 0.5),
    fontSize: 10,
    fontWeight: 800,
  },
}));

const NavItemLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ theme, active }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: 10,
  fontWeight: active ? 700 : 500,
  lineHeight: 1,
  whiteSpace: 'nowrap',
}));

export interface MobileBottomNavigationItemProps {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  badgeCount?: number;
  ariaLabel?: string;
}

export function MobileBottomNavigationItem({
  active,
  label,
  icon,
  onClick,
  badgeCount = 0,
  ariaLabel = label,
}: MobileBottomNavigationItemProps) {
  const itemIcon = badgeCount > 0 ? (
    <PendingBadge color="warning" badgeContent={badgeCount} max={99} overlap="circular">
      {icon}
    </PendingBadge>
  ) : icon;

  return (
    <NavItemRoot type="button" active={active} onClick={onClick} aria-label={ariaLabel}>
      {itemIcon}
      <NavItemLabel active={active}>{label}</NavItemLabel>
    </NavItemRoot>
  );
}

const QuickActionRoot = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ theme, active }) => ({
  width: 56,
  height: 56,
  marginTop: -34,
  marginInline: 6,
  flexShrink: 0,
  border: 0,
  borderRadius: '50%',
  backgroundColor: active ? theme.palette.primary.dark : theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease',
  '&:hover': { transform: 'scale(1.1)' },
  '&:active': { transform: 'scale(0.92)' },
}));

export function MobileBottomNavigationAction({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <QuickActionRoot type="button" active={active} onClick={onClick} aria-label="Quick entry">
      {children}
    </QuickActionRoot>
  );
}

export function MobileBottomNavigationShape({
  width,
  height,
  path,
}: {
  width: number;
  height: number;
  path: string;
}) {
  const theme = useTheme();
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <path
        d={path}
        fill={theme.palette.background.paper}
        stroke={alpha(theme.palette.primary.main, 0.25)}
        strokeWidth={1}
      />
    </svg>
  );
}

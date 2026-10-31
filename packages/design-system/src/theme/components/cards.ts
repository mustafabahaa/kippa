import { alpha, type Components, type Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    categoryRow: true;
    categoryListRow: true;
    dashboardAccountRow: true;
    timelineRow: true;
    iconBadge: true;
    dashboardSection: true;
    bankCard: true;
    bankCardHeader: true;
    cardDetailDialog: true;
    budgetCategoryRow: true;
    profileHouseholdRow: true;
    navigationMenu: true;
    workspaceSidebar: true;
    emptyState: true;
    emptyStateIcon: true;
    emptyStateLogo: true;
  }
}

export const cardOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => {
  const chrome = mode === 'dark' ? '#FFFFFF' : '#0D0D0D';
  const highlight = mode === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,.045)' : 'inset 0 1px 0 rgba(255,255,255,.9)';
  const shadow = mode === 'dark' ? '0 12px 28px rgba(0,0,0,.16)' : '0 10px 26px rgba(24,53,34,.035)';
  const bankCardSurface = {
    position: 'relative',
    overflow: 'hidden',
    color: mode === 'dark' ? '#F5F5F5' : '#171717',
    border: mode === 'dark' ? '1px solid rgba(255,255,255,.12)' : 0,
    backgroundColor: mode === 'dark' ? '#292929' : '#DEDEDE',
    backgroundImage: mode === 'dark'
      ? 'linear-gradient(130deg, #303030 0%, #272727 55%, #202020 100%)'
      : 'linear-gradient(130deg, #EAEAEA 0%, #DEDEDE 55%, #D3D3D3 100%)',
    boxShadow: 'none',
    transition: 'transform 150ms ease, filter 150ms ease',
    '&[data-inactive="true"]': { filter: 'grayscale(1) brightness(.72)' },
    '&[data-clickable="true"]:hover': { transform: 'translateY(-2px)' },
    '.bank-card-muted': { color: mode === 'dark' ? 'rgba(245,245,245,.72)' : 'rgba(23,23,23,.68)' },
    '.bank-card-utilization': {
      height: 3,
      maxWidth: 180,
      marginTop: 8,
      borderRadius: 2,
      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.12)',
      '& .MuiLinearProgress-bar': { backgroundColor: mode === 'dark' ? '#FFFFFF' : '#0D0D0D' },
    },
    '.bank-card-utilization-detail': {
      height: 6,
      borderRadius: 3,
      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.15)',
      '& .MuiLinearProgress-bar': { borderRadius: 3 },
    },
    '.bank-card-utilization-detail--success .MuiLinearProgress-bar': { backgroundColor: designTokens.color.success },
    '.bank-card-utilization-detail--warning .MuiLinearProgress-bar': { backgroundColor: designTokens.color.warning },
    '.bank-card-utilization-detail--error .MuiLinearProgress-bar': { backgroundColor: designTokens.color.error },
    '.bank-card-pay-action': {
      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.16)' : '#0D0D0D',
      color: '#FFFFFF',
      '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.24)' : '#262626' },
      '&.Mui-disabled': {
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.08)' : 'rgba(13,13,13,.16)',
        color: mode === 'dark' ? 'rgba(245,245,245,.4)' : 'rgba(23,23,23,.42)',
      },
    },
  } as const;
  return {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: t.surfacePure,
          backgroundImage: 'none',
        },
      },
      variants: [
        {
          props: { variant: 'bankCard' },
          style: {
            ...bankCardSurface,
            borderRadius: 18,
          },
        },
        {
          props: { variant: 'bankCardHeader' },
          style: {
            ...bankCardSurface,
            border: 0,
            borderRadius: `${designTokens.radius.dialog}px ${designTokens.radius.dialog}px 0 0`,
          },
        },
        {
          props: { variant: 'cardDetailDialog' },
          style: {
            borderRadius: designTokens.radius.dialog,
            overflow: 'hidden',
            padding: 0,
          },
        },
        {
          props: { variant: 'navigationMenu' },
          style: {
            overflow: 'visible',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 18,
              width: 10,
              height: 10,
              backgroundColor: t.surfacePure,
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: `1px solid ${t.borderGray}`,
              borderTop: `1px solid ${t.borderGray}`,
            },
          },
        },
        {
          props: { variant: 'workspaceSidebar' },
          style: {
            backgroundColor: t.surfaceOffWhite,
            borderRight: `1px solid ${t.borderGray}`,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'emptyState' },
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '32px 24px',
            borderRadius: 24,
            border: `2px dashed ${t.borderGray}`,
            backgroundColor: t.surfacePure,
            width: '100%',
            boxSizing: 'border-box',
            transition: 'all 300ms ease-in-out',
          },
        },
        {
          props: { variant: 'emptyStateIcon' },
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            marginBottom: 16,
            borderRadius: 12,
            backgroundColor: alpha(chrome, mode === 'dark' ? 0.08 : 0.05),
            color: mode === 'dark' ? '#FFFFFF' : designTokens.color.primary,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'emptyStateLogo' },
          style: {
            width: 52,
            height: 52,
            marginBottom: 16,
            padding: 0,
            objectFit: 'contain',
            opacity: 0.25,
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'profileHouseholdRow' },
          style: {
            borderRadius: designTokens.radius.subtle * 2,
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.08)' : 'rgba(13,13,13,.05)',
            border: `1px solid ${t.borderGray}`,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'dashboardAccountRow' },
          style: {
            padding: '10px 0 0',
            border: 0,
            borderTop: `1px solid ${t.borderGray}`,
            borderRadius: 0,
            background: 'transparent',
            boxShadow: 'none',
            outlineColor: chrome,
          },
        },
        {
          props: { variant: 'timelineRow' },
          style: {
            border: 0,
            borderRadius: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            transition: 'background-color 150ms ease',
            '&[data-voided="true"]': { opacity: 0.5 },
            '&[data-processing="true"]': { opacity: 0.6 },
            '&:hover': { backgroundColor: alpha(chrome, mode === 'dark' ? 0.06 : 0.04) },
          },
        },
        {
          props: { variant: 'categoryListRow' },
          style: {
            padding: '12px 0',
            border: 0,
            borderBottom: `1px solid ${t.borderGray}`,
            borderRadius: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'categoryRow' },
          style: {
            borderRadius: 10,
            border: '1px solid transparent',
            boxShadow: 'none',
            backgroundColor: alpha(chrome, mode === 'dark' ? 0.12 : 0.06),
            '.category-dot': {
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: chrome,
              flexShrink: 0,
            },
            '&[data-category-type="income"] .category-dot': { backgroundColor: designTokens.color.success },
            '.category-row-action': {
              width: 36,
              height: 36,
              color: chrome,
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity .15s ease',
            },
            '&:hover .category-row-action, &:focus-within .category-row-action': { opacity: 1, pointerEvents: 'auto' },
          },
        },
        {
          props: { variant: 'budgetCategoryRow' },
          style: {
            border: 0,
            borderRadius: designTokens.radius.moderate,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:hover': { backgroundColor: t.surfaceContainerLow },
          },
        },
        {
          props: { variant: 'amountPanel' },
          style: {
            border: 0,
            borderRadius: 0,
            backgroundColor: 'transparent',
            color: t.textPrimary,
            boxShadow: 'none',
            transition: 'all .2s ease',
          },
        },
        {
          props: { variant: 'amountPanelInactive' },
          style: {
            border: 0,
            borderRadius: 0,
            backgroundColor: 'transparent',
            color: t.textSecondary,
            boxShadow: 'none',
            transition: 'all .2s ease',
          },
        },
        {
          props: { variant: 'assistantAvatar' },
          style: {
            width: 44,
            height: 44,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            backgroundColor: mode === 'dark' ? '#FFFFFF' : '#0D0D0D',
            color: mode === 'dark' ? '#0D0D0D' : '#FFFFFF',
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'assistantComposer' },
          style: {
            minHeight: 72,
            padding: '10px 10px 10px 20px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            borderRadius: 24,
            border: `1px solid ${t.borderGray}`,
            backgroundColor: t.surfacePure,
            color: t.textPrimary,
            boxShadow: 'none',
            transition: 'border-color .2s ease',
            '&:focus-within': { borderColor: chrome },
          },
        },
        {
          props: { variant: 'assistantUserMessage' },
          style: {
            borderRadius: 18,
            padding: '10px 16px',
            backgroundColor: t.surfaceContainerLow,
            color: t.textPrimary,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'assistantReply' },
          style: {
            backgroundColor: 'transparent',
            color: t.textPrimary,
            boxShadow: 'none',
            '& p': { margin: '0 0 10px' },
            '& p:last-child': { marginBottom: 0 },
            '& ul, & ol': { margin: '4px 0 10px', paddingLeft: 20 },
            '& li': { marginBottom: 4 },
            '& strong': { fontWeight: 800 },
            '& code': { padding: '2px 4px', borderRadius: 4, backgroundColor: t.surfaceOffWhite, fontSize: 13 },
          },
        },
        {
          props: { variant: 'assistantMessageAvatar' },
          style: {
            width: 28,
            height: 28,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            backgroundColor: designTokens.color.secondary,
            color: designTokens.color.onSecondary,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'assistantHeader' },
          style: { height: 56, borderRadius: 0, border: 0, backgroundColor: t.surfaceContainerLow, boxShadow: 'none' },
        },
        {
          props: { variant: 'assistantCooldown' },
          style: {
            borderRadius: 16,
            border: 0,
            padding: 16,
            backgroundColor: t.surfaceOffWhite,
            color: t.textPrimary,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'assistantAction' },
          style: {
            borderRadius: 16,
            border: `1px solid ${t.borderGray}`,
            padding: 16,
            backgroundColor: t.surfacePure,
            color: t.textPrimary,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'assistantChart' },
          style: {
            borderRadius: 16,
            border: `1px solid ${t.borderGray}`,
            padding: 16,
            backgroundColor: t.surfacePure,
            color: t.textPrimary,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'iconBadge' },
          style: {
            width: 44,
            height: 44,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            backgroundColor: alpha(designTokens.color.secondary, 0.14),
            color: chrome,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'balanceTile' },
          style: {
            padding: '12px 14px',
            borderRadius: 12,
            border: `1px solid ${t.borderGray}`,
            backgroundColor: t.surfacePure,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'categoryCapacity' },
          style: {
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '14px 14px 10px 10px',
            border: 0,
            backgroundColor: alpha(chrome, mode === 'dark' ? 0.16 : 0.075),
            backgroundImage: `repeating-linear-gradient(135deg, transparent 0 8px, ${alpha(chrome, mode === 'dark' ? 0.12 : 0.07)} 8px 10px)`,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'categoryCapacitySpent' },
          style: {
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            borderRadius: '11px 11px 8px 8px',
            border: 0,
            backgroundColor: chrome,
            boxShadow: 'none',
            transition: 'height .3s ease',
          },
        },
        {
          props: { variant: 'categoryCapacityOver' },
          style: {
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            borderRadius: '11px 11px 8px 8px',
            border: 0,
            backgroundColor: designTokens.color.error,
            boxShadow: 'none',
            transition: 'height .3s ease',
          },
        },
        {
          props: { variant: 'saveFeedbackOverlay' },
          style: {
            '--save-origin-x': '50%',
            '--save-origin-y': 'calc(100% - 122px)',
            position: 'fixed',
            inset: 0,
            cursor: 'pointer',
            overflow: 'hidden',
            animation: 'saveFeedbackCover 1600ms cubic-bezier(0.22, 1, 0.36, 1) both',
            '@keyframes saveFeedbackCover': {
              '0%': { opacity: 1, clipPath: 'circle(0 at var(--save-origin-x) var(--save-origin-y))' },
              '22%, 90%': { opacity: 1, clipPath: 'circle(150vmax at var(--save-origin-x) var(--save-origin-y))' },
              '100%': { opacity: 0, clipPath: 'circle(150vmax at var(--save-origin-x) var(--save-origin-y))' },
            },
            '@media (min-width: 1200px)': { '--save-origin-y': 'calc(100% - 96px)' },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'saveFeedbackFade 1600ms ease both',
              '@keyframes saveFeedbackFade': { '0%, 100%': { opacity: 0 }, '10%, 90%': { opacity: 1 } },
            },
            borderRadius: 0,
            border: 0,
            backgroundColor: alpha(t.surfacePure, mode === 'dark' ? 0.68 : 0.74),
            backgroundImage: 'none',
            color: t.textPrimary,
            boxShadow: 'none',
            backdropFilter: 'blur(22px) saturate(1.12)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.12)',
          },
        },
      ],
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: t.surfacePure,
          border: `1px solid ${t.borderGray}`,
          borderRadius: 20,
          boxShadow: `${highlight},${shadow}`,
          transition: 'box-shadow .2s ease,border-color .2s ease',
        },
      },
      variants: [
        {
          props: { variant: 'dashboardSection' },
          style: {
            padding: 0,
            border: 0,
            borderRadius: 0,
            background: 'transparent',
            boxShadow: 'none',
            '&& > .MuiCardContent-root': { padding: 0 },
            '&& > .MuiCardContent-root:last-child': { paddingBottom: 0 },
          },
        },
        {
          props: { variant: 'selectable' },
          style: {
            borderRadius: 16,
            border: `1px solid ${t.borderGray}`,
            background: t.surfacePure,
            color: t.textSecondary,
            boxShadow: 'none',
          },
        },
        {
          props: { variant: 'selectableSelected' },
          style: {
            borderRadius: 16,
            border: '1px solid transparent',
            background: alpha(chrome, 0.08),
            color: chrome,
            boxShadow: 'none',
          },
        },
      ],
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: designTokens.spacing.cardPadding,
          '&:last-child': { paddingBottom: designTokens.spacing.cardPadding },
        },
      },
    },
  };
};

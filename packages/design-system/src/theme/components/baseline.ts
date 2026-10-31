import { alpha, type Components, type Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const baselineOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => {
  const chrome = mode === 'dark' ? '#FFFFFF' : '#0D0D0D';
  return {
    MuiTypography: { styleOverrides: { root: { color: 'inherit' } } },
    MuiCssBaseline: {
      styleOverrides: `
      html { color-scheme: ${mode}; min-height: 100%; }
      html, body, #root { min-height: 100%; }
      body {
        background: ${t.surface};
        color: ${t.textPrimary};
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .kippa-desktop-nav-item {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        color: ${t.textSecondary};
        transition: background-color 150ms ease, color 150ms ease;
      }
      .kippa-desktop-nav-item.MuiButtonBase-root,
      .kippa-desktop-nav-item.MuiButtonBase-root:hover,
      .kippa-desktop-nav-item.MuiButtonBase-root[aria-current="page"],
      .kippa-desktop-nav-item.MuiButtonBase-root[data-open="true"] {
        border-radius: 16px;
      }
      .kippa-desktop-nav-item:hover {
        background-color: ${alpha(chrome, mode === 'dark' ? 0.05 : 0.04)};
        color: ${t.textPrimary};
      }
      .kippa-desktop-nav-item[aria-current="page"] {
        background-color: ${alpha(chrome, mode === 'dark' ? 0.08 : 0.07)};
        color: ${t.textPrimary};
      }
      .kippa-desktop-nav-item[data-open="true"] {
        background-color: ${alpha(chrome, mode === 'dark' ? 0.08 : 0.07)};
        color: ${t.textPrimary};
      }
      .kippa-nav-submenu-caret {
        position: absolute;
        right: -8px;
        bottom: -6px;
        border-radius: 50%;
        background: ${t.surface};
        color: ${t.textSecondary};
      }
      .kippa-transaction-type-dot {
        position: relative;
        z-index: 1;
        width: 8px;
        height: 8px;
        flex: 0 0 8px;
        border-radius: 50%;
        background: ${t.textSecondary};
      }
      .kippa-transaction-avatar-badge .MuiBadge-badge {
        min-width: 0;
        height: auto;
        padding: 0;
        border: 2px solid ${t.surface};
        border-radius: 50%;
        background: transparent;
      }
      .kippa-stepper {
        position: relative;
      }
      .kippa-stepper > * {
        position: relative;
      }
      .kippa-stepper > *::before,
      .kippa-stepper > *::after {
        content: '';
        position: absolute;
        z-index: 0;
        left: 30px;
        width: 1px;
        background: ${t.borderGray};
        pointer-events: none;
      }
      .kippa-stepper > *::before {
        top: 0;
        height: 50%;
      }
      .kippa-stepper > *::after {
        top: 50%;
        bottom: 0;
      }
      .kippa-stepper > :first-child::before,
      .kippa-stepper > :last-child::after {
        display: none;
      }
      .kippa-transaction-type-dot[data-type="income"] { background: ${designTokens.color.success}; }
      .kippa-transaction-type-dot[data-type="expense"] { background: ${designTokens.color.error}; }
      .kippa-transaction-type-dot[data-type="adjustment"] { background: ${designTokens.color.warning}; }
      .kippa-transaction-type-dot[data-type="transfer"] { background: ${t.textSecondary}; }
      .kippa-transaction-icon {
        border-radius: 50%;
        background: ${alpha(chrome, mode === 'dark' ? 0.1 : 0.06)};
        color: ${t.textPrimary};
      }
      .kippa-stepper-node {
        position: relative;
        z-index: 1;
        background-color: ${alpha(chrome, mode === 'dark' ? 0.1 : 0.08)};
        color: ${t.textPrimary};
      }
      .kippa-desktop-nav-item:focus-visible,
      .kippa-desktop-quick-entry:focus-visible {
        outline: 2px solid ${t.textPrimary};
        outline-offset: 2px;
      }
      .kippa-desktop-quick-entry {
        background-color: ${chrome};
        color: ${mode === 'dark' ? '#0D0D0D' : '#FFFFFF'};
        transition: opacity 150ms ease, transform 100ms ease;
      }
      .kippa-desktop-quick-entry:hover { opacity: 0.82; }
      .kippa-desktop-quick-entry:active { transform: scale(0.98); }
      input, textarea, select { font-size: 16px !important; }

      .notistack-MuiContent {
        box-sizing: border-box;
        min-height: 44px;
        padding: 6px 12px !important;
        border: 1px solid ${t.borderGray} !important;
        border-radius: ${designTokens.radius.moderate}px !important;
        background-color: ${t.surfacePure} !important;
        color: ${t.textPrimary} !important;
        box-shadow: 0 4px 16px ${mode === 'dark' ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.08)'} !important;
        font-family: ${designTokens.typography.fontFamily};
        font-size: 13px;
        font-weight: 500;
        line-height: 20px;
        letter-spacing: 0;
      }
      .notistack-MuiContent #notistack-snackbar {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 0;
        overflow-wrap: anywhere;
      }
      .notistack-MuiContent #notistack-snackbar::before {
        content: '';
        flex: 0 0 7px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: ${t.textSecondary};
      }
      .notistack-MuiContent-success #notistack-snackbar::before { background-color: ${designTokens.color.success}; }
      .notistack-MuiContent-warning #notistack-snackbar::before { background-color: ${designTokens.color.warning}; }
      .notistack-MuiContent-error #notistack-snackbar::before { background-color: ${designTokens.color.error}; }
      .notistack-MuiContent-info #notistack-snackbar::before { background-color: ${chrome}; }
      .notistack-MuiContent button { color: ${t.textSecondary}; }
    `,
    },
    MuiDivider: { styleOverrides: { root: { borderColor: 'divider' } } },
  };
};

import { createTheme, alpha, type Theme } from '@mui/material/styles';

/**
 * Design tokens sourced from the Stitch "Workspace Productivity System"
 * design system (asset ID: d778924a54e1410caa5f4bc7d35e5bca).
 *
 * Light-mode surface/text tokens are derived from the Stitch design system.
 * Dark-mode surface/text tokens are tuned to keep the teal primary palette
 * while giving the app a standard Material-3 dark appearance.
 */
export const designTokens = {
  // ── Stitch Named Colors ──────────────────────────────────────────────
  color: {
    // Primary
    primary:           '#005c55',
    primaryContainer:  '#0f766e',  // Teal primary color fill
    onPrimary:         '#ffffff',
    primaryFixed:      '#9cf2e8',
    primaryFixedDim:   '#80d5cb',
    inversePrimary:    '#80d5cb',

    // Secondary
    secondary:          '#006a61',
    secondaryContainer: '#86f2e4',
    onSecondary:        '#ffffff',

    // Tertiary (accent)
    tertiary:          '#495167',
    tertiaryContainer: '#616980',

    // Semantic status
    success: '#1E8E3E',
    warning: '#F9AB00',
    error:   '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',

    // Surfaces (light)
    surface:               '#faf8ff',
    surfaceBright:         '#faf8ff',
    surfaceContainer:      '#eaedff',
    surfaceContainerHigh:  '#e2e7ff',
    surfaceContainerHighest:'#dae2fd',
    surfaceContainerLow:   '#f2f3ff',
    surfaceContainerLowest:'#ffffff',
    surfaceDim:            '#d2d9f4',
    surfaceTint:           '#006a63',
    surfaceVariant:        '#dae2fd',

    // Custom named surfaces (from Stitch designMd)
    surfacePure:    '#FFFFFF',
    surfaceOffWhite:'#F1F3F4',
    infoAccent:     '#E8F0FE',

    // On-surface / text hierarchy (light)
    onSurface:        '#131b2e',
    onSurfaceVariant: '#3e4947',
    textPrimary:      '#131b2e',
    textSecondary:    '#3e4947',
    textTertiary:     '#495167',
    disabled:         '#79747E',

    // Borders & outlines (light)
    borderGray:     '#bdc9c6',
    outline:        '#6e7977',
    outlineVariant: '#bdc9c6',

    // Inverse
    inverseSurface:   '#283044',
    inverseOnSurface: '#eef0ff',
  },

  // ── Dark-mode surface/text/border overrides ──────────────────────────
  dark: {
    surface:               '#13141a',
    surfacePure:           '#1b1c22',
    surfaceOffWhite:       '#25262d',
    surfaceContainerLow:   '#1d1e24',
    surfaceContainer:      '#202127',
    surfaceContainerHigh:  '#26272e',
    surfaceContainerHighest:'#2b2c33',
    infoAccent:            '#1d2a2a',

    textPrimary:    '#e5e2ea',
    textSecondary:  '#b4b1bb',
    textTertiary:   '#9a97a3',
    disabled:       '#6c6973',

    borderGray:     '#3a3b42',
    outline:        '#8a8893',
    outlineVariant: '#3a3b42',

    onSurface:        '#e5e2ea',
    onSurfaceVariant: '#b4b1bb',
  },

  // ── Stitch Elevation Shadows ─────────────────────────────────────────
  shadow: {
    raised: 'rgba(0, 0, 0, 0.12) 0px 2px 6px 0px, rgb(218, 220, 224) 0px -1px 0px 0px inset',
    lifted: 'rgba(0, 0, 0, 0.15) 0px 4px 12px 0px',
  },

  // ── Stitch Spacing Scale (4px base) ──────────────────────────────────
  spacing: {
    base: 4,
    sm:   8,
    md:  16,
    lg:  24,
    xl:  32,
    cardPadding: 20,
    touchTarget: 48,
  },

  // ── Stitch Border Radius ─────────────────────────────────────────────
  radius: {
    none:    0,
    subtle:  4,
    moderate:8,
    card:   20,
    pill:   48,
  },
} as const;

// ── Font family ────────────────────────────────────────────────────────
const fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

// Resolve surface/text/border tokens for a given mode
function tokensForMode(mode: 'light' | 'dark') {
  if (mode === 'dark') {
    const d = designTokens.dark;
    return {
      surface: d.surface,
      surfacePure: d.surfacePure,
      surfaceOffWhite: d.surfaceOffWhite,
      surfaceContainerLowest: d.surfacePure,
      surfaceContainerLow: d.surfaceContainerLow,
      surfaceContainer: d.surfaceContainer,
      surfaceContainerHigh: d.surfaceContainerHigh,
      surfaceContainerHighest: d.surfaceContainerHighest,
      infoAccent: d.infoAccent,
      textPrimary: d.textPrimary,
      textSecondary: d.textSecondary,
      textTertiary: d.textTertiary,
      disabled: d.disabled,
      borderGray: d.borderGray,
      outline: d.outline,
      outlineVariant: d.outlineVariant,
      onSurface: d.onSurface,
      onSurfaceVariant: d.onSurfaceVariant,
    };
  }
  const c = designTokens.color;
  return {
    surface: c.surface,
    surfacePure: c.surfacePure,
    surfaceOffWhite: c.surfaceOffWhite,
    surfaceContainerLowest: c.surfaceContainerLowest,
    surfaceContainerLow: c.surfaceContainerLow,
    surfaceContainer: c.surfaceContainer,
    surfaceContainerHigh: c.surfaceContainerHigh,
    surfaceContainerHighest: c.surfaceContainerHighest,
    infoAccent: c.infoAccent,
    textPrimary: c.textPrimary,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    disabled: c.disabled,
    borderGray: c.borderGray,
    outline: c.outline,
    outlineVariant: c.outlineVariant,
    onSurface: c.onSurface,
    onSurfaceVariant: c.onSurfaceVariant,
  };
}

// ── Theme factory ──────────────────────────────────────────────────────
export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const c = designTokens.color;
  const t = tokensForMode(mode);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: c.primaryContainer,   // teal CTA
        dark: c.primary,            // hover/active
        light: c.primaryFixed,
        contrastText: c.onPrimary,
      },
      secondary: {
        main: c.secondary,
        light: c.secondaryContainer,
        contrastText: c.onSecondary,
      },
      success: { main: c.success },
      warning: { main: c.warning },
      error: {
        main: c.error,
        contrastText: c.onError,
      },
      info: {
        main: c.primaryContainer,
        light: t.infoAccent,
      },
      background: {
        default: t.surface,
        paper:   t.surfacePure,
      },
      text: {
        primary:  t.textPrimary,
        secondary:t.textSecondary,
        disabled: t.disabled,
      },
      divider: t.borderGray,
      action: {
        hover: t.surfaceOffWhite,
      },
    },

    typography: {
      fontFamily,
      h1: {
        fontFamily,
        fontSize: '54px',
        lineHeight: '64px',
        fontWeight: 700,
        letterSpacing: '0px',
        color: t.textPrimary,
      },
      h2: {
        fontFamily,
        fontSize: '40px',
        lineHeight: '50px',
        fontWeight: 500,
        letterSpacing: '0px',
        color: t.textPrimary,
      },
      h3: {
        fontFamily,
        fontSize: '20px',
        lineHeight: '28px',
        fontWeight: 500,
        letterSpacing: '0px',
        color: t.textPrimary,
      },
      body1: {
        fontFamily,
        fontSize: '14px',
        lineHeight: '22px',
        fontWeight: 400,
        letterSpacing: '0px',
        color: t.textSecondary,
      },
      body2: {
        fontFamily,
        fontSize: '12px',
        lineHeight: '19px',
        fontWeight: 500,
        letterSpacing: '0px',
        color: t.disabled,
      },
      button: {
        fontFamily,
        fontSize: '14px',
        lineHeight: '22px',
        fontWeight: 500,
        letterSpacing: '0px',
        textTransform: 'none' as const,
      },
    },

    shape: {
      borderRadius: designTokens.radius.moderate, // 8px – Stitch ROUND_EIGHT
    },

    components: {
      // ── AppBar ────────────────────────────────────────────────────────
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
          color: 'transparent',
        },
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            backgroundImage: 'none',
            boxShadow: 'none',
            color: t.textPrimary,
          },
        },
      },

      // ── Card (Bordered Card from Stitch) ─────────────────────────────
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            background: t.surfacePure,
            border: `1px solid ${t.borderGray}`,
            borderRadius: designTokens.radius.card,       // 20px
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: t.outline,
              boxShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 12px 0px',
            },
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: designTokens.spacing.cardPadding,     // 20px
            '&:last-child': {
              paddingBottom: designTokens.spacing.cardPadding,
            },
          },
        },
      },

      // ── Buttons ──────────────────────────────────────────────────────
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: designTokens.spacing.touchTarget,   // 48px
            fontWeight: 500,
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            background: c.primaryContainer,  // teal CTA
            color: c.onPrimary,
            borderRadius: designTokens.radius.pill,            // 48px
            padding: '12px 24px',
            '&:hover': {
              background: c.primary,
            },
            '&:active': {
              background: c.primary,
            },
          },
          outlined: {
            borderColor: t.borderGray,
            color: t.textPrimary,
            borderRadius: designTokens.radius.none,            // 0px – secondary style
            backgroundColor: alpha(t.textPrimary, mode === 'dark' ? 0.04 : 0.03),
            padding: '12px 16px',
            '&:hover': {
              backgroundColor: t.surfaceOffWhite,
              borderColor: t.borderGray,
            },
            '&:active': {
              backgroundColor: t.surfaceContainerHighest,
            },
          },
        },
      },

      // ── Icon Buttons ─────────────────────────────────────────────────
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: t.outline,
            borderRadius: designTokens.radius.pill,      // 48px – circular
            padding: '1px 6px',
            height: designTokens.spacing.touchTarget,
            width: designTokens.spacing.touchTarget,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: t.surfaceOffWhite,
              color: t.textPrimary,
            },
          },
        },
      },

      // ── Inputs (Outlined, from Stitch) ───────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.subtle,    // 4px
            backgroundColor: t.surfacePure,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: t.borderGray,
              borderWidth: 1,
              borderStyle: 'solid',
            },
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: t.surfacePure,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: t.outline,
              },
            },
            '&.Mui-focused': {
              backgroundColor: t.surfacePure,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: c.primaryContainer,
                borderWidth: 2,
              },
            },
          },
        },
      },

      // ── Bottom Navigation ────────────────────────────────────────────
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: t.surfacePure,
            height: 64,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: t.textSecondary,
            minWidth: 'auto',
            padding: '6px 0',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              color: c.primaryContainer,
            },
          },
        },
      },

      // ── Chip ─────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontFamily,
          },
        },
      },

      // ── LinearProgress ───────────────────────────────────────────────
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            height: 10,
            borderRadius: 5,
            backgroundColor: t.surfaceOffWhite,
          },
        },
      },

      // ── Alert (Callout Card style) ───────────────────────────────────
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.moderate,   // 8px
          },
          standardInfo: {
            backgroundColor: t.infoAccent,
          },
        },
      },

      // ── Menu / Paper for dropdowns ───────────────────────────────────
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: designTokens.radius.moderate,
            border: `1px solid ${t.borderGray}`,
            boxShadow: designTokens.shadow.lifted,
          },
        },
      },

      // ── Divider ──────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: t.borderGray,
          },
        },
      },

      // ── Tooltip ──────────────────────────────────────────────────────
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontFamily,
            fontSize: '12px',
            fontWeight: 500,
          },
        },
      },
    },
  });
}

/**
 * @deprecated Use `createAppTheme('light')` instead. Kept temporarily so
 * existing imports don't break during the dark-theme rollout.
 */
export const appTheme = createAppTheme('light');

import { createTheme } from '@mui/material/styles';

/**
 * Design tokens sourced from the Stitch "Workspace Productivity System"
 * design system (asset ID: d778924a54e1410caa5f4bc7d35e5bca).
 *
 * Every color, font, spacing, elevation, and radius value below is derived
 * from the Stitch design system – DO NOT add ad-hoc values.
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

    // Surfaces
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

    // On-surface / text hierarchy
    onSurface:        '#131b2e',
    onSurfaceVariant: '#3e4947',
    textPrimary:      '#131b2e',
    textSecondary:    '#3e4947',
    textTertiary:     '#495167',
    disabled:         '#79747E',

    // Borders & outlines
    borderGray:     '#bdc9c6',
    outline:        '#6e7977',
    outlineVariant: '#bdc9c6',

    // Inverse
    inverseSurface:   '#283044',
    inverseOnSurface: '#eef0ff',
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

// ── Theme ──────────────────────────────────────────────────────────────
export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.color.primaryContainer,   // #1a73e8 – the CTA blue
      dark: designTokens.color.primary,             // #005bbf – hover/active
      light: designTokens.color.primaryFixed,       // #d8e2ff
      contrastText: designTokens.color.onPrimary,
    },
    secondary: {
      main: designTokens.color.secondary,
      light: designTokens.color.secondaryContainer,
      contrastText: designTokens.color.onSecondary,
    },
    success: {
      main: designTokens.color.success,
    },
    warning: {
      main: designTokens.color.warning,
    },
    error: {
      main: designTokens.color.error,
      contrastText: designTokens.color.onError,
    },
    info: {
      main: designTokens.color.primaryContainer,
      light: designTokens.color.infoAccent,
    },
    background: {
      default: designTokens.color.surface,          // #f9f9ff
      paper:   designTokens.color.surfacePure,       // #FFFFFF
    },
    text: {
      primary:  designTokens.color.textPrimary,      // #202124
      secondary:designTokens.color.textSecondary,     // #3C4043
      disabled: designTokens.color.disabled,          // #79747E
    },
    divider: designTokens.color.borderGray,           // #DADCE0
    action: {
      hover: designTokens.color.surfaceOffWhite,      // #F1F3F4
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
      color: designTokens.color.textPrimary,
    },
    h2: {
      fontFamily,
      fontSize: '40px',
      lineHeight: '50px',
      fontWeight: 500,
      letterSpacing: '0px',
      color: designTokens.color.textPrimary,
    },
    h3: {
      fontFamily,
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 500,
      letterSpacing: '0px',
      color: designTokens.color.textPrimary,
    },
    body1: {
      fontFamily,
      fontSize: '14px',
      lineHeight: '22px',
      fontWeight: 400,
      letterSpacing: '0px',
      color: designTokens.color.textSecondary,
    },
    body2: {
      fontFamily,
      fontSize: '12px',
      lineHeight: '19px',
      fontWeight: 500,
      letterSpacing: '0px',
      color: designTokens.color.disabled,
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
      styleOverrides: {
        root: {
          backgroundColor: designTokens.color.surfacePure,
          borderBottom: `1px solid ${designTokens.color.borderGray}`,
          boxShadow: designTokens.shadow.raised,
          color: designTokens.color.textPrimary,
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
          background: designTokens.color.surfacePure,
          border: `1px solid ${designTokens.color.borderGray}`,
          borderRadius: designTokens.radius.card,       // 20px
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: designTokens.color.outline,     // #727785
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
          background: designTokens.color.primaryContainer,  // #1a73e8
          color: designTokens.color.onPrimary,
          borderRadius: designTokens.radius.pill,            // 48px
          padding: '12px 24px',
          '&:hover': {
            background: designTokens.color.primary,          // #005bbf
          },
          '&:active': {
            background: '#004493',
          },
        },
        outlined: {
          borderColor: designTokens.color.borderGray,
          color: designTokens.color.textPrimary,
          borderRadius: designTokens.radius.none,            // 0px – secondary style
          backgroundColor: '#F7F9FE',
          padding: '12px 16px',
          '&:hover': {
            backgroundColor: designTokens.color.surfaceOffWhite,
            borderColor: designTokens.color.borderGray,
          },
          '&:active': {
            backgroundColor: designTokens.color.surfaceContainerHighest,
          },
        },
      },
    },

    // ── Icon Buttons ─────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: designTokens.color.outline,
          borderRadius: designTokens.radius.pill,      // 48px – circular
          padding: '1px 6px',
          height: designTokens.spacing.touchTarget,
          width: designTokens.spacing.touchTarget,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: designTokens.color.surfaceOffWhite,
            color: designTokens.color.textPrimary,
          },
        },
      },
    },

    // ── Inputs (Outlined, from Stitch) ───────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.subtle,    // 4px
          backgroundColor: designTokens.color.surfacePure,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: designTokens.color.borderGray,
            borderWidth: 1,
            borderStyle: 'solid',
          },
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: designTokens.color.surfacePure,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: designTokens.color.outline,
            },
          },
          '&.Mui-focused': {
            backgroundColor: designTokens.color.surfacePure,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: designTokens.color.primaryContainer,
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
          backgroundColor: designTokens.color.surfacePure,
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: designTokens.color.textSecondary,
          minWidth: 'auto',
          padding: '6px 0',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            color: designTokens.color.primaryContainer,
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
          backgroundColor: designTokens.color.surfaceOffWhite,
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
          backgroundColor: designTokens.color.infoAccent,
        },
      },
    },

    // ── Menu / Paper for dropdowns ───────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: designTokens.radius.moderate,
          border: `1px solid ${designTokens.color.borderGray}`,
          boxShadow: designTokens.shadow.lifted,
        },
      },
    },

    // ── Divider ──────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: designTokens.color.borderGray,
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

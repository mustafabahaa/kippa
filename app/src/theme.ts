import { createTheme, alpha, type Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    chart: {
      colors: string[];
    };
  }
  interface PaletteOptions {
    chart?: {
      colors?: string[];
    };
  }
}

/**
 * Design tokens sourced from the Stitch "Workspace Productivity System"
 * design system (asset ID: d778924a54e1410caa5f4bc7d35e5bca).
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
    success: '#0f766e',
    warning: '#F9AB00',
    error:   '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',

    // Surfaces (light) – brightened toward white to reduce grey cast
    surface:               '#ffffff',
    surfaceBright:         '#ffffff',
    surfaceContainer:      '#fbfbfc',
    surfaceContainerHigh:  '#f7f7f9',
    surfaceContainerHighest:'#f2f2f4',
    surfaceContainerLow:   '#fdfdfe',
    surfaceContainerLowest:'#ffffff',
    surfaceDim:            '#f0f0f2',
    surfaceTint:           '#006a63',
    surfaceVariant:        '#f2f2f4',

    // Custom named surfaces (from Stitch designMd)
    surfacePure:    '#FFFFFF',
    surfaceOffWhite:'#f8f8fa',
    infoAccent:     '#E8F0FE',

    // On-surface / text hierarchy (light)
    onSurface:        '#131b2e',
    onSurfaceVariant: '#4a5160',
    textPrimary:      '#131b2e',
    textSecondary:    '#4a5160',
    textTertiary:     '#5f6675',
    disabled:         '#a0a6b0',

    // Borders & outlines (light)
    borderGray:     '#ecedf0',
    outline:        '#6e7977',
    outlineVariant: '#ecedf0',

    // Inverse
    inverseSurface:   '#283044',
    inverseOnSurface: '#eef0ff',
  },

  // ── Dark-mode surface/text/border overrides ──────────────────────────
  dark: {
    surface:               '#090a0f',  // deep rich navy-black
    surfacePure:           '#121420',  // rich navy-slate card surface
    surfaceOffWhite:       '#1a1d2d',
    surfaceContainerLow:   '#141725',
    surfaceContainer:      '#171a2a',
    surfaceContainerHigh:  '#1d2134',
    surfaceContainerHighest:'#24293f',
    infoAccent:            '#0c2122',

    textPrimary:    '#f1f0f5', // brighter white for high-end feel
    textSecondary:  '#c5c2cf', // brighter text secondary
    textTertiary:   '#9e9bb0', // brighter text tertiary
    disabled:       '#6a6b7d',

    borderGray:     '#23273a', // slate-navy border
    outline:        '#0f766e', // primary container teal outline
    outlineVariant: '#23273a',

    onSurface:        '#f1f0f5',
    onSurfaceVariant: '#c5c2cf',
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
      chart: {
        colors: [
          c.primaryContainer,
          c.secondary,
          c.tertiary,
          c.primaryFixedDim,
          c.tertiaryContainer,
          c.secondaryContainer,
          c.warning,
          c.error,
        ],
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
      MuiCssBaseline: {
        styleOverrides: `
          html {
            color-scheme: ${mode};
          }
          input, textarea, select {
            font-size: 16px !important;
          }
          .notistack-MuiContent-success {
            background-color: ${c.primaryContainer} !important;
          }
          .SnackbarItem-variantSuccess {
            background-color: ${c.primaryContainer} !important;
          }
        `,
      },
      // ── Paper & Dialog Backgrounds ──────────────────────────────────
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none !important',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: t.surfacePure,
            backgroundImage: 'none !important',
            borderRadius: '20px',
            border: `1px solid ${t.borderGray}`,
          },
        },
      },
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
            boxShadow: mode === 'dark'
              ? 'rgba(0, 0, 0, 0.4) 0px 4px 20px -2px'
              : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: mode === 'dark' ? 'primary.main' : t.outline,
              boxShadow: mode === 'dark'
                ? 'rgba(15, 118, 110, 0.15) 0px 12px 30px -4px, rgba(0, 0, 0, 0.5) 0px 8px 24px -4px'
                : 'rgba(0, 0, 0, 0.05) 0px 8px 24px 0px',
              transform: 'translateY(-2px)',
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
            fontSize: '16px',
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

      // ── Table ──────────────────────────────────────────────────────────
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '14px 16px',
            borderBottom: `1px solid ${t.borderGray}`,
          },
          // Override MUI's dense variant, which strips horizontal padding.
          // This key has higher specificity than `root`, so it's what the
          // `size="small"` tables actually use.
          sizeSmall: {
            padding: '10px 16px',
          },
          head: {
            fontWeight: 700,
            color: t.textPrimary,
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            // Keep tables within their card; never overflow horizontally
            tableLayout: 'auto',
            width: '100%',
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
            fontSize: '12.5px',
            fontWeight: 500,
            backgroundColor: 'rgba(33, 33, 33, 0.95)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '6px',
            boxShadow: '0px 4px 16px rgba(0,0,0,0.25)',
          },
          arrow: {
            color: 'rgba(33, 33, 33, 0.95)',
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

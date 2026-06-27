import { createTheme } from '@mui/material/styles';

export const designTokens = {
  color: {
    googleBlue: '#1A73E8',
    googleDarkBlue: '#1967D2',
    googleGreen: '#1E8E3E',
    googleAmber: '#F9AB00',
    hyperlinkBlue: '#0000EE',
    iconGray: '#5F6368',
    charcoal: '#202124',
    darkGray: '#3C4043',
    mediumGray: '#49454F',
    lightGray: '#79747E',
    offWhite: '#F1F3F4',
    borderGray: '#DADCE0',
    white: '#FFFFFF',
    paleBlue: '#E8F0FE',
    surfaceGray: '#E8EAED',
  },
};

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.color.googleBlue,
      dark: designTokens.color.googleDarkBlue,
      contrastText: designTokens.color.white,
    },
    success: {
      main: designTokens.color.googleGreen,
    },
    warning: {
      main: designTokens.color.googleAmber,
    },
    info: {
      main: designTokens.color.googleBlue,
      light: designTokens.color.paleBlue,
    },
    background: {
      default: designTokens.color.white,
      paper: designTokens.color.white,
    },
    text: {
      primary: designTokens.color.charcoal,
      secondary: designTokens.color.darkGray,
      disabled: designTokens.color.lightGray,
    },
    divider: designTokens.color.borderGray,
  },
  typography: {
    fontFamily: "'Google Sans Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontFamily: "'Google Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: '3.375rem',
      lineHeight: '4rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontFamily: "'Google Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: '2.5rem',
      lineHeight: '3.125rem',
      fontWeight: 500,
      letterSpacing: 0,
    },
    h3: {
      fontFamily: "'Google Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: 500,
      letterSpacing: 0,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: '1.375rem',
      letterSpacing: 0,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: '1.1875rem',
      fontWeight: 500,
      letterSpacing: 0,
    },
    button: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.833125rem',
      lineHeight: 'normal',
      fontWeight: 400,
      letterSpacing: 0,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: designTokens.color.white,
          borderBottom: `1px solid ${designTokens.color.borderGray}`,
          boxShadow: 'rgba(0, 0, 0, 0.12) 0px 2px 6px 0px, rgb(218, 220, 224) 0px -1px 0px 0px inset',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 48,
          padding: '12px 24px',
        },
        outlined: {
          borderColor: designTokens.color.borderGray,
          color: designTokens.color.charcoal,
          backgroundColor: '#F7F9FE',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 48,
          height: 48,
          color: designTokens.color.iconGray,
        },
      },
    },
  },
});


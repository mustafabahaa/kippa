import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import type { Theme } from '@mui/material/styles';

interface AppLoadingScreenProps {
  theme: Theme;
}

export function AppLoadingScreen({ theme }: AppLoadingScreenProps) {
  const logoSrc =
    theme.palette.mode === 'dark' ? '/icons/logo_white_transparent.png' : '/icons/logo_black_transparent.png';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box role="status" aria-label="Loading Kippa" className="splash-screen">
        <Box className="splash-content">
          <Box component="img" src={logoSrc} alt="Kippa" className="splash-logo" />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

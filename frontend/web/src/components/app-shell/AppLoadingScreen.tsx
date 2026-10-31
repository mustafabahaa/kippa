import { BrandLoadingScreen, CssBaseline, ThemeProvider } from '@monochrome-ui/design-system';
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
      <BrandLoadingScreen logoSrc={logoSrc} appName="Kippa" />
    </ThemeProvider>
  );
}

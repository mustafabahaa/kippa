import { Box } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { DotGridBackground } from '@/features/shared/components/DotGrid';

interface AppLoadingScreenProps {
  theme: Theme;
}

export function AppLoadingScreen({ theme }: AppLoadingScreenProps) {
  const logoSrc = theme.palette.mode === 'dark' ? '/icons/icon-dark.svg' : '/icons/icon.svg';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DotGridBackground />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'logoPulseFloat 2.5s infinite ease-in-out',
          }}
        >
          <img
            src={logoSrc}
            alt="Kippa Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>

        <style>{`
          @keyframes logoPulseFloat {
            0% { transform: scale(0.92) translateY(0px); opacity: 0.85; }
            50% { transform: scale(1.08) translateY(-6px); opacity: 1; }
            100% { transform: scale(0.92) translateY(0px); opacity: 0.85; }
          }
        `}</style>
      </Box>
    </ThemeProvider>
  );
}

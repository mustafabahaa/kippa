import { Box } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { ThemeProvider, CssBaseline } from '@mui/material';

interface AppLoadingScreenProps {
  theme: Theme;
}

export function AppLoadingScreen({ theme }: AppLoadingScreenProps) {
  const isDark = theme.palette.mode === 'dark';
  const logoSrc = isDark ? '/icons/icon-dark.svg' : '/icons/icon.svg';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark
            ? `radial-gradient(circle at center, ${theme.palette.primary.dark}33 0%, ${theme.palette.background.default} 100%)`
            : `radial-gradient(circle at center, ${theme.palette.primary.light}22 0%, ${theme.palette.background.default} 100%)`,
          transition: 'background 0.3s ease',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: isDark
                ? 'drop-shadow(0 0 25px rgba(15, 118, 110, 0.45))'
                : 'drop-shadow(0 0 20px rgba(15, 118, 110, 0.15))',
              animation:
                'splashLogoEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, logoPulseFloat 3s infinite ease-in-out 0.8s',
              opacity: 0,
              transform: 'scale(0.8)',
            }}
          >
            <img
              src={logoSrc}
              alt="Kippa Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>

          <Box
            sx={{
              marginTop: '24px',
              textAlign: 'center',
              opacity: 0,
              animation: 'splashFadeIn 0.8s ease-out 0.4s forwards',
            }}
          >
            <Box
              component="h1"
              sx={{
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '2px',
                margin: 0,
                textTransform: 'uppercase',
                color: theme.palette.text.primary,
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              }}
            >
              Kippa
            </Box>
            <Box
              component="p"
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '6px',
                marginBottom: 0,
                opacity: 0.7,
                fontStyle: 'italic',
                color: theme.palette.text.secondary,
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              }}
            >
              Private Household Finance
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: '60px',
            width: '120px',
            height: '3px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '4px',
            overflow: 'hidden',
            opacity: 0,
            animation: 'splashFadeIn 0.8s ease-out 0.6s forwards',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.palette.primary.main,
              transformOrigin: '0% 50%',
              animation: 'splashProgress 1.6s infinite ease-in-out',
            }}
          />
        </Box>

        <style>{`
          @keyframes splashLogoEntrance {
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes logoPulseFloat {
            0% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.04); }
            100% { transform: translateY(0px) scale(1); }
          }

          @keyframes splashFadeIn {
            to {
              opacity: 1;
            }
          }

          @keyframes splashProgress {
            0% { transform: translateX(-100%) scaleX(0.2); }
            50% { transform: translateX(0%) scaleX(0.5); }
            100% { transform: translateX(100%) scaleX(0.2); }
          }
        `}</style>
      </Box>
    </ThemeProvider>
  );
}


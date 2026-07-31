import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Aurora from '@/features/shared/components/AppBackground/Aurora';
import LightVeil from '@/features/shared/components/AppBackground/LightVeil';

/**
 * A soft atmospheric backdrop that keeps the app surface calm and readable.
 * The effect stays deliberately behind content: no graphic grid or hard lines.
 */
export default function AppBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!isDark) {
    return (
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.12,
        }}
      >
        <LightVeil
          colors={[
            alpha(theme.palette.primary.main, 0.34),
            alpha(theme.palette.secondary.main, 0.26),
            alpha(theme.palette.primary.light, 0.24),
          ]}
        />
      </Box>
    );
  }

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.12,
      }}
    >
      <Aurora
        colorStops={[
          theme.palette.primary.main,
          theme.palette.primary.light,
          theme.palette.secondary.main,
        ]}
        amplitude={0.8}
        blend={0.55}
        speed={0.55}
      />
    </Box>
  );
}

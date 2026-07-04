import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import DarkVeil from '@/features/shared/components/AppBackground/DarkVeil';
import LightVeil from '@/features/shared/components/AppBackground/LightVeil';

/**
 * Full-viewport, fixed-position animated backdrop.
 *
 * Uses two different renderers depending on theme mode:
 *  - dark:  DarkVeil CPPN shader — its dark, saturated output sits naturally
 *           on dark surfaces, reading as depth/ambient texture.
 *  - light: LightVeil — three soft, blurred teal gradient blobs. The CPPN's
 *           dark pixels desaturate to grey over white, so a CSS-only layer
 *           built from bright semi-transparent gradients reads as actual color
 *           on light surfaces.
 *
 * Sits behind all app content (z-index: 0). Content above must use position
 * context with z-index >= 1 (the App shell already wraps content in elevated
 * surfaces).
 */
export default function AppBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!isDark) {
    // Three teal tints — brighter than primary so they read on white.
    return (
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      >
        <LightVeil
          colors={[
            alpha('#0f766e', 0.32),
            alpha('#14b8a6', 0.26),
            alpha('#5eead4', 0.22),
          ]}
        />
      </Box>
    );
  }

  // ── Dark mode: DarkVeil CPPN shader ──────────────────────────────────
  // Tune the CPPN's palette onto our teal primary.
  // Empirically: hueShift=0 reads purple, -125 reads red. That means the
  // CPPN's dominant hue is ~125° (so -125 wraps it to 0°/red). To land on
  // teal (~175°) we rotate *positively* by ~50°: 125 + 50 = 175.
  // Bump this number to lean greener, lower it to lean bluer.
  const hueShift = 50;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.65,
      }}
    >
      <DarkVeil
        hueShift={hueShift}
        noiseIntensity={0}
        scanlineIntensity={0}
        speed={0.35}
        scanlineFrequency={0}
        warpAmount={0}
        // Must be 1: ogl's setSize writes the canvas CSS size in px, so any
        // scale < 1 shrinks the displayed canvas instead of just downscaling
        // the render buffer.
        resolutionScale={1}
      />
    </Box>
  );
}

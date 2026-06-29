import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DotGrid from './DotGrid';

/**
 * Full-viewport, fixed-position DotGrid backdrop.
 *
 * Sits behind all app content (z-index: 0). Colors are sourced from the active
 * theme palette so the dot grid adapts to light/dark mode:
 *   - baseColor:   a subtle outline variant (faint, low-contrast dots at rest)
 *   - activeColor: the teal primary — what dots shift toward on hover/click
 *
 * Content above it must use position context with z-index >= 1 (the App shell
 * already wraps content in elevated surfaces).
 */
export default function DotGridBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const baseColor = isDark ? '#3a3b42' : '#d8d9de';
  const activeColor = theme.palette.primary.main as string;

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
        // Fade the grid toward the edges so it reads as ambient texture, not a
        // flat fill. Keeps the top (under AppBar) slightly cleaner.
        opacity: isDark ? 0.5 : 0.35,
      }}
    >
      <DotGrid
        dotSize={5}
        gap={18}
        baseColor={baseColor}
        activeColor={activeColor}
        proximity={120}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
      />
    </Box>
  );
}

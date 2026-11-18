import { createMonochromeTheme } from '@monochrome-ui/design-system';
import { createTheme } from '@mui/material/styles';

export function createKippaTheme(mode: Parameters<typeof createMonochromeTheme>[0]) {
  return createTheme(createMonochromeTheme(mode), {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Keep the accessible button name and its dimensions while the shared spinner is rendered.
          '.MuiButton-root.MuiButton-loading, .MuiIconButton-root.MuiIconButton-loading': {
            color: 'transparent !important',
            '& > :not(.MuiButton-loadingWrapper, .MuiIconButton-loadingWrapper, .MuiTouchRipple-root)': {
              opacity: 0,
            },
          },
        },
      },
    },
  });
}

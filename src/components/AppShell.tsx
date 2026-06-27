import type { PropsWithChildren } from 'react';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar sx={{ gap: 1.5, minHeight: 64 }}>
          <AccountBalanceWalletOutlinedIcon color="primary" />
          <Typography variant="h3" component="p">
            Finance Ledger
          </Typography>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
  );
}


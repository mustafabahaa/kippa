import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';

import { AppProvider } from '@/contexts/AppContext';
import { ThemeModeProvider } from '@/hooks/ThemeModeProvider';
import { PrivacyModeProvider } from '@/hooks/PrivacyModeProvider';
import { installVitePreloadErrorHandler } from '@/libs/chunkRecovery';

// Recover once from stale-chunk preload failures before the app mounts.
installVitePreloadErrorHandler();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeModeProvider>
          <PrivacyModeProvider>
            <App />
          </PrivacyModeProvider>
        </ThemeModeProvider>
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

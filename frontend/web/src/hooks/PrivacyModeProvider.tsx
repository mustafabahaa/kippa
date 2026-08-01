import React, { useCallback, useState } from 'react';
import {
  PrivacyModeContext,
  readStoredPrivacyMode,
  storePrivacyMode,
} from '@/contexts/privacyModeContext';

/**
 * Provides the privacy mode state. When active, sensitive monetary values
 * rendered through `<Money>` / `useFormattedMoney()` are masked so the app
 * can be demoed without exposing real balances. Persists to localStorage.
 */
export function PrivacyModeProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyModeState] = useState<boolean>(() => readStoredPrivacyMode());

  const setPrivacyMode = useCallback((value: boolean) => {
    setPrivacyModeState(value);
    storePrivacyMode(value);
  }, []);

  const value = React.useMemo(
    () => ({ privacyMode, setPrivacyMode }),
    [privacyMode, setPrivacyMode]
  );

  return (
    <PrivacyModeContext.Provider value={value}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

import { useContext } from 'react';
import { PrivacyModeContext } from '@/contexts/privacyModeContext';

/**
 * Tracks the user's privacy mode preference. When enabled, monetary values
 * rendered via `<Money>` / `useFormattedMoney()` are masked (`CODE ••••`).
 * Persists to localStorage.
 */
export function usePrivacyMode() {
  const context = useContext(PrivacyModeContext);
  if (context === undefined) {
    throw new Error('usePrivacyMode must be used within a PrivacyModeProvider');
  }
  return context;
}

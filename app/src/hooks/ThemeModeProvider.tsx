import React, { useCallback, useEffect, useState } from 'react';
import {
  ThemeModeContext,
  storePref,
  readStoredPref,
  getSystemMode,
  type ThemeModePref,
  type ResolvedThemeMode,
} from '@/contexts/themeModeContext';

/**
 * Provides the theme mode state and update handlers. Wrap the root component
 * with this provider to share the same theme mode state across all components.
 */
export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [modePref, setModePrefState] = useState<ThemeModePref>(() => readStoredPref());
  const [systemMode, setSystemMode] = useState<ResolvedThemeMode>(() => getSystemMode());

  // React live to OS theme changes (affects `system` preference)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const setModePref = useCallback((pref: ThemeModePref) => {
    setModePrefState(pref);
    storePref(pref);
  }, []);

  const resolvedMode: ResolvedThemeMode = modePref === 'system' ? systemMode : modePref;

  const value = React.useMemo(
    () => ({ modePref, resolvedMode, setModePref }),
    [modePref, resolvedMode, setModePref]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

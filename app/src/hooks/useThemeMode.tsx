import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

export type ThemeModePref = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

interface ThemeModeContextType {
  modePref: ThemeModePref;
  resolvedMode: ResolvedThemeMode;
  setModePref: (pref: ThemeModePref) => void;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

const STORAGE_KEY = 'finance_theme_mode';

function isPref(value: unknown): value is ThemeModePref {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getSystemMode(): ResolvedThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredPref(): ThemeModePref {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isPref(stored)) return stored;
  } catch {
    /* ignore (private mode, etc.) */
  }
  return 'system';
}

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
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* ignore */
    }
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

/**
 * Tracks the user's theme preference (`light` | `dark` | `system`),
 * persists it to localStorage, and resolves the effective palette mode
 * to apply. When the preference is `system`, the resolved mode follows
 * the OS `prefers-color-scheme` and updates live when the OS changes.
 */
export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}


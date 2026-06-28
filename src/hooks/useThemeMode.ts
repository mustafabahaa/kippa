import { useCallback, useEffect, useState } from 'react';

export type ThemeModePref = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

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
 * Tracks the user's theme preference (`light` | `dark` | `system`),
 * persists it to localStorage, and resolves the effective palette mode
 * to apply. When the preference is `system`, the resolved mode follows
 * the OS `prefers-color-scheme` and updates live when the OS changes.
 */
export function useThemeMode() {
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

  return { modePref, resolvedMode, setModePref };
}

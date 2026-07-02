import { createContext } from 'react';

export type ThemeModePref = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

export interface ThemeModeContextType {
  modePref: ThemeModePref;
  resolvedMode: ResolvedThemeMode;
  setModePref: (pref: ThemeModePref) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

const STORAGE_KEY = 'finance_theme_mode';

export function isPref(value: unknown): value is ThemeModePref {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getSystemMode(): ResolvedThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readStoredPref(): ThemeModePref {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isPref(stored)) return stored;
  } catch {
    /* ignore (private mode, etc.) */
  }
  return 'system';
}

export function storePref(pref: ThemeModePref): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
}

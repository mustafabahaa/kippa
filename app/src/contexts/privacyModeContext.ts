import { createContext } from 'react';

export interface PrivacyModeContextType {
  privacyMode: boolean;
  setPrivacyMode: (value: boolean) => void;
}

export const PrivacyModeContext = createContext<PrivacyModeContextType | undefined>(undefined);

const STORAGE_KEY = 'finance_privacy_mode';

export function readStoredPrivacyMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    /* ignore (private mode, etc.) */
  }
  return false;
}

export function storePrivacyMode(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* ignore */
  }
}

import { useContext } from 'react';
import { ThemeModeContext } from '@/contexts/themeModeContext';

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

import { describe, it, expect, vi } from 'vitest';
import { shouldShowOfflineToast, notifyOfflineAwareSuccess } from './offlineToast';

describe('shouldShowOfflineToast', () => {
  it('returns false when online', () => {
    expect(shouldShowOfflineToast(true)).toBe(false);
  });

  it('returns true when offline', () => {
    expect(shouldShowOfflineToast(false)).toBe(true);
  });
});

describe('notifyOfflineAwareSuccess', () => {
  it('shows the "will sync" toast when offline', () => {
    const enqueue = vi.fn();
    notifyOfflineAwareSuccess({ isOnline: false, enqueue });
    expect(enqueue).toHaveBeenCalledWith(
      expect.stringContaining('sync'),
      expect.objectContaining({ variant: 'info' })
    );
  });

  it('does not toast when online', () => {
    const enqueue = vi.fn();
    notifyOfflineAwareSuccess({ isOnline: true, enqueue });
    expect(enqueue).not.toHaveBeenCalled();
  });
});

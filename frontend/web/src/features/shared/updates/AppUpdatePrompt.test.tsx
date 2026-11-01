// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pwaRegisterStub } from '@/test-stubs/virtual-pwa-register';
import { AppUpdatePrompt } from './AppUpdatePrompt';

function renderPrompt() {
  return render(
    <SnackbarProvider>
      <AppUpdatePrompt />
    </SnackbarProvider>,
  );
}

describe('AppUpdatePrompt', () => {
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    pwaRegisterStub.reset();
    reloadSpy = vi.fn();
    vi.stubGlobal('location', { reload: reloadSpy });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows a prompt when a new build is waiting and only reloads on user action', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderPrompt();

    expect(pwaRegisterStub.onNeedRefresh).toBeTypeOf('function');
    pwaRegisterStub.onNeedRefresh!();

    expect(await screen.findByText('A new version of Kippa is available.')).toBeTruthy();
    // A waiting build alone must never interrupt the session.
    expect(pwaRegisterStub.updateCalls).toEqual([]);
    expect(reloadSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(pwaRegisterStub.updateCalls).toEqual([true]));
    consoleSpy.mockRestore();
  });

  it('keeps the running session untouched when the user chooses Later', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderPrompt();

    pwaRegisterStub.onNeedRefresh!();
    fireEvent.click(await screen.findByRole('button', { name: 'Later' }));

    await waitFor(() => expect(screen.queryByText('A new version of Kippa is available.')).toBeNull());
    expect(pwaRegisterStub.updateCalls).toEqual([]);
    expect(reloadSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

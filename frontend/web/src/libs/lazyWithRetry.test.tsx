// @vitest-environment jsdom
import { Component, Suspense, type ComponentType, type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lazyWithRetry } from './lazyWithRetry';

const CHUNK_ERROR = new Error('Failed to fetch dynamically imported module: /assets/old.js');
const APP_ERROR = new Error('Cannot read properties of undefined');

class CaptureBoundary extends Component<{ children: ReactNode; caught: unknown[] }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.caught.push(error);
  }

  render() {
    return this.state.hasError ? <p>error</p> : this.props.children;
  }
}

function renderLazy(factory: () => Promise<{ default: ComponentType }>, caught: unknown[] = []) {
  const Lazy = lazyWithRetry(factory);
  return render(
    <CaptureBoundary caught={caught}>
      <Suspense fallback={<p>loading</p>}>
        <Lazy />
      </Suspense>
    </CaptureBoundary>,
  );
}

describe('lazyWithRetry stale-chunk recovery', () => {
  let reloadSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    reloadSpy = vi.fn();
    vi.stubGlobal('location', { reload: reloadSpy });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reloads once for a chunk load error', async () => {
    renderLazy(() => Promise.reject(CHUNK_ERROR));

    await waitFor(() => expect(reloadSpy).toHaveBeenCalledOnce());
    expect(sessionStorage.getItem('kippa-chunk-reloaded')).toBe('true');
  });

  it('does not reload again when the flag is already set', async () => {
    sessionStorage.setItem('kippa-chunk-reloaded', 'true');
    const caught: unknown[] = [];
    renderLazy(() => Promise.reject(CHUNK_ERROR), caught);

    await waitFor(() => expect(caught).toEqual([CHUNK_ERROR]));
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('rethrows non-chunk errors to the error boundary without reloading', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const caught: unknown[] = [];
    renderLazy(() => Promise.reject(APP_ERROR), caught);

    await waitFor(() => expect(caught).toEqual([APP_ERROR]));
    expect(reloadSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('clears the reload flag after a successful import', async () => {
    sessionStorage.setItem('kippa-chunk-reloaded', 'true');
    const Loaded = () => <p>loaded</p>;
    renderLazy(() => Promise.resolve({ default: Loaded }));

    await waitFor(() => expect(document.querySelector('p')?.textContent).toBe('loaded'));
    expect(sessionStorage.getItem('kippa-chunk-reloaded')).toBeNull();
  });
});

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// ── localStorage mock ─────────────────────────────────────────────────
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  });
});

// ── Notification API mock ────────────────────────────────────────────
class MockNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
  constructor(public title: string, public options?: NotificationOptions) {}
}
vi.stubGlobal('Notification', MockNotification);

// ── Service worker mock ──────────────────────────────────────────────
Object.defineProperty(globalThis.navigator, 'serviceWorker', {
  value: {
    controller: null,
    register: vi.fn(async () => ({})),
    ready: Promise.resolve({ showNotification: vi.fn() }),
  },
  writable: true,
  configurable: true,
});

// ── matchMedia mock (some lib code may use it) ───────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query,
    onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/services/firebase', () => ({
  loginWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

import authReducer, {
  loginThunk, signupThunk, googleLoginThunk, logoutThunk,
  setUser, clearError,
} from './authSlice';
import { loginWithEmail, signUpWithEmail, loginWithGoogle, logout } from '@/services/firebase';

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authSlice — synchronous reducers', () => {
  it('initial state', () => {
    const s = makeStore().getState().auth;
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
    expect(s.initializing).toBe(true);
  });

  it('setUser(user) sets isAuthenticated and stops initializing', () => {
    const store = makeStore();
    const fakeUser = { uid: '1', email: 'a@b.com', displayName: 'A', photoURL: null };
    store.dispatch(setUser(fakeUser));
    const s = store.getState().auth;
    expect(s.user).toEqual(fakeUser);
    expect(s.isAuthenticated).toBe(true);
    expect(s.initializing).toBe(false);
  });

  it('setUser(null) clears auth', () => {
    const store = makeStore();
    store.dispatch(setUser({ uid: 'x', email: null, displayName: null, photoURL: null }));
    store.dispatch(setUser(null));
    const s = store.getState().auth;
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it('clearError nukes the error string', () => {
    const store = makeStore();
    // synthesise an error via a rejected thunk
    (loginWithEmail as any).mockRejectedValueOnce(new Error('auth/invalid-credential'));
    return store.dispatch(loginThunk({ email: 'a@b.com', password: 'short' })).then(() => {
      expect(store.getState().auth.error).toBeTruthy();
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });
});

describe('authSlice — loginThunk', () => {
  it('fulfilled: sets user, marks authenticated, persists visited flag', async () => {
    (loginWithEmail as any).mockResolvedValueOnce({
      uid: '42', email: 'doc@hospital.com', displayName: 'Doc Strange', photoURL: null,
    });
    const store = makeStore();
    await store.dispatch(loginThunk({ email: 'doc@hospital.com', password: 'pw1234' }));
    const s = store.getState().auth;
    expect(s.user?.uid).toBe('42');
    expect(s.isAuthenticated).toBe(true);
    expect(s.loading).toBe(false);
    expect(localStorage.getItem('medicore_visited')).toBe('1');
  });

  it('falls back displayName to email-prefix when missing', async () => {
    (loginWithEmail as any).mockResolvedValueOnce({
      uid: '7', email: 'sara@x.com', displayName: null, photoURL: null,
    });
    const store = makeStore();
    await store.dispatch(loginThunk({ email: 'sara@x.com', password: 'pw' }));
    expect(store.getState().auth.user?.displayName).toBe('sara');
  });

  it('rejected: parses Firebase error and stores friendly message', async () => {
    (loginWithEmail as any).mockRejectedValueOnce(new Error('auth/wrong-password'));
    const store = makeStore();
    await store.dispatch(loginThunk({ email: 'a@b.com', password: 'wrong' }));
    expect(store.getState().auth.error).toBe('Incorrect password. Please try again.');
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('rejected: maps too-many-requests', async () => {
    (loginWithEmail as any).mockRejectedValueOnce(new Error('auth/too-many-requests'));
    const store = makeStore();
    await store.dispatch(loginThunk({ email: 'a@b.com', password: 'pw' }));
    expect(store.getState().auth.error).toContain('Too many attempts');
  });
});

describe('authSlice — signupThunk', () => {
  it('fulfilled: signs the user up and authenticates', async () => {
    (signUpWithEmail as any).mockResolvedValueOnce({
      uid: 'new-1', email: 'newdoc@x.com', displayName: 'New Doc', photoURL: null,
    });
    const store = makeStore();
    await store.dispatch(signupThunk({ email: 'newdoc@x.com', password: 'longpw', displayName: 'New Doc' }));
    expect(store.getState().auth.user?.email).toBe('newdoc@x.com');
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it('rejected: maps email-already-in-use', async () => {
    (signUpWithEmail as any).mockRejectedValueOnce(new Error('auth/email-already-in-use'));
    const store = makeStore();
    await store.dispatch(signupThunk({ email: 'used@x.com', password: 'pw', displayName: 'D' }));
    expect(store.getState().auth.error).toBe('An account with this email already exists.');
  });
});

describe('authSlice — googleLoginThunk', () => {
  it('fulfilled: signs in via Google and authenticates', async () => {
    (loginWithGoogle as any).mockResolvedValueOnce({
      uid: 'g-1', email: 'g@x.com', displayName: 'G User', photoURL: 'https://x/y',
    });
    const store = makeStore();
    await store.dispatch(googleLoginThunk());
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user?.email).toBe('g@x.com');
  });

  it('rejected: popup-closed-by-user yields a "cancelled" message', async () => {
    (loginWithGoogle as any).mockRejectedValueOnce(new Error('auth/popup-closed-by-user'));
    const store = makeStore();
    await store.dispatch(googleLoginThunk());
    expect(store.getState().auth.error).toBe('Sign-in cancelled.');
  });

  it('rejected: popup-blocked surfaces an actionable hint', async () => {
    (loginWithGoogle as any).mockRejectedValueOnce(new Error('auth/popup-blocked'));
    const store = makeStore();
    await store.dispatch(googleLoginThunk());
    expect(store.getState().auth.error).toMatch(/Popup blocked/);
  });
});

describe('authSlice — logoutThunk', () => {
  it('fulfilled: clears user and isAuthenticated', async () => {
    (logout as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    store.dispatch(setUser({ uid: 'x', email: 'a@b.com', displayName: null, photoURL: null }));
    expect(store.getState().auth.isAuthenticated).toBe(true);
    await store.dispatch(logoutThunk());
    const s = store.getState().auth;
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });
});

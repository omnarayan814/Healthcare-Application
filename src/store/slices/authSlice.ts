import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { loginWithEmail, signUpWithEmail, loginWithGoogle, logout } from '@/services/firebase';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initializing: true,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const fbUser = await loginWithEmail(email, password);
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Doctor',
        photoURL: fbUser.photoURL,
      } as User;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return rejectWithValue(parseFirebaseError(message));
    }
  }
);

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async (
    { email, password, displayName }: { email: string; password: string; displayName: string },
    { rejectWithValue }
  ) => {
    try {
      const fbUser = await signUpWithEmail(email, password, displayName);
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName ?? displayName,
        photoURL: fbUser.photoURL,
      } as User;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      return rejectWithValue(parseFirebaseError(message));
    }
  }
);

export const googleLoginThunk = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    try {
      const fbUser = await loginWithGoogle();
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Doctor',
        photoURL: fbUser.photoURL,
      } as User;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      if (message.includes('popup-closed-by-user') || message.includes('cancelled-popup-request')) {
        return rejectWithValue('Sign-in cancelled.');
      }
      if (message.includes('popup-blocked')) {
        return rejectWithValue('Popup blocked — please allow popups for this site.');
      }
      return rejectWithValue('Could not sign in with Google. Please try again.');
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try { await logout(); } catch { /* demo mode — no Firebase session */ }
});

function parseFirebaseError(msg: string): string {
  if (msg.includes('user-not-found')) return 'No account found with this email.';
  if (msg.includes('wrong-password')) return 'Incorrect password. Please try again.';
  if (msg.includes('invalid-email')) return 'Please enter a valid email address.';
  if (msg.includes('too-many-requests')) return 'Too many attempts. Please try later.';
  if (msg.includes('invalid-credential')) return 'Invalid credentials. Check your email and password.';
  if (msg.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (msg.includes('weak-password')) return 'Password must be at least 6 characters.';
  return 'Authentication failed. Please try again.';
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.initializing = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('medicore_visited', '1');
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('medicore_visited', '1');
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(googleLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('medicore_visited', '1');
      })
      .addCase(googleLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;

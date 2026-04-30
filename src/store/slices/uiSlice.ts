import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  activeRoute: string;
  theme: Theme;
  notificationsEnabled: boolean;
}

const THEME_KEY = 'medicore_theme';
const NOTIFS_KEY = 'medicore_notifications_enabled';

function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'light' ? 'light' : 'dark';
}
function loadNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(NOTIFS_KEY);
  return saved === null ? true : saved === '1';
}

const initialState: UIState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeRoute: '/Dashboard',
  theme: loadTheme(),
  notificationsEnabled: loadNotificationsEnabled(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
    setActiveRoute(state, action: PayloadAction<string>) {
      state.activeRoute = action.payload;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      try { localStorage.setItem(THEME_KEY, action.payload); } catch { /* ignore */ }
    },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
      try { localStorage.setItem(NOTIFS_KEY, action.payload ? '1' : '0'); } catch { /* ignore */ }
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setActiveRoute,
  setTheme,
  setNotificationsEnabled,
} = uiSlice.actions;
export default uiSlice.reducer;

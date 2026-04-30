import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer, {
  toggleSidebar, setSidebarCollapsed,
  toggleMobileSidebar, setMobileSidebarOpen,
  setActiveRoute, setTheme, setNotificationsEnabled,
} from './uiSlice';

function makeStore() {
  return configureStore({ reducer: { ui: uiReducer } });
}

beforeEach(() => { localStorage.clear(); });

describe('uiSlice', () => {
  describe('initial state', () => {
    it('defaults to dark theme + notifications enabled when no localStorage', () => {
      const s = makeStore().getState().ui;
      expect(s.theme).toBe('dark');
      expect(s.notificationsEnabled).toBe(true);
      expect(s.sidebarCollapsed).toBe(false);
      expect(s.activeRoute).toBe('/Dashboard');
    });
  });

  describe('sidebar', () => {
    it('toggleSidebar flips collapsed', () => {
      const store = makeStore();
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarCollapsed).toBe(true);
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarCollapsed).toBe(false);
    });

    it('setSidebarCollapsed sets explicitly', () => {
      const store = makeStore();
      store.dispatch(setSidebarCollapsed(true));
      expect(store.getState().ui.sidebarCollapsed).toBe(true);
    });

    it('mobile sidebar toggle + explicit setter', () => {
      const store = makeStore();
      expect(store.getState().ui.mobileSidebarOpen).toBe(false);
      store.dispatch(toggleMobileSidebar());
      expect(store.getState().ui.mobileSidebarOpen).toBe(true);
      store.dispatch(setMobileSidebarOpen(false));
      expect(store.getState().ui.mobileSidebarOpen).toBe(false);
    });
  });

  describe('setActiveRoute', () => {
    it('updates the active route', () => {
      const store = makeStore();
      store.dispatch(setActiveRoute('/Patients'));
      expect(store.getState().ui.activeRoute).toBe('/Patients');
    });
  });

  describe('theme', () => {
    it('setTheme persists to localStorage', () => {
      const store = makeStore();
      store.dispatch(setTheme('light'));
      expect(store.getState().ui.theme).toBe('light');
      expect(localStorage.getItem('medicore_theme')).toBe('light');
    });

    it('setTheme back to dark', () => {
      const store = makeStore();
      store.dispatch(setTheme('light'));
      store.dispatch(setTheme('dark'));
      expect(store.getState().ui.theme).toBe('dark');
      expect(localStorage.getItem('medicore_theme')).toBe('dark');
    });
  });

  describe('notifications toggle', () => {
    it('setNotificationsEnabled persists 0/1', () => {
      const store = makeStore();
      store.dispatch(setNotificationsEnabled(false));
      expect(store.getState().ui.notificationsEnabled).toBe(false);
      expect(localStorage.getItem('medicore_notifications_enabled')).toBe('0');

      store.dispatch(setNotificationsEnabled(true));
      expect(store.getState().ui.notificationsEnabled).toBe(true);
      expect(localStorage.getItem('medicore_notifications_enabled')).toBe('1');
    });
  });
});

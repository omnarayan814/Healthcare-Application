import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/utils/mockData';

interface NotificationState {
  notifications: Notification[];
  panelOpen: boolean;
}

const initialState: NotificationState = {
  notifications: MOCK_NOTIFICATIONS,
  panelOpen: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) {
      const notif: Notification = {
        ...action.payload,
        id: `N${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.notifications.unshift(notif);
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find(n => n.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead(state) {
      state.notifications.forEach(n => { n.read = true; });
    },
    togglePanel(state) {
      state.panelOpen = !state.panelOpen;
    },
    closePanel(state) {
      state.panelOpen = false;
    },
  },
});

export const { addNotification, markRead, markAllRead, togglePanel, closePanel } = notificationSlice.actions;
export default notificationSlice.reducer;

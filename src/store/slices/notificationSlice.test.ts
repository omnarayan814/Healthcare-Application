import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer, {
  addNotification, markRead, markAllRead, togglePanel, closePanel,
} from './notificationSlice';

function makeStore() {
  return configureStore({ reducer: { notifications: notificationReducer } });
}

let store: ReturnType<typeof makeStore>;
beforeEach(() => { store = makeStore(); });

describe('notificationSlice', () => {
  it('addNotification: prepends a new notification with generated id, timestamp, unread', () => {
    const before = store.getState().notifications.notifications.length;
    store.dispatch(addNotification({ title: 'Hi', message: 'World', type: 'info' }));
    const notifs = store.getState().notifications.notifications;
    expect(notifs.length).toBe(before + 1);
    expect(notifs[0].title).toBe('Hi');
    expect(notifs[0].message).toBe('World');
    expect(notifs[0].read).toBe(false);
    expect(notifs[0].id).toMatch(/^N\d+/);
    expect(notifs[0].timestamp).toBeTruthy();
  });

  it('markRead: marks just one as read', () => {
    store.dispatch(addNotification({ title: 'A', message: 'a', type: 'info' }));
    const id = store.getState().notifications.notifications[0].id;
    store.dispatch(markRead(id));
    expect(store.getState().notifications.notifications.find(n => n.id === id)?.read).toBe(true);
  });

  it('markAllRead: marks every notification as read', () => {
    store.dispatch(addNotification({ title: 'A', message: 'a', type: 'info' }));
    store.dispatch(addNotification({ title: 'B', message: 'b', type: 'info' }));
    store.dispatch(markAllRead());
    expect(store.getState().notifications.notifications.every(n => n.read)).toBe(true);
  });

  it('togglePanel & closePanel', () => {
    expect(store.getState().notifications.panelOpen).toBe(false);
    store.dispatch(togglePanel());
    expect(store.getState().notifications.panelOpen).toBe(true);
    store.dispatch(closePanel());
    expect(store.getState().notifications.panelOpen).toBe(false);
  });
});

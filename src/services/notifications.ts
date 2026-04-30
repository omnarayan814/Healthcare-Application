export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export function showLocalNotification(title: string, body: string, icon = '/favicon.svg'): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Prefer SW-backed notification (shows even when tab is backgrounded)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then(reg =>
        reg.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: `medicore-${Date.now()}`,
          data: { url: '/' },
        } as NotificationOptions),
      )
      .catch(() => new Notification(title, { body, icon }));
  } else {
    // Fallback to regular Notification API
    new Notification(title, { body, icon });
  }
}

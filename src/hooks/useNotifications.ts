import { useEffect } from 'react';
import { registerServiceWorker, requestNotificationPermission } from '@/services/notifications';

export function useNotificationSetup() {
  useEffect(() => {
    requestNotificationPermission().then(perm => {
      if (perm === 'granted') {
        registerServiceWorker();
      }
    });
  }, []);
}

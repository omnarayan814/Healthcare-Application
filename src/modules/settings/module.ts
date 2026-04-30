import { lazy } from 'react';
import type { MicroModule } from '@/core/types';

const SettingsModule: MicroModule = {
  id: 'settings',
  name: 'Settings',
  version: '1.0.0',
  description: 'User profile, notifications, display and security preferences.',
  routes: [
    {
      path: '/Settings',
      component: lazy(() => import('@/features/settings/SettingsPage')),
    },
  ],
  initialize() {
    if (import.meta.env.DEV) {
      console.debug('[SettingsModule] initialized');
    }
  },
};

export default SettingsModule;

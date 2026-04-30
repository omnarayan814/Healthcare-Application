import { lazy } from 'react';
import type { MicroModule } from '@/core/types';

const AnalyticsModule: MicroModule = {
  id: 'analytics',
  name: 'Analytics',
  version: '1.0.0',
  description: 'Hospital performance metrics, charts, and diagnosis distribution.',
  routes: [
    {
      path: '/Analytics',
      component: lazy(() => import('@/features/analytics/AnalyticsPage')),
    },
  ],
  initialize() {
    if (import.meta.env.DEV) {
      console.debug('[AnalyticsModule] initialized');
    }
  },
};

export default AnalyticsModule;

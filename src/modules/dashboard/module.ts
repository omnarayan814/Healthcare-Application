import { lazy } from 'react';
import type { MicroModule } from '@/core/types';

const DashboardModule: MicroModule = {
  id: 'dashboard',
  name: 'Dashboard',
  version: '1.0.0',
  description: 'Hospital overview with KPIs, admissions chart, and critical alerts panel.',
  routes: [
    {
      path: '/Dashboard',
      component: lazy(() => import('@/features/dashboard/DashboardPage')),
    },
  ],
  initialize() {
    if (import.meta.env.DEV) {
      console.debug('[DashboardModule] initialized');
    }
  },
};

export default DashboardModule;

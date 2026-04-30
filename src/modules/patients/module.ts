import { lazy } from 'react';
import type { MicroModule } from '@/core/types';

const PatientsModule: MicroModule = {
  id: 'patients',
  name: 'Patient Management',
  version: '1.0.0',
  description: 'Patient records with grid/list views, filters, and detail modals.',
  routes: [
    {
      path: '/Patients',
      component: lazy(() => import('@/features/patients/PatientsPage')),
    },
  ],
  initialize() {
    if (import.meta.env.DEV) {
      console.debug('[PatientsModule] initialized');
    }
  },
};

export default PatientsModule;

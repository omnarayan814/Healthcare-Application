import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { useAuthListener } from '@/hooks/useAuth';
import { useNotificationSetup } from '@/hooks/useNotifications';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPatients, mergeFirestorePatients } from '@/store/slices/patientSlice';
import { subscribeToFirestorePatients } from '@/services/patientService';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/features/auth/LoginPage';
import SignUpPage from '@/features/auth/SignUpPage';
import AuthEntryRedirect from '@/features/auth/AuthEntryRedirect';
import { moduleRegistry } from '@/core/moduleRegistry';

// ── Register micro-modules ─────────────────────────────────────────────────
import DashboardModule from '@/modules/dashboard/module';
import AnalyticsModule from '@/modules/analytics/module';
import PatientsModule  from '@/modules/patients/module';
import SettingsModule  from '@/modules/settings/module';

moduleRegistry.register(DashboardModule);
moduleRegistry.register(AnalyticsModule);
moduleRegistry.register(PatientsModule);
moduleRegistry.register(SettingsModule);
// ──────────────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

export default function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(s => s.ui.theme);
  useAuthListener();
  useNotificationSetup();

  // Apply theme to <html> so CSS variables flip across the entire site
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    moduleRegistry.initializeAll().catch(console.error);
    dispatch(fetchPatients());

    // Live-sync any patients added via the "Add Patient" feature (Firestore)
    const unsub = subscribeToFirestorePatients(
      patients => dispatch(mergeFirestorePatients(patients)),
      err => console.warn('[Firestore patients] listener error:', err.message),
    );
    return () => unsub();
  }, [dispatch]);

  const routes = moduleRegistry.getAllRoutes();

  return (
    <BrowserRouter>
      <Routes>
        {/* Smart entry: routes new visitors to /signup, returning to /login, authed to /dashboard */}
        <Route path="/" element={<AuthEntryRedirect />} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/Signup" element={<SignUpPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dynamically registered module routes */}
          {routes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Suspense fallback={<PageLoader />}>
                  <Component />
                </Suspense>
              }
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

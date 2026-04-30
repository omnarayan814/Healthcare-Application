import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/store';

/**
 * Smart entry redirect:
 *  - While Firebase is restoring the session → spinner.
 *  - If session is restored → /dashboard.
 *  - If returning visitor (has signed in/up before on this device) → /login.
 *  - If completely new visitor → /signup.
 */
export default function AuthEntryRedirect() {
  const { isAuthenticated, initializing } = useAppSelector(s => s.auth);

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/Dashboard" replace />;

  const hasVisited = typeof window !== 'undefined' && localStorage.getItem('medicore_visited') === '1';
  return <Navigate to={hasVisited ? '/Login' : '/Signup'} replace />;
}

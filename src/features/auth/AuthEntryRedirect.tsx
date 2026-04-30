import './styles/AuthEntryRedirect.css';
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
      <div className="auth-entry-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          className="auth-entry-spinner"
        />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/Dashboard" replace />;

  const hasVisited = typeof window !== 'undefined' && localStorage.getItem('medicore_visited') === '1';
  return <Navigate to={hasVisited ? '/Login' : '/Signup'} replace />;
}

import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppSelector } from '@/store';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/Dashboard': { title: 'Dashboard',          subtitle: "Here's what's happening today" },
  '/Patients':  { title: 'Patient Management', subtitle: 'View and manage all patient records' },
  '/Analytics': { title: 'Analytics',          subtitle: 'Hospital performance metrics and insights' },
  '/Settings':  { title: 'Settings',           subtitle: 'Configure your workspace preferences' },
};

export default function AppLayout() {
  const location = useLocation();
  const collapsed = useAppSelector(s => s.ui.sidebarCollapsed);
  const { isMobile } = useBreakpoint();
  const sidebarWidth = isMobile ? 0 : (collapsed ? 72 : 260);
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'MediCore', subtitle: '' };

  return (
    <div className="main-layout">
      <Sidebar />

      <div
        className="main-content"
        style={{ marginLeft: sidebarWidth }}
      >
        <Topbar title={meta.title} subtitle={meta.subtitle} />

        <main className="main-page">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

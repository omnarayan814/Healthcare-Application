import './styles/Sidebar.css';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BarChart3, Settings,
  ChevronLeft, Activity, Shield, LogOut,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar, setMobileSidebarOpen } from '@/store/slices/uiSlice';
import { logoutThunk } from '@/store/slices/authSlice';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const NAV_ITEMS = [
  { to: '/Dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#6366f1' },
  { to: '/Patients',  icon: Users,           label: 'Patients',  color: '#22d3ee' },
  { to: '/Analytics', icon: BarChart3,        label: 'Analytics', color: '#10b981' },
  { to: '/Settings',  icon: Settings,         label: 'Settings',  color: '#f59e0b' },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(s => s.ui.sidebarCollapsed);
  const mobileSidebarOpen = useAppSelector(s => s.ui.mobileSidebarOpen);
  const user = useAppSelector(s => s.auth.user);
  const location = useLocation();
  const { isMobile } = useBreakpoint();

  const effectiveCollapsed = isMobile ? false : collapsed;
  const width = effectiveCollapsed ? 72 : 260;

  const handleNavClick = () => {
    if (isMobile) dispatch(setMobileSidebarOpen(false));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          className={`sidebar-backdrop ${mobileSidebarOpen ? 'open' : ''}`}
          onClick={() => dispatch(setMobileSidebarOpen(false))}
        />
      )}

      <motion.aside
        animate={{
          width: isMobile ? 260 : width,
          x: isMobile && !mobileSidebarOpen ? -280 : 0,
        }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        className="sidebar-aside"
        style={{
          width: isMobile ? 260 : width,
          minWidth: isMobile ? 260 : width,
          boxShadow: isMobile && mobileSidebarOpen ? '4px 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Subtle vertical glow streak */}
        <div className="sidebar-glow" />

        {/* Logo */}
        <div className="sidebar-logo-header" style={{ padding: effectiveCollapsed ? '0 17px' : '0 20px' }}>
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            animate={{ boxShadow: ['0 0 16px rgba(99,102,241,0.3)', '0 0 32px rgba(99,102,241,0.55)', '0 0 16px rgba(99,102,241,0.3)'] }}
            transition={{ boxShadow: { duration: 2.5, repeat: Infinity }, scale: { duration: 0.2 } }}
            className="sidebar-logo-mark"
          >
            <Activity size={18} color="white" />
          </motion.div>

          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="sidebar-logo-name">MediCore</div>
                <div className="sidebar-logo-tag">Healthcare AI</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="sidebar-nav-section-label"
              >
                Navigation
              </motion.div>
            )}
          </AnimatePresence>

          {NAV_ITEMS.map(({ to, icon: Icon, label, color }) => {
            const active = location.pathname === to;
            return (
              <NavLink key={to} to={to} title={effectiveCollapsed ? label : undefined} style={{ textDecoration: 'none' }} onClick={handleNavClick}>
                <motion.div
                  className={`nav-item ${active ? 'active' : ''}`}
                  whileHover={{ x: active ? 0 : 3 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ justifyContent: effectiveCollapsed ? 'center' : 'flex-start', padding: effectiveCollapsed ? '11px' : '10px 14px' }}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-glow"
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 10,
                        background: `radial-gradient(ellipse at left, ${color}20 0%, transparent 70%)`,
                        pointerEvents: 'none',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <motion.div
                    animate={{ color: active ? color : '#64748b', scale: active ? 1.1 : 1 }}
                    whileHover={{ scale: 1.15, rotate: active ? 0 : 5 }}
                    transition={{ duration: 0.2 }}
                    className="sidebar-nav-icon"
                  >
                    <Icon size={18} />
                  </motion.div>
                  <AnimatePresence>
                    {!effectiveCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="sidebar-nav-label"
                        style={{ fontWeight: active ? 600 : 500 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {active && effectiveCollapsed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="sidebar-user-card"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="sidebar-user-avatar"
                >
                  {user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'A'}
                </motion.div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">
                    {user?.displayName ?? 'Admin'}
                  </div>
                  <div className="sidebar-user-email">
                    {user?.email}
                  </div>
                </div>
                <Shield size={13} color="#334155" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => dispatch(logoutThunk())}
            className="logout-btn"
            style={{
              justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
              padding: effectiveCollapsed ? '11px' : '10px 14px',
            }}
          >
            <LogOut size={16} />
            <AnimatePresence>
              {!effectiveCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <motion.button
              whileHover={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.25)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleSidebar())}
              className="sidebar-collapse-btn"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
                <ChevronLeft size={15} />
              </motion.div>
            </motion.button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

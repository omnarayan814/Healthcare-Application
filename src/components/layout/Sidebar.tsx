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
        style={{
          width: isMobile ? 260 : width,
          minWidth: isMobile ? 260 : width,
          height: '100vh',
          position: 'fixed', left: 0, top: 0,
          zIndex: 50,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #0c0c1e 0%, #080815 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          boxShadow: isMobile && mobileSidebarOpen ? '4px 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Subtle vertical glow streak */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 1, height: '100%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.3) 40%, rgba(34,211,238,0.15) 70%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex', alignItems: 'center',
          padding: effectiveCollapsed ? '0 17px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          gap: 12, flexShrink: 0,
        }}>
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            animate={{ boxShadow: ['0 0 16px rgba(99,102,241,0.3)', '0 0 32px rgba(99,102,241,0.55)', '0 0 16px rgba(99,102,241,0.3)'] }}
            transition={{ boxShadow: { duration: 2.5, repeat: Infinity }, scale: { duration: 0.2 } }}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
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
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>MediCore</div>
                <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Healthcare AI</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: 10, fontWeight: 700, color: '#2d3748', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 14px', marginBottom: 4 }}
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
                    style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}
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
                        style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, position: 'relative', zIndex: 1 }}
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
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 4,
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                    boxShadow: '0 0 12px rgba(99,102,241,0.35)',
                  }}
                >
                  {user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'A'}
                </motion.div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.displayName ?? 'Admin'}
                  </div>
                  <div style={{ fontSize: 10, color: '#6366f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              display: 'flex', alignItems: 'center', gap: 12,
              justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
              padding: effectiveCollapsed ? '11px' : '10px 14px',
              border: '1px solid transparent',
              borderRadius: 10,
              width: '100%', background: 'transparent', cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 13.5,
              fontWeight: 500,
              transition: 'background 0.18s, border-color 0.18s, color 0.18s',
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
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 8, borderRadius: 8,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                color: '#475569', cursor: 'pointer', width: '100%',
                transition: 'all 0.2s',
              }}
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

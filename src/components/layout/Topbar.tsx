import { Bell, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store';
import { togglePanel } from '@/store/slices/notificationSlice';
import { toggleMobileSidebar } from '@/store/slices/uiSlice';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import NotificationPanel from '@/features/notifications/NotificationPanel';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(s => s.ui.sidebarCollapsed);
  const notificationsEnabled = useAppSelector(s => s.ui.notificationsEnabled);
  const panelOpen = useAppSelector(s => s.notifications.panelOpen);
  const notifications = useAppSelector(s => s.notifications.notifications);
  const unread = notifications.filter(n => !n.read).length;
  const { isMobile } = useBreakpoint();

  const sidebarWidth = isMobile ? 0 : (collapsed ? 72 : 260);

  return (
    <>
      <motion.header
        animate={{ left: sidebarWidth }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          background: 'rgba(7,7,15,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: 40,
        }}
      >
        {/* Hamburger — mobile only */}
        <button
          className="hamburger-btn"
          onClick={() => dispatch(toggleMobileSidebar())}
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>

        {/* Page title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              key={subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ fontSize: 12, color: '#475569', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Notification bell — hidden when notifications are disabled in Settings */}
        {notificationsEnabled && <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => dispatch(togglePanel())}
          style={{
            position: 'relative',
            width: 40, height: 40,
            borderRadius: 10,
            background: panelOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${panelOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: panelOpen ? '#818cf8' : '#94a3b8',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            boxShadow: panelOpen ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={unread > 0 ? { rotate: [0, 12, -12, 8, -8, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 5 }}
          >
            <Bell size={17} />
          </motion.div>

          <AnimatePresence>
            {unread > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                style={{
                  position: 'absolute', top: -5, right: -5,
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: 'linear-gradient(135deg, #f43f5e, #fb923c)',
                  border: '2px solid #07070f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: 'white', padding: '0 3px',
                  boxShadow: '0 0 12px rgba(244,63,94,0.5)',
                }}
              >
                {unread > 9 ? '9+' : unread}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>}
      </motion.header>

      <AnimatePresence>
        {notificationsEnabled && panelOpen && <NotificationPanel />}
      </AnimatePresence>
    </>
  );
}

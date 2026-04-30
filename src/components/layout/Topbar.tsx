import './styles/Topbar.css';
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
        className="topbar-header"
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
        <div className="topbar-title-wrapper">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="topbar-title"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              key={subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="topbar-subtitle"
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
          className={`topbar-notif-btn${panelOpen ? ' active' : ''}`}
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
                className="topbar-notif-badge"
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

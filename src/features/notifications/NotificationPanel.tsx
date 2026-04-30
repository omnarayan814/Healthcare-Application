import './styles/NotificationPanel.css';
import { motion } from 'framer-motion';
import { X, CheckCheck, Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { markRead, markAllRead, closePanel } from '@/store/slices/notificationSlice';
import { timeAgo } from '@/utils/formatters';
import type { Notification } from '@/types';
import { useEffect, useRef } from 'react';

const TYPE_CONFIG = {
  error: { icon: AlertCircle, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  success: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  info: { icon: Info, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
};

function NotifItem({ notif }: { notif: Notification }) {
  const dispatch = useAppDispatch();
  const cfg = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => dispatch(markRead(notif.id))}
      className={`notif-item${notif.read ? '' : ' unread'}`}
    >
      {!notif.read && <div className="notif-item-indicator" />}
      <div className="notif-item-icon" style={{ background: cfg.bg }}>
        <Icon size={16} color={cfg.color} />
      </div>
      <div className="notif-item-content">
        <div className="notif-item-header-row">
          <span className={`notif-item-title${notif.read ? ' read' : ''}`}>
            {notif.title}
          </span>
          {!notif.read && <div className="notif-item-dot" />}
        </div>
        <p className="notif-item-message">{notif.message}</p>
        <span className="notif-item-time">{timeAgo(notif.timestamp)}</span>
      </div>
    </motion.div>
  );
}

export default function NotificationPanel() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(s => s.notifications.notifications);
  const unread = notifications.filter(n => !n.read).length;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        dispatch(closePanel());
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dispatch]);

  return (
    <motion.div
      ref={panelRef}
      className="notif-panel"
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="notif-panel-header">
        <div className="notif-panel-header-left">
          <Bell size={16} color="#6366f1" />
          <span className="notif-panel-title">Notifications</span>
          {unread > 0 && (
            <span className="notif-panel-count">{unread} new</span>
          )}
        </div>
        <div className="notif-panel-actions">
          {unread > 0 && (
            <button onClick={() => dispatch(markAllRead())} className="notif-mark-all-btn">
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button onClick={() => dispatch(closePanel())} className="notif-close-btn">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div>
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <Bell size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p className="notif-empty-text">No notifications</p>
          </div>
        ) : (
          notifications.map(n => <NotifItem key={n.id} notif={n} />)
        )}
      </div>
    </motion.div>
  );
}

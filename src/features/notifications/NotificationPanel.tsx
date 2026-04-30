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
      style={{
        display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer',
        background: notif.read ? 'transparent' : 'rgba(99,102,241,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.2s',
        position: 'relative',
      }}
    >
      {!notif.read && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: '60%', background: '#6366f1', borderRadius: '0 3px 3px 0',
        }} />
      )}
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: notif.read ? '#94a3b8' : '#f1f5f9' }}>
            {notif.title}
          </span>
          {!notif.read && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
          )}
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{notif.message}</p>
        <span style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'block' }}>
          {timeAgo(notif.timestamp)}
        </span>
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={16} color="#6366f1" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Notifications</span>
          {unread > 0 && (
            <span style={{
              padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.15)',
              color: '#818cf8', fontSize: 11, fontWeight: 600,
            }}>
              {unread} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button
              onClick={() => dispatch(markAllRead())}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button
            onClick={() => dispatch(closePanel())}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div>
        {notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
            <Bell size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 13 }}>No notifications</p>
          </div>
        ) : (
          notifications.map(n => <NotifItem key={n.id} notif={n} />)
        )}
      </div>
    </motion.div>
  );
}

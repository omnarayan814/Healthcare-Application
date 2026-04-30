import './styles/SettingsPage.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setNotificationsEnabled } from '@/store/slices/uiSlice';

/* ── Section card ─────────────────────────────────────────────────── */

function SectionCard({
  icon: Icon, label, color, description, delay = 0, children,
}: {
  icon: typeof User; label: string; color: string; description?: string;
  delay?: number; children: React.ReactNode;
}) {
  return (
    <motion.section
      className="glass-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '26px 28px' }}
    >
      <header className="settings-section-header">
        <div
          className="settings-section-icon"
          style={{ background: `${color}14`, border: `1px solid ${color}26` }}
        >
          <Icon size={16} color={color} />
        </div>
        <div>
          <h3 className="settings-section-title">{label}</h3>
          {description && (
            <p className="settings-section-description">{description}</p>
          )}
        </div>
      </header>
      <div className="settings-section-body">{children}</div>
    </motion.section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">{label}</div>
        {hint && <div className="settings-row-hint">{hint}</div>}
      </div>
      <div className="settings-row-value-wrapper">{children}</div>
    </div>
  );
}

/* ── Toggle ───────────────────────────────────────────────────────── */

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="settings-toggle"
      style={{ background: on ? 'var(--accent-primary)' : 'rgba(120,120,140,0.22)' }}
    >
      <motion.span
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className="settings-toggle-thumb"
      />
    </button>
  );
}

/* ── Static field (read-only, plain text — not an input) ─────────── */

function StaticValue({ value }: { value: string }) {
  return (
    <div className="settings-static-value">
      {value}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const notificationsEnabled = useAppSelector(s => s.ui.notificationsEnabled);

  return (
    <div className="settings-page">

      <SectionCard
        icon={User} label="Profile" color="#6366f1" delay={0}
        description="Identity details associated with your account."
      >
        <Row label="Display Name"><StaticValue value={user?.displayName ?? 'Admin User'} /></Row>
        <Row label="Email Address"><StaticValue value={user?.email ?? ''} /></Row>
      </SectionCard>

      <SectionCard
        icon={Bell} label="Notifications" color="#22d3ee" delay={0.06}
        description="Push alerts for patient activity. Hides the bell when disabled."
      >
        <Row
          label="Enable notifications"
          hint={notificationsEnabled
            ? 'Receiving updates for new, edited and deleted patients.'
            : 'All push alerts and the bell icon are hidden.'}
        >
          <Toggle
            on={notificationsEnabled}
            onClick={() => dispatch(setNotificationsEnabled(!notificationsEnabled))}
          />
        </Row>
      </SectionCard>


    </div>
  );
}

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Monitor, Sun, Moon, Check, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTheme, setNotificationsEnabled, type Theme } from '@/store/slices/uiSlice';

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
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}14`, border: `1px solid ${color}26`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{label}</h3>
          {description && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{description}</p>
          )}
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </motion.section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="settings-row" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
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
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? 'var(--accent-primary)' : 'rgba(120,120,140,0.22)',
        border: 'none', padding: 2, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center',
        transition: 'background 0.18s',
      }}
    >
      <motion.span
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        style={{
          display: 'block', width: 18, height: 18, borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}

/* ── Static field (read-only, plain text — not an input) ─────────── */

function StaticValue({ value }: { value: string }) {
  return (
    <div style={{
      minWidth: 220, fontSize: 13, color: 'var(--text-secondary)',
      textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {value}
    </div>
  );
}

/* ── Custom Select (used for Theme) ───────────────────────────────── */

interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

function Select<T extends string>({
  value, onChange, options,
}: {
  value: T; onChange: (v: T) => void; options: SelectOption<T>[];
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLUListElement>(null);
  const current = options.find(o => o.value === value);

  // Position the popover beneath the trigger using viewport coordinates
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  // Click outside / escape to close
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        popoverRef.current && !popoverRef.current.contains(t)
      ) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div style={{ position: 'relative', width: 200 }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%', height: 38, padding: '0 12px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)',
          border: `1px solid ${open ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
          borderRadius: 10, cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {current?.icon}
        <span style={{ flex: 1, textAlign: 'left' }}>{current?.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ display: 'flex', color: 'var(--text-muted)' }}>
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Portal — escapes any overflow:hidden ancestor (e.g. .glass-card) */}
      {createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.ul
              ref={popoverRef}
              role="listbox"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: coords.width,
                listStyle: 'none', padding: 4, margin: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-card)',
                zIndex: 1000,
              }}
            >
              {options.map(opt => {
                const selected = opt.value === value;
                return (
                  <li key={opt.value} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      style={{
                        width: '100%', height: 34, padding: '0 10px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: selected ? 'rgba(99,102,241,0.10)' : 'transparent',
                        border: 'none', borderRadius: 7, cursor: 'pointer',
                        color: selected ? 'var(--accent-secondary)' : 'var(--text-primary)',
                        fontSize: 13, fontWeight: selected ? 600 : 500,
                        transition: 'background 0.12s',
                      }}
                    >
                      {opt.icon}
                      <span style={{ flex: 1, textAlign: 'left' }}>{opt.label}</span>
                      {selected && <Check size={13} color="var(--accent-primary)" />}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const theme = useAppSelector(s => s.ui.theme);
  const notificationsEnabled = useAppSelector(s => s.ui.notificationsEnabled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 }}>

      <SectionCard
        icon={User} label="Profile" color="#6366f1" delay={0}
        description="Identity details associated with your account."
      >
        <Row label="Display Name"><StaticValue value={user?.displayName ?? 'Admin User'} /></Row>
        <Row label="Email Address"><StaticValue value={user?.email ?? ''} /></Row>
        <Row label="Role"><StaticValue value="Administrator" /></Row>
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

      <SectionCard
        icon={Monitor} label="Display" color="#10b981" delay={0.12}
        description="Visual preferences applied across the entire app."
      >
        <Row label="Theme" hint="Choose between dark and light appearance.">
          <Select<Theme>
            value={theme}
            onChange={t => dispatch(setTheme(t))}
            options={[
              { value: 'dark',  label: 'Dark',  icon: <Moon size={14} color="#818cf8" /> },
              { value: 'light', label: 'Light', icon: <Sun size={14} color="#f59e0b" /> },
            ]}
          />
        </Row>
      </SectionCard>

    </div>
  );
}

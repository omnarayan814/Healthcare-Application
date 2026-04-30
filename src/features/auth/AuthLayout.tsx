import { motion } from 'framer-motion';
import { Activity, Stethoscope, Brain } from 'lucide-react';

const FEATURES = [
  { icon: Stethoscope, text: 'Real-time patient monitoring' },
  { icon: Brain,       text: 'AI-powered diagnostics' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* ── LEFT HERO PANEL — always dark ── */}
      <aside className="auth-hero login-left">
        <div className="auth-hero-bg" />
        <div className="auth-hero-orb auth-hero-orb-1" />
        <div className="auth-hero-orb auth-hero-orb-2" />

        {/* ── Decorative ECG sweep — top right ── */}
        <svg
          className="auth-hero-fx auth-hero-fx-ecg"
          viewBox="0 0 320 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ecgFade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#22D3EE" stopOpacity="0" />
              <stop offset="35%" stopColor="#22D3EE" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 L60,40 L75,40 L82,18 L92,62 L100,30 L110,40 L160,40 L175,40 L182,22 L192,58 L200,30 L210,40 L260,40 L275,40 L282,16 L292,64 L300,30 L310,40 L320,40"
            fill="none"
            stroke="url(#ecgFade)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* ── Decorative molecular hex — middle right ── */}
        <svg
          className="auth-hero-fx auth-hero-fx-mol"
          viewBox="-60 -60 120 120"
          aria-hidden="true"
        >
          <g className="auth-hero-fx-mol-spin">
            {/* Hex bonds */}
            <polygon
              points="40,0 20,34.64 -20,34.64 -40,0 -20,-34.64 20,-34.64"
              fill="none"
              stroke="rgba(34,211,238,0.45)"
              strokeWidth="1"
            />
            <polygon
              points="22,0 11,19 -11,19 -22,0 -11,-19 11,-19"
              fill="none"
              stroke="rgba(34,211,238,0.25)"
              strokeWidth="1"
            />
            {/* Bond lines from center */}
            <line x1="0" y1="0" x2="40"  y2="0"      stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="-40" y2="0"      stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="20"  y2="34.64"  stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="-20" y2="-34.64" stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" />
            {/* Atoms */}
            <circle cx="40"  cy="0"      r="4" fill="#22D3EE" opacity="0.85" />
            <circle cx="20"  cy="34.64"  r="3" fill="#67E8F9" opacity="0.75" />
            <circle cx="-20" cy="34.64"  r="3" fill="#67E8F9" opacity="0.75" />
            <circle cx="-40" cy="0"      r="4" fill="#22D3EE" opacity="0.85" />
            <circle cx="-20" cy="-34.64" r="3" fill="#67E8F9" opacity="0.75" />
            <circle cx="20"  cy="-34.64" r="3" fill="#67E8F9" opacity="0.75" />
            <circle cx="0"   cy="0"      r="3.5" fill="#A5F3FC" opacity="0.9" />
          </g>
        </svg>

        {/* ── Decorative pulse/sonar rings — bottom right ── */}
        <div className="auth-hero-fx auth-hero-fx-pulse" aria-hidden="true">
          <span className="auth-hero-fx-pulse-ring" />
          <span className="auth-hero-fx-pulse-ring" />
          <span className="auth-hero-fx-pulse-ring" />
          <span className="auth-hero-fx-pulse-core" />
        </div>

        {/* ── Decorative drifting bio-particles ── */}
        <div className="auth-hero-fx auth-hero-fx-particles" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`auth-hero-fx-particle p-${i}`} />
          ))}
        </div>

        <div className="auth-hero-inner">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="auth-hero-logo"
          >
            <div className="auth-hero-logo-mark">
              <Activity size={20} color="white" />
            </div>
            <div>
              <div className="auth-hero-logo-name">MediCore</div>
              <div className="auth-hero-logo-tag">Healthcare Platform</div>
            </div>
          </motion.div>

          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="auth-hero-content"
          >
            <div className="auth-hero-pill">
              <span className="auth-hero-pill-dot" />
              Enterprise Healthcare Suite
            </div>

            <h1 className="auth-hero-title">
              Modern care,<br />
              <span className="auth-hero-title-accent">measurable outcomes.</span>
            </h1>

            <p className="auth-hero-lead">
              Unified clinical intelligence — streamline patient care, analytics,
              and operational workflows in a single workspace.
            </p>

            {/* Feature list */}
            <ul className="auth-hero-features">
              {FEATURES.map(({ icon: Icon, text }, i) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.07 }}
                >
                  <span className="auth-hero-feature-icon">
                    <Icon size={13} />
                  </span>
                  {text}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Footer signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="auth-hero-signature"
          >
            © {new Date().getFullYear()} MediCore · Built for clinicians
          </motion.div>
        </div>
      </aside>

      {/* ── RIGHT FORM PANEL — flips with global theme ── */}
      {children}
    </div>
  );
}

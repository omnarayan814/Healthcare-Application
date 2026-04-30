import './styles/DashboardPage.css';
import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, AlertTriangle,
  Heart, Activity, Clock, ChevronRight, Zap,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addNotification } from '@/store/slices/notificationSlice';
import { ADMISSIONS_DATA } from '@/utils/mockData';
import { getStatusColor, formatDate, getInitialsBg } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { KPIMetric } from '@/types';

/* ─── Animated number ─── */
function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 55, damping: 16 });
  const display = useTransform(spring, v => Math.round(v).toLocaleString());
  useEffect(() => { motionVal.set(value); }, [motionVal, value]);
  return <motion.span>{display}</motion.span>;
}

/* ─── Section header ─── */
function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h3 className="section-header-title">{title}</h3>
        {subtitle && <p className="section-header-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── KPI Card ─── */
function KPICard({ metric, index }: { metric: KPIMetric; index: number }) {
  const isUp = metric.trend === 'up';
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numericValue = typeof metric.value === 'number' ? metric.value : null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="dashboard-kpi-card"
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.borderColor = `${metric.color}30`;
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 40px ${metric.color}12`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(255,255,255,0.07)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 4, repeat: Infinity, delay: index * 0.8 }}
        className="dashboard-kpi-glow"
        style={{ background: metric.color }}
      />

      <div className="dashboard-kpi-header">
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${metric.color}14`, border: `1px solid ${metric.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={17} color={metric.color} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 20,
          background: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
          border: `1px solid ${isUp ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
        }}>
          <TrendIcon size={10} color={isUp ? '#10b981' : '#f43f5e'} />
          <span style={{ fontSize: 11, fontWeight: 700, color: isUp ? '#10b981' : '#f43f5e' }}>
            {isUp ? '+' : ''}{metric.change}
          </span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="dashboard-kpi-value">
          {numericValue !== null && inView ? <AnimatedNumber value={numericValue} /> : metric.value}
        </div>
        <div className="dashboard-kpi-label">{metric.label}</div>
      </div>

      {/* Sparkline */}
      <div className="dashboard-kpi-sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={metric.sparkData.map((v, i) => ({ v, i }))}>
            <defs>
              <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metric.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={metric.color} strokeWidth={2}
              fill={`url(#spark-${index})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ─── Chart tooltip ─── */
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{payload[0].value} <span className="chart-tooltip-unit">admissions</span></p>
    </div>
  );
};

const DEPT_ICONS: Record<string, React.ReactNode> = {
  Cardiology: <Heart size={13} color="#f43f5e" />,
  Emergency:  <AlertTriangle size={13} color="#f59e0b" />,
  ICU:        <Activity size={13} color="#22d3ee" />,
  Neurology:  <Zap size={13} color="#818cf8" />,
};

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);
  const { patients, loading } = useAppSelector(s => s.patients);
  const recentPatients = patients.slice(0, 5);
  const criticalPatients = patients.filter(p => p.status === 'critical');

  // Derive live KPIs from API patient data
  const totalPatients = patients.length;
  const activeCases = patients.filter(p => p.status === 'active').length;
  const criticalCount = patients.filter(p => p.status === 'critical').length;

  const KPI_DATA: KPIMetric[] = [
    {
      label: 'Total Patients', value: loading ? 0 : totalPatients,
      change: 8, changeLabel: 'vs last week', trend: 'up',
      color: '#6366f1', sparkData: [12, 13, 15, 14, 16, 18, totalPatients || 20],
    },
    {
      label: 'Active Cases', value: loading ? 0 : activeCases,
      change: 3, changeLabel: 'vs last week', trend: 'up',
      color: '#22d3ee', sparkData: [4, 5, 6, 5, 6, 7, activeCases || 7],
    },
    {
      label: 'Critical Patients', value: loading ? 0 : criticalCount,
      change: -1, changeLabel: 'vs last week', trend: criticalCount <= 3 ? 'down' : 'up',
      color: '#f43f5e', sparkData: [6, 5, 5, 4, 4, 5, criticalCount || 4],
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(addNotification({ title: 'New Patient Admitted', message: 'Marcus Williams admitted to Cardiology — Room CARD-06.', type: 'info' }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const hour = new Date().getHours();
  const { greeting, emoji } =
    hour >= 5  && hour < 12 ? { greeting: 'Good morning',   emoji: '☀️' } :
    hour >= 12 && hour < 17 ? { greeting: 'Good afternoon', emoji: '👋' } :
    hour >= 17 && hour < 21 ? { greeting: 'Good evening',   emoji: '🌆' } :
                              { greeting: 'Good night',     emoji: '🌙' };

  return (
    <div className="dashboard-page">

      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="dashboard-welcome-banner"
      >
        <div>
          <h2 className="dashboard-welcome-title">
            {greeting}, {user?.displayName ?? user?.email?.split('@')[0] ?? 'Doctor'} {emoji}
          </h2>
          <p className="dashboard-welcome-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            <span className="dashboard-critical-count">{criticalCount} critical</span>
            {' '}patient{criticalCount !== 1 ? 's' : ''} require attention
          </p>
        </div>
        <div className="welcome-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => navigate('/Patients')} style={{ fontSize: 13 }}>
            <Users size={14} /> Patients
          </button>
          <button className="btn-primary" onClick={() => navigate('/Analytics')} style={{ fontSize: 13 }}>
            <Activity size={14} /> Analytics
          </button>
        </div>
      </motion.div>

      {/* ── KPI Grid ── */}
      <div className="grid-kpi">
        {KPI_DATA.map((m, i) => <KPICard key={m.label} metric={m} index={i} />)}
      </div>

      {/* ── Chart + Critical Row ── */}
      <div className="grid-chart-main">

        {/* Admissions chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35, ease: 'easeOut' }}
          className="glass-card"
          style={{ padding: '24px 26px' }}
        >
          <SectionHeader
            title="Patient Admissions"
            subtitle="12-month overview · 2026"
            action={
              <span className="dashboard-year-badge">2026</span>
            }
          />
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={ADMISSIONS_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#admGrad)" dot={false}
                activeDot={{ r: 5, fill: '#6366f1', stroke: 'rgba(99,102,241,0.3)', strokeWidth: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Critical patients */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.35, ease: 'easeOut' }}
          className="glass-card"
          style={{ padding: '24px' }}
        >
          <SectionHeader
            title="Critical Alerts"
            action={
              <span className="dashboard-critical-badge">
                {criticalPatients.length} active
              </span>
            }
          />
          <div className="dashboard-critical-list">
            {criticalPatients.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                onClick={() => navigate('/Patients')}
                className="dashboard-critical-item"
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.6 }}
                  className="dashboard-critical-indicator"
                />
                <div className="avatar" style={{ width: 34, height: 34, background: getInitialsBg(p.name), fontSize: 11 }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="dashboard-critical-name">{p.name}</div>
                  <div className="dashboard-critical-diagnosis">{p.diagnosis}</div>
                </div>
                <div className="dashboard-critical-vitals">
                  <div className="dashboard-critical-o2">O₂ {p.vitals.oxygenSat}%</div>
                  <div className="dashboard-critical-room">{p.room}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Recent Patients Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.35, ease: 'easeOut' }}
        className="glass-card"
        style={{ padding: '24px 26px' }}
      >
        <SectionHeader
          title="Recent Patients"
          subtitle="Latest admissions and activity"
          action={
            <button className="btn-ghost" onClick={() => navigate('/Patients')}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px' }}>
              View all <ChevronRight size={13} />
            </button>
          }
        />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Department</th>
                <th>Status</th>
                <th>Doctor</th>
                <th>Admitted</th>
                <th>Vitals</th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  onClick={() => navigate('/Patients')}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: getInitialsBg(p.name), fontSize: 12 }}>{p.avatar}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{p.age}y · {p.gender} · {p.bloodGroup}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                      {DEPT_ICONS[p.department] ?? <Clock size={13} color="#475569" />}
                      {p.department}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${p.status}`}>
                      <span className="status-dot" style={{ background: getStatusColor(p.status) }} />
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5, color: '#94a3b8' }}>{p.doctor}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#64748b' }}>{formatDate(p.admittedOn)}</td>
                  <td>
                    <div className="dashboard-vitals">
                      <span className="dashboard-vital-heart">♥ {p.vitals.heartRate}</span>
                      <span className="dashboard-vital-oxygen">O₂ {p.vitals.oxygenSat}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

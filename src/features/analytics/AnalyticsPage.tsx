import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Users, Heart } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, type PieLabelRenderProps,
} from 'recharts';
import { useAppDispatch } from '@/store';
import { addNotification } from '@/store/slices/notificationSlice';
import { ADMISSIONS_DATA, DEPARTMENT_DATA, DIAGNOSIS_PIE, WEEKLY_DATA } from '@/utils/mockData';

/* ─── Shared tooltip ─── */
const ChartTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; color?: string; name?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,10,24,0.96)', border: '1px solid rgba(99,102,241,0.18)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)', minWidth: 120,
    }}>
      {label && <p style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color ?? '#818cf8' }}>
          {p.name ? <span style={{ fontWeight: 400, color: '#64748b' }}>{p.name}: </span> : null}{p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Pie label ─── */
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) => {
  if (!percent || percent < 0.06) return null;
  const R = Math.PI / 180;
  const ir = Number(innerRadius ?? 0), or = Number(outerRadius ?? 0), ma = Number(midAngle ?? 0);
  const r = ir + (or - ir) * 0.5;
  const x = Number(cx ?? 0) + r * Math.cos(-ma * R);
  const y = Number(cy ?? 0) + r * Math.sin(-ma * R);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ─── Card wrapper with consistent header ─── */
function ChartCard({
  title, subtitle, delay = 0, children, style,
}: {
  title: string; subtitle?: string; delay?: number;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="glass-card"
      style={{ padding: '24px 26px', ...style }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Summary metric card ─── */
const SUMMARY = [
  { label: 'Avg Stay Duration',  value: '4.2 days', icon: Activity, color: '#6366f1' },
  { label: 'Bed Occupancy',      value: '78.4%',    icon: TrendingUp, color: '#22d3ee' },
  { label: 'Patient Satisfaction', value: '4.7 / 5', icon: Heart,    color: '#10b981' },
  { label: 'Staff-to-Patient',   value: '1 : 3.2',  icon: Users,     color: '#f59e0b' },
];

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(addNotification({ title: 'Lab Results Ready', message: 'Blood panel for Sarah Mitchell is available.', type: 'success' }));
    }, 2000);
    return () => clearTimeout(t);
  }, [dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary row ── */}
      <div className="grid-analytics-summary">
        {SUMMARY.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            style={{
              padding: '18px 20px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'default',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 11, flexShrink: 0,
              background: `${color}13`, border: `1px solid ${color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={19} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Row 1: Admissions trend + Weekly flow ── */}
      <div className="grid-2col">
        <ChartCard title="Monthly Admissions vs Discharges" subtitle="Full year · 2026" delay={0.15}>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={ADMISSIONS_DATA} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 12 }} />
              <Area name="Admissions" type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#ag1)" dot={false} />
              <Area name="Discharges" type="monotone" dataKey="secondary" stroke="#22d3ee" strokeWidth={2} fill="url(#ag2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Patient Flow" subtitle="Admissions vs critical cases this week" delay={0.2}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={WEEKLY_DATA} barGap={3} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 12 }} />
              <Bar name="Admissions" dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar name="Critical"   dataKey="secondary" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 2: Department load + Diagnosis pie ── */}
      <div className="grid-analytics-row2">
        <ChartCard title="Department Load" subtitle="Current patient count per department" delay={0.25}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DEPARTMENT_DATA} layout="vertical" barSize={12} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={88} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {DEPARTMENT_DATA.map((_, i) => (
                  <Cell key={i} fill={`hsl(${235 + i * 14}, 65%, ${52 + i * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Diagnosis Categories" subtitle="Distribution by condition type" delay={0.3}>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={DIAGNOSIS_PIE} cx="50%" cy="50%" outerRadius={78} innerRadius={42}
                dataKey="value" labelLine={false} label={PieLabel}>
                {DIAGNOSIS_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n as string]} contentStyle={{
                background: 'rgba(10,10,24,0.96)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 8,
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
            {DIAGNOSIS_PIE.map(({ name, value, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 3: Recovery line chart ── */}
      <ChartCard title="Recovery Rate Trend" subtitle="Month-over-month patient recovery performance · 2026" delay={0.35}>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart
            data={ADMISSIONS_DATA.map((d, i) => ({ ...d, recovery: +(85 + i * 0.78 + Math.sin(i) * 1.5).toFixed(1) }))}
            margin={{ top: 4, right: 16, left: -12, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[82, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="recovery" stroke="#10b981" strokeWidth={2.5}
              dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#10b981', stroke: 'rgba(16,185,129,0.3)', strokeWidth: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
}

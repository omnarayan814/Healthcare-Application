import type { Patient, Notification, KPIMetric, ChartDataPoint } from '@/types';


export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'N001', title: 'Critical Alert', read: false,
    message: 'Patient Robert Chen (P002) vitals deteriorating. Immediate attention required.',
    type: 'error', timestamp: '2026-04-30T09:15:00Z',
  },
  {
    id: 'N002', title: 'New Patient Admitted', read: false,
    message: 'Marcus Williams has been admitted to Cardiology ward — Room CARD-06.',
    type: 'info', timestamp: '2026-04-30T08:42:00Z',
  },
  {
    id: 'N003', title: 'Lab Results Ready', read: false,
    message: 'Blood panel results for Sarah Mitchell are now available.',
    type: 'success', timestamp: '2026-04-30T08:10:00Z',
  },
  {
    id: 'N004', title: 'Appointment Reminder', read: true,
    message: 'Dr. Priya Sharma — scheduled rounds begin in 30 minutes.',
    type: 'warning', timestamp: '2026-04-30T07:30:00Z',
  },
  {
    id: 'N005', title: 'Patient Discharged', read: true,
    message: 'Olivia Patel has been successfully discharged from General ward.',
    type: 'success', timestamp: '2026-04-29T17:00:00Z',
  },
];

export const KPI_DATA: KPIMetric[] = [
  {
    label: 'Total Patients', value: 248, change: 12, changeLabel: 'vs last week', trend: 'up',
    color: '#6366f1', sparkData: [180, 195, 210, 198, 220, 235, 248],
  },
  {
    label: 'Active Cases', value: 84, change: 5, changeLabel: 'vs last week', trend: 'up',
    color: '#22d3ee', sparkData: [60, 68, 72, 65, 78, 80, 84],
  },
  {
    label: 'Critical Patients', value: 12, change: -3, changeLabel: 'vs last week', trend: 'down',
    color: '#f43f5e', sparkData: [18, 16, 15, 17, 14, 13, 12],
  },
  {
    label: 'Recovery Rate', value: '94.2%', change: 2.1, changeLabel: 'vs last month', trend: 'up',
    color: '#10b981', sparkData: [88, 89, 91, 90, 92, 93, 94],
  },
];

export const ADMISSIONS_DATA: ChartDataPoint[] = [
  { label: 'Jan', value: 142, secondary: 28 },
  { label: 'Feb', value: 168, secondary: 34 },
  { label: 'Mar', value: 155, secondary: 22 },
  { label: 'Apr', value: 191, secondary: 38 },
  { label: 'May', value: 203, secondary: 31 },
  { label: 'Jun', value: 187, secondary: 26 },
  { label: 'Jul', value: 219, secondary: 42 },
  { label: 'Aug', value: 234, secondary: 35 },
  { label: 'Sep', value: 211, secondary: 29 },
  { label: 'Oct', value: 248, secondary: 44 },
  { label: 'Nov', value: 226, secondary: 33 },
  { label: 'Dec', value: 239, secondary: 38 },
];

export const DEPARTMENT_DATA: ChartDataPoint[] = [
  { label: 'Cardiology', value: 52 },
  { label: 'Neurology', value: 38 },
  { label: 'Orthopedics', value: 44 },
  { label: 'Oncology', value: 29 },
  { label: 'Pediatrics', value: 35 },
  { label: 'Emergency', value: 67 },
  { label: 'ICU', value: 18 },
  { label: 'General', value: 83 },
];

export const DIAGNOSIS_PIE: { name: string; value: number; color: string }[] = [
  { name: 'Cardiovascular', value: 28, color: '#f43f5e' },
  { name: 'Neurological', value: 18, color: '#6366f1' },
  { name: 'Orthopedic', value: 22, color: '#22d3ee' },
  { name: 'Oncology', value: 12, color: '#f59e0b' },
  { name: 'Respiratory', value: 15, color: '#10b981' },
  { name: 'Other', value: 5, color: '#94a3b8' },
];

export const WEEKLY_DATA: ChartDataPoint[] = [
  { label: 'Mon', value: 34, secondary: 8 },
  { label: 'Tue', value: 42, secondary: 12 },
  { label: 'Wed', value: 38, secondary: 9 },
  { label: 'Thu', value: 51, secondary: 15 },
  { label: 'Fri', value: 47, secondary: 11 },
  { label: 'Sat', value: 29, secondary: 6 },
  { label: 'Sun', value: 22, secondary: 4 },
];

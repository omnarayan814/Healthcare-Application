import type { PatientStatus } from '@/types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getStatusColor(status: PatientStatus): string {
  const map: Record<PatientStatus, string> = {
    active: '#10b981',
    critical: '#f43f5e',
    stable: '#6366f1',
    discharged: '#94a3b8',
    pending: '#f59e0b',
  };
  return map[status];
}

export function getInitialsBg(name: string): string {
  const colors = [
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #22d3ee, #38bdf8)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #f43f5e, #fb7185)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function getDepartmentIcon(dept: string): string {
  const map: Record<string, string> = {
    Cardiology: '❤️', Neurology: '🧠', Orthopedics: '🦴',
    Oncology: '🔬', Pediatrics: '👶', Emergency: '🚨',
    ICU: '💊', General: '🏥',
  };
  return map[dept] ?? '🏥';
}

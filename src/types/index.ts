export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type PatientStatus = 'active' | 'critical' | 'stable' | 'discharged' | 'pending';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Department = 'Cardiology' | 'Neurology' | 'Orthopedics' | 'Oncology' | 'Pediatrics' | 'Emergency' | 'ICU' | 'General';
export type ViewMode = 'grid' | 'list';

export interface Vitals {
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenSat: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  bloodGroup: BloodGroup;
  department: Department;
  status: PatientStatus;
  doctor: string;
  admittedOn: string;
  diagnosis: string;
  room: string;
  vitals: Vitals;
  avatar: string;
  phone: string;
  email: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

export interface KPIMetric {
  label: string;
  value: number | string;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down';
  color: string;
  sparkData: number[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
}

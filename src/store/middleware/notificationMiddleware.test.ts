import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/services/notifications', () => ({ showLocalNotification: vi.fn() }));
vi.mock('@/services/firebase', () => ({
  loginWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('@/services/patientService', () => ({
  fetchPatientsAPI: vi.fn(),
  addPatientToFirestore: vi.fn(),
  upsertPatientInFirestore: vi.fn(),
  deletePatientsFromFirestore: vi.fn(),
}));

import { showLocalNotification } from '@/services/notifications';
import {
  addPatientToFirestore, upsertPatientInFirestore, deletePatientsFromFirestore,
} from '@/services/patientService';

import { notificationMiddleware } from './notificationMiddleware';
import patientReducer, {
  addPatientThunk, updatePatientThunk, deletePatientsThunk,
  mergeFirestorePatients,
} from '@/store/slices/patientSlice';
import notificationReducer, { addNotification } from '@/store/slices/notificationSlice';
import uiReducer, { setNotificationsEnabled } from '@/store/slices/uiSlice';
import type { Patient } from '@/types';

function makeStore() {
  return configureStore({
    reducer: {
      patients: patientReducer,
      notifications: notificationReducer,
      ui: uiReducer,
    },
    middleware: gdm => gdm().concat(notificationMiddleware),
  });
}

const seed = (id: string, overrides: Partial<Patient> = {}): Patient => ({
  id, name: 'Test ' + id, age: 40, gender: 'Male', bloodGroup: 'O+',
  department: 'General', status: 'active', doctor: 'Dr. T',
  admittedOn: '2026-04-22', diagnosis: 'Flu', room: 'GEN-01',
  vitals: { heartRate: 70, bloodPressure: '120/80', temperature: 36.7, oxygenSat: 98 },
  avatar: 'TT', phone: '+1', email: 't@x.com',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('notificationMiddleware — patient ADD', () => {
  it('fires push + dispatches addNotification when notifications enabled', async () => {
    (addPatientToFirestore as any).mockResolvedValueOnce('newId-1');
    const store = makeStore();
    const { id: _, ...payload } = seed('placeholder', { name: 'Sarah', department: 'ICU', room: 'ICU-02' });

    await store.dispatch(addPatientThunk(payload));

    expect(showLocalNotification).toHaveBeenCalledOnce();
    const [title, message] = (showLocalNotification as any).mock.calls[0];
    expect(title).toBe('Patient Added');
    expect(message).toContain('Sarah');
    expect(message).toContain('ICU');

    // Bell-dropdown notification was added too
    const bellNotifs = store.getState().notifications.notifications;
    expect(bellNotifs[0].title).toBe('Patient Added');
  });

  it('does NOT fire push when notifications are disabled', async () => {
    (addPatientToFirestore as any).mockResolvedValueOnce('id-2');
    const store = makeStore();
    store.dispatch(setNotificationsEnabled(false));

    const { id: _, ...payload } = seed('p');
    await store.dispatch(addPatientThunk(payload));

    expect(showLocalNotification).not.toHaveBeenCalled();
  });
});

describe('notificationMiddleware — patient UPDATE', () => {
  it('fires push with ONLY changed fields in the message', async () => {
    (upsertPatientInFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();

    const original = seed('P001', {
      name: 'Sarah Mitchell', status: 'active', room: 'CARD-04',
      vitals: { heartRate: 80, bloodPressure: '120/80', temperature: 37, oxygenSat: 97 },
    });
    store.dispatch(mergeFirestorePatients([original]));

    // Change room + heart rate ONLY
    const edited = {
      ...original,
      room: 'ICU-01',
      vitals: { ...original.vitals, heartRate: 92 },
    };
    await store.dispatch(updatePatientThunk(edited));

    expect(showLocalNotification).toHaveBeenCalledOnce();
    const [title, message] = (showLocalNotification as any).mock.calls[0];
    expect(title).toBe('Updated: Sarah Mitchell');
    expect(message).toContain('room');
    expect(message).toContain('heart rate');
    expect(message).not.toContain('temperature');     // unchanged
    expect(message).not.toContain('blood pressure');  // unchanged
  });

  it('does NOT fire push when nothing actually changed', async () => {
    (upsertPatientInFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    const p = seed('P001');
    store.dispatch(mergeFirestorePatients([p]));

    await store.dispatch(updatePatientThunk(p));      // identical input → no diff
    expect(showLocalNotification).not.toHaveBeenCalled();
  });

  it('respects the global notification toggle', async () => {
    (upsertPatientInFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    store.dispatch(setNotificationsEnabled(false));

    const p = seed('P001');
    store.dispatch(mergeFirestorePatients([p]));
    await store.dispatch(updatePatientThunk({ ...p, name: 'Renamed' }));

    expect(showLocalNotification).not.toHaveBeenCalled();
  });
});

describe('notificationMiddleware — patient DELETE', () => {
  it('fires push with the deleted patient name', async () => {
    (deletePatientsFromFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    const p = seed('P001', { name: 'Robert Chen' });
    store.dispatch(mergeFirestorePatients([p]));

    await store.dispatch(deletePatientsThunk(['P001']));

    expect(showLocalNotification).toHaveBeenCalledOnce();
    const [title, message] = (showLocalNotification as any).mock.calls[0];
    expect(title).toBe('Patient Deleted');
    expect(message).toContain('Robert Chen');
  });

  it('shows count + names for bulk delete', async () => {
    (deletePatientsFromFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    store.dispatch(mergeFirestorePatients([
      seed('P001', { name: 'A One' }),
      seed('P002', { name: 'B Two' }),
      seed('P003', { name: 'C Three' }),
    ]));

    await store.dispatch(deletePatientsThunk(['P001', 'P002', 'P003']));

    expect(showLocalNotification).toHaveBeenCalledOnce();
    const [title, message] = (showLocalNotification as any).mock.calls[0];
    expect(title).toBe('3 Patients Deleted');
    expect(message).toContain('A One');
    expect(message).toContain('B Two');
  });

  it('skips when notifications are disabled', async () => {
    (deletePatientsFromFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    store.dispatch(setNotificationsEnabled(false));
    store.dispatch(mergeFirestorePatients([seed('P001')]));
    await store.dispatch(deletePatientsThunk(['P001']));
    expect(showLocalNotification).not.toHaveBeenCalled();
  });
});

describe('notificationMiddleware — non-patient dispatches', () => {
  it('does NOT fire push for plain addNotification dispatches (bell-only)', () => {
    const store = makeStore();
    store.dispatch(addNotification({ title: 'Random', message: 'demo', type: 'info' }));

    // Bell still receives it
    expect(store.getState().notifications.notifications[0].title).toBe('Random');
    // But OS push does NOT fire
    expect(showLocalNotification).not.toHaveBeenCalled();
  });
});

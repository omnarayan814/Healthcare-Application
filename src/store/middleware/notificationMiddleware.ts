import type { Middleware } from '@reduxjs/toolkit';
import { showLocalNotification } from '@/services/notifications';
import { addNotification } from '@/store/slices/notificationSlice';
import {
  addPatientThunk, updatePatientThunk, deletePatientsThunk,
} from '@/store/slices/patientSlice';
import type { Patient } from '@/types';

// Local shape — kept here to avoid a circular import with the store
// (the store's RootState is derived from middleware, which would import RootState).
interface PatientStateShape { patients: Patient[] }
interface UIStateShape { notificationsEnabled: boolean }
interface MinimalRootState { patients: PatientStateShape; ui: UIStateShape }

/* ── diff helpers ───────────────────────────────────────────────────── */

const FIELD_LABELS: Partial<Record<keyof Patient, string>> = {
  name: 'name', age: 'age', gender: 'gender', bloodGroup: 'blood group',
  department: 'department', status: 'status', doctor: 'doctor',
  diagnosis: 'diagnosis', room: 'room', phone: 'phone', email: 'email',
};

function diffPatient(oldP: Patient | undefined, newP: Patient): string[] {
  if (!oldP) return [];
  const changes: string[] = [];

  (Object.keys(FIELD_LABELS) as (keyof Patient)[]).forEach(k => {
    if (oldP[k] !== newP[k]) changes.push(FIELD_LABELS[k]!);
  });

  if (oldP.vitals.heartRate     !== newP.vitals.heartRate)     changes.push('heart rate');
  if (oldP.vitals.bloodPressure !== newP.vitals.bloodPressure) changes.push('blood pressure');
  if (oldP.vitals.temperature   !== newP.vitals.temperature)   changes.push('temperature');
  if (oldP.vitals.oxygenSat     !== newP.vitals.oxygenSat)     changes.push('oxygen sat.');

  return changes;
}

/* ── per-request memory ─────────────────────────────────────────────── */
// Capture BEFORE-state on `pending`, read back on `fulfilled`.

const beforeUpdate = new Map<string, Patient>();
const beforeDelete = new Map<string, Patient[]>();

/* ── middleware ─────────────────────────────────────────────────────── */
// Push notifications fire ONLY for patient add / update / delete.
// Other `addNotification` dispatches still land in the bell dropdown,
// but they no longer pop an OS-level toast.

export const notificationMiddleware: Middleware =
  ({ getState, dispatch }) => next => action => {

  const state = () => getState() as MinimalRootState;

  if (updatePatientThunk.pending.match(action)) {
    const incoming = action.meta.arg;
    const old = state().patients.patients.find((p: Patient) => p.id === incoming.id);
    if (old) beforeUpdate.set(action.meta.requestId, old);
  }
  if (deletePatientsThunk.pending.match(action)) {
    const ids = new Set(action.meta.arg);
    const old = state().patients.patients.filter((p: Patient) => ids.has(p.id));
    beforeDelete.set(action.meta.requestId, old);
  }

  const result = next(action);

  // Honour the global on/off toggle from Settings
  const notificationsEnabled = state().ui.notificationsEnabled;

  if (addPatientThunk.fulfilled.match(action) && notificationsEnabled) {
    const p = action.payload;
    const title = 'Patient Added';
    const message = `${p.name} (${p.id}) — ${p.department}, Room ${p.room}`;
    showLocalNotification(title, message);
    dispatch(addNotification({ title, message, type: 'success' }));
  }

  if (updatePatientThunk.fulfilled.match(action)) {
    const newP = action.payload;
    const oldP = beforeUpdate.get(action.meta.requestId);
    beforeUpdate.delete(action.meta.requestId);

    if (notificationsEnabled) {
      const changed = diffPatient(oldP, newP);
      if (changed.length > 0) {
        const title = `Updated: ${newP.name}`;
        const message = `Changed ${changed.join(', ')}.`;
        showLocalNotification(title, message);
        dispatch(addNotification({ title, message, type: 'info' }));
      }
    }
  }

  if (deletePatientsThunk.fulfilled.match(action)) {
    const removed = beforeDelete.get(action.meta.requestId) ?? [];
    beforeDelete.delete(action.meta.requestId);

    if (removed.length > 0 && notificationsEnabled) {
      const isOne = removed.length === 1;
      const title = isOne ? 'Patient Deleted' : `${removed.length} Patients Deleted`;
      const previewNames = removed.slice(0, 3).map(p => p.name).join(', ');
      const message = isOne
        ? `${removed[0].name} (${removed[0].id}) was removed.`
        : `${previewNames}${removed.length > 3 ? `, +${removed.length - 3} more` : ''}.`;
      showLocalNotification(title, message);
      dispatch(addNotification({ title, message, type: 'warning' }));
    }
  }

  return result;
};

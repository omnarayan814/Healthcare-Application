import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { Patient } from '@/types';

vi.mock('@/services/patientService', () => ({
  fetchPatientsAPI: vi.fn(),
  addPatientToFirestore: vi.fn(),
  upsertPatientInFirestore: vi.fn(),
  deletePatientsFromFirestore: vi.fn(),
}));

import patientReducer, {
  fetchPatients, addPatientThunk, updatePatientThunk, deletePatientsThunk,
  setViewMode, setSelectedPatient, setSearchFilter, setStatusFilter,
  setDepartmentFilter, clearFilters, clearAddError,
  togglePatientSelection, selectAllPatients, clearSelection,
  mergeFirestorePatients,
} from './patientSlice';
import {
  fetchPatientsAPI, addPatientToFirestore,
  upsertPatientInFirestore, deletePatientsFromFirestore,
} from '@/services/patientService';

function makeStore() {
  return configureStore({ reducer: { patients: patientReducer } });
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

describe('patientSlice — synchronous reducers', () => {
  it('initial state', () => {
    const s = makeStore().getState().patients;
    expect(s.patients).toEqual([]);
    expect(s.selectedPatient).toBeNull();
    expect(s.viewMode).toBe('grid');
    expect(s.filters).toEqual({ search: '', status: 'all', department: 'all' });
    expect(s.selectedIds).toEqual([]);
    expect(s.adding).toBe(false);
  });

  it('setViewMode toggles grid ↔ list', () => {
    const store = makeStore();
    store.dispatch(setViewMode('list'));
    expect(store.getState().patients.viewMode).toBe('list');
  });

  it('filter setters and clearFilters', () => {
    const store = makeStore();
    store.dispatch(setSearchFilter('Sarah'));
    store.dispatch(setStatusFilter('critical'));
    store.dispatch(setDepartmentFilter('Cardiology'));
    expect(store.getState().patients.filters).toEqual({
      search: 'Sarah', status: 'critical', department: 'Cardiology',
    });
    store.dispatch(clearFilters());
    expect(store.getState().patients.filters).toEqual({ search: '', status: 'all', department: 'all' });
  });

  it('togglePatientSelection adds and removes ids', () => {
    const store = makeStore();
    store.dispatch(togglePatientSelection('P001'));
    store.dispatch(togglePatientSelection('P002'));
    expect(store.getState().patients.selectedIds).toEqual(['P001', 'P002']);
    store.dispatch(togglePatientSelection('P001'));
    expect(store.getState().patients.selectedIds).toEqual(['P002']);
  });

  it('selectAllPatients replaces selection wholesale', () => {
    const store = makeStore();
    store.dispatch(selectAllPatients(['P001', 'P002', 'P003']));
    expect(store.getState().patients.selectedIds).toEqual(['P001', 'P002', 'P003']);
    store.dispatch(clearSelection());
    expect(store.getState().patients.selectedIds).toEqual([]);
  });

  it('setSelectedPatient stores the patient', () => {
    const store = makeStore();
    const p = seed('P010');
    store.dispatch(setSelectedPatient(p));
    expect(store.getState().patients.selectedPatient).toEqual(p);
    store.dispatch(setSelectedPatient(null));
    expect(store.getState().patients.selectedPatient).toBeNull();
  });
});

describe('patientSlice — mergeFirestorePatients', () => {
  it('prepends only new ids (dedupes by id)', () => {
    const store = makeStore();
    store.dispatch(mergeFirestorePatients([seed('P001'), seed('P002')]));
    store.dispatch(mergeFirestorePatients([seed('P002'), seed('P003')]));
    const ids = store.getState().patients.patients.map(p => p.id);
    expect(ids.sort()).toEqual(['P001', 'P002', 'P003']);
  });

  it('respects deletedSeedIds tombstones', async () => {
    const store = makeStore();
    // delete a seed first → tombstone is recorded
    store.dispatch(mergeFirestorePatients([seed('P001'), seed('P002')]));
    (deletePatientsFromFirestore as any).mockResolvedValueOnce(undefined);
    await store.dispatch(deletePatientsThunk(['P001']));

    // try to merge it back via the listener — should be filtered out
    store.dispatch(mergeFirestorePatients([seed('P001')]));
    const ids = store.getState().patients.patients.map(p => p.id);
    expect(ids).not.toContain('P001');
  });
});

describe('patientSlice — fetchPatients (the persistence-bug regression)', () => {
  it('MERGES seeds with existing state — does NOT replace', async () => {
    const store = makeStore();
    // simulate the Firestore listener firing first with a saved patient
    store.dispatch(mergeFirestorePatients([seed('AbC123', { name: 'Saved By User' })]));

    // then the API resolves with the seed batch
    (fetchPatientsAPI as any).mockResolvedValueOnce([seed('P001'), seed('P002')]);
    await store.dispatch(fetchPatients());

    const ids = store.getState().patients.patients.map(p => p.id);
    expect(ids).toContain('AbC123');                       // Firestore-saved patient survives
    expect(ids).toContain('P001');
    expect(ids).toContain('P002');
  });

  it('does not duplicate seeds on repeated fetches', async () => {
    const store = makeStore();
    (fetchPatientsAPI as any).mockResolvedValue([seed('P001')]);
    await store.dispatch(fetchPatients());
    await store.dispatch(fetchPatients());
    const count = store.getState().patients.patients.filter(p => p.id === 'P001').length;
    expect(count).toBe(1);
  });

  it('rejected: stores error message', async () => {
    const store = makeStore();
    (fetchPatientsAPI as any).mockRejectedValueOnce(new Error('Network down'));
    await store.dispatch(fetchPatients());
    expect(store.getState().patients.error).toBe('Network down');
    expect(store.getState().patients.loading).toBe(false);
  });
});

describe('patientSlice — addPatientThunk', () => {
  it('fulfilled: writes to Firestore, prepends optimistically', async () => {
    (addPatientToFirestore as any).mockResolvedValueOnce('newDocId123');
    const store = makeStore();
    const newPatient = seed('placeholder');
    const { id: _, ...withoutId } = newPatient;
    await store.dispatch(addPatientThunk(withoutId));
    const list = store.getState().patients.patients;
    expect(list[0].id).toBe('newDocId123');
    expect(list[0].name).toBe(newPatient.name);
    expect(addPatientToFirestore).toHaveBeenCalledOnce();
  });

  it('rejected with permission error: returns user-friendly hint', async () => {
    (addPatientToFirestore as any).mockRejectedValueOnce(new Error('permission denied'));
    const store = makeStore();
    const { id: _, ...payload } = seed('x');
    await store.dispatch(addPatientThunk(payload));
    expect(store.getState().patients.addError).toMatch(/Firestore rules denied/);
  });

  it('clearAddError nulls the addError', () => {
    const store = makeStore();
    store.dispatch(clearAddError());
    expect(store.getState().patients.addError).toBeNull();
  });
});

describe('patientSlice — updatePatientThunk', () => {
  it('fulfilled: replaces the patient in state by id (and updates selectedPatient if matching)', async () => {
    (upsertPatientInFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();

    const original = seed('P001', { name: 'Original Name', status: 'active' });
    store.dispatch(mergeFirestorePatients([original]));
    store.dispatch(setSelectedPatient(original));

    const edited = { ...original, name: 'New Name', status: 'critical' as const };
    await store.dispatch(updatePatientThunk(edited));

    const updated = store.getState().patients.patients.find(p => p.id === 'P001');
    expect(updated?.name).toBe('New Name');
    expect(updated?.status).toBe('critical');
    expect(store.getState().patients.selectedPatient?.name).toBe('New Name');
    expect(upsertPatientInFirestore).toHaveBeenCalledOnce();
  });

  it('rejected: stores error', async () => {
    (upsertPatientInFirestore as any).mockRejectedValueOnce(new Error('Quota exceeded'));
    const store = makeStore();
    store.dispatch(mergeFirestorePatients([seed('P001')]));
    await store.dispatch(updatePatientThunk({ ...seed('P001'), name: 'X' }));
    expect(store.getState().patients.addError).toBe('Quota exceeded');
  });
});

describe('patientSlice — deletePatientsThunk', () => {
  it('optimistic: removes from state on pending', async () => {
    const store = makeStore();
    store.dispatch(mergeFirestorePatients([seed('P001'), seed('P002'), seed('P003')]));

    let resolveBatch: (v: void) => void = () => {};
    (deletePatientsFromFirestore as any).mockImplementationOnce(
      () => new Promise<void>(r => { resolveBatch = r; }),
    );
    const inFlight = store.dispatch(deletePatientsThunk(['P001', 'P002']));

    // Optimistic removal already applied by `pending`
    expect(store.getState().patients.patients.map(p => p.id)).toEqual(['P003']);

    resolveBatch();
    await inFlight;
  });

  it('writes seed deletions to localStorage so they don\'t reappear', async () => {
    (deletePatientsFromFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    store.dispatch(mergeFirestorePatients([seed('P001'), seed('AbC123')]));
    await store.dispatch(deletePatientsThunk(['P001', 'AbC123']));

    const persisted = JSON.parse(localStorage.getItem('medicore_deleted_seed_ids')!);
    expect(persisted).toContain('P001');
    expect(persisted).not.toContain('AbC123');     // Firestore IDs are not tombstoned
  });

  it('clears the deleted patient from selectedPatient if open', async () => {
    (deletePatientsFromFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    const p = seed('P005');
    store.dispatch(mergeFirestorePatients([p]));
    store.dispatch(setSelectedPatient(p));
    await store.dispatch(deletePatientsThunk(['P005']));
    expect(store.getState().patients.selectedPatient).toBeNull();
  });

  it('drops deleted ids from selection', async () => {
    (deletePatientsFromFirestore as any).mockResolvedValueOnce(undefined);
    const store = makeStore();
    store.dispatch(mergeFirestorePatients([seed('P001'), seed('P002')]));
    store.dispatch(selectAllPatients(['P001', 'P002']));
    await store.dispatch(deletePatientsThunk(['P001']));
    expect(store.getState().patients.selectedIds).toEqual(['P002']);
  });
});

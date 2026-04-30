import { describe, it, expect, vi, beforeEach } from 'vitest';

// We mock the Firebase layer at the module boundary so the service can be
// unit-tested without an actual Firestore connection.
const addDocMock = vi.fn();
const setDocMock = vi.fn();
const deleteDocMock = vi.fn();
const onSnapshotMock = vi.fn();
const writeBatchMock = vi.fn();
const docMock = vi.fn((...args: unknown[]) => ({ _path: args }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ _collection: true })),
  query: vi.fn((c: unknown) => c),
  serverTimestamp: vi.fn(() => '__server-ts__'),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  writeBatch: () => writeBatchMock(),
}));

vi.mock('./firebase', () => ({ db: { __mock: 'db' } }));

import {
  fetchPatientsAPI,
  addPatientToFirestore,
  upsertPatientInFirestore,
  deletePatientFromFirestore,
  deletePatientsFromFirestore,
  subscribeToFirestorePatients,
} from './patientService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchPatientsAPI — RandomUser → Patient mapping', () => {
  function mockUserResponse(users: any[]) {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: users, info: { seed: 'medicore', results: users.length, page: 1, version: '1.4' } }),
    })));
  }

  it('maps demographic fields directly', async () => {
    mockUserResponse([{
      gender: 'female',
      name: { first: 'Sarah', last: 'Mitchell' },
      email: 'sarah.m@example.com',
      phone: '555-0142',
      dob: { date: '1984-03-12T00:00:00Z', age: 42 },
      login: { uuid: 'uuid-1' },
      nat: 'US',
    }]);

    const out = await fetchPatientsAPI();
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Sarah Mitchell');
    expect(out[0].age).toBe(42);
    expect(out[0].gender).toBe('Female');
    expect(out[0].email).toBe('sarah.m@example.com');
    expect(out[0].phone).toBe('555-0142');
    expect(out[0].id).toBe('P001');                  // index-based ID
    expect(out[0].avatar).toBe('SM');
  });

  it('male users map to "Male"', async () => {
    mockUserResponse([{
      gender: 'male',
      name: { first: 'Robert', last: 'Chen' },
      email: 'r@x.com', phone: '555-1', dob: { date: '', age: 67 },
      login: { uuid: 'u' }, nat: 'US',
    }]);
    const out = await fetchPatientsAPI();
    expect(out[0].gender).toBe('Male');
  });

  it('derived clinical fields are filled in (department, status, doctor, room, vitals, bloodGroup)', async () => {
    mockUserResponse([{
      gender: 'female', name: { first: 'A', last: 'B' },
      email: 'a@b.com', phone: '5', dob: { date: '', age: 30 },
      login: { uuid: 'seed-test' }, nat: 'US',
    }]);
    const out = await fetchPatientsAPI();
    expect(out[0].department).toBeTruthy();
    expect(['active','critical','stable','pending','discharged']).toContain(out[0].status);
    expect(out[0].doctor).toMatch(/^Dr\. /);
    expect(out[0].room).toMatch(/-\d{2}$/);
    expect(out[0].vitals.heartRate).toBeGreaterThan(0);
    expect(out[0].vitals.oxygenSat).toBeGreaterThan(80);
    expect(['A+','A-','B+','B-','AB+','AB-','O+','O-']).toContain(out[0].bloodGroup);
  });

  it('throws when API returns non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    await expect(fetchPatientsAPI()).rejects.toThrow(/Random User API failed/);
  });

  it('returns at most 20 patients even if API yields more', async () => {
    const users = Array.from({ length: 30 }, (_, i) => ({
      gender: i % 2 ? 'male' : 'female',
      name: { first: 'F' + i, last: 'L' + i },
      email: `${i}@x.com`, phone: '5', dob: { date: '', age: 20 + i },
      login: { uuid: 'uid-' + i }, nat: 'US',
    }));
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: users, info: { seed: 's', results: 30, page: 1, version: '1' } }),
    })));
    const out = await fetchPatientsAPI();
    expect(out.length).toBe(20);
  });
});

describe('Firestore CRUD helpers', () => {
  it('addPatientToFirestore: returns the new doc id and stamps createdAt', async () => {
    addDocMock.mockResolvedValueOnce({ id: 'NEW_ID' });
    const id = await addPatientToFirestore({
      name: 'X', age: 1, gender: 'Male', bloodGroup: 'O+',
      department: 'General', status: 'active', doctor: 'Dr. T',
      admittedOn: '2026-04-22', diagnosis: 'd', room: 'GEN-01',
      vitals: { heartRate: 70, bloodPressure: '120/80', temperature: 36.7, oxygenSat: 98 },
      avatar: 'XX', phone: '+1', email: 'x@x.com',
    });
    expect(id).toBe('NEW_ID');
    const [_collectionArg, payload] = addDocMock.mock.calls[0];
    expect(payload.name).toBe('X');
    expect(payload.createdAt).toBe('__server-ts__');
  });

  it('upsertPatientInFirestore: setDoc with merge and updatedAt', async () => {
    setDocMock.mockResolvedValueOnce(undefined);
    await upsertPatientInFirestore('P001', {
      name: 'Y', age: 1, gender: 'Male', bloodGroup: 'O+',
      department: 'General', status: 'active', doctor: 'Dr. T',
      admittedOn: '2026-04-22', diagnosis: 'd', room: 'GEN-01',
      vitals: { heartRate: 70, bloodPressure: '120/80', temperature: 36.7, oxygenSat: 98 },
      avatar: 'YY', phone: '+1', email: 'y@x.com',
    });
    expect(setDocMock).toHaveBeenCalledOnce();
    const [_doc, payload, options] = setDocMock.mock.calls[0];
    expect(options).toEqual({ merge: true });
    expect(payload.updatedAt).toBe('__server-ts__');
    expect(payload.name).toBe('Y');
  });

  it('deletePatientFromFirestore: calls deleteDoc with the right doc ref', async () => {
    deleteDocMock.mockResolvedValueOnce(undefined);
    await deletePatientFromFirestore('P001');
    expect(deleteDocMock).toHaveBeenCalledOnce();
  });

  it('deletePatientsFromFirestore: short-circuits on empty input', async () => {
    await deletePatientsFromFirestore([]);
    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it('deletePatientsFromFirestore: batches multiple deletes and commits once', async () => {
    const commit = vi.fn();
    const del = vi.fn();
    writeBatchMock.mockReturnValue({ delete: del, commit });
    await deletePatientsFromFirestore(['P001', 'P002', 'P003']);
    expect(del).toHaveBeenCalledTimes(3);
    expect(commit).toHaveBeenCalledOnce();
  });
});

describe('subscribeToFirestorePatients', () => {
  it('passes mapped patient list to onUpdate when snapshot fires', () => {
    const onUpdate = vi.fn();
    const onError = vi.fn();
    onSnapshotMock.mockImplementation((_q, next, _err) => {
      next({
        docs: [
          { id: 'doc-1', data: () => ({
            name: 'Saved', age: 30, gender: 'Female', bloodGroup: 'A+',
            department: 'General', status: 'active', doctor: 'Dr. T',
            admittedOn: '2026-04-22', diagnosis: 'd', room: 'GEN-01',
            vitals: { heartRate: 70, bloodPressure: '120/80', temperature: 36.7, oxygenSat: 98 },
            avatar: 'SS', phone: '+1', email: 's@x.com',
          }) },
        ],
      });
      return () => {};
    });
    subscribeToFirestorePatients(onUpdate, onError);
    expect(onUpdate).toHaveBeenCalledOnce();
    const list = (onUpdate as any).mock.calls[0][0];
    expect(list[0].id).toBe('doc-1');
    expect(list[0].name).toBe('Saved');
  });
});

import type { Patient, BloodGroup, Department, PatientStatus, Vitals } from '@/types';
import {
  collection, addDoc, onSnapshot, query, serverTimestamp,
  doc, setDoc, deleteDoc, writeBatch, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

const PATIENTS_COLLECTION = 'patients';

/* ──────────────────────────────────────────────────────────────────────
 * Public API: Random User Generator
 *   https://randomuser.me/api/?results=20&seed=medicore
 *
 * Free, no auth, no API key, CORS-enabled, multi-cultural data.
 * Returns a `results[]` array of generated person records — we pull
 * the demographic fields (name, dob.age, gender, email, phone) and
 * derive clinical fields (department, status, doctor, diagnosis,
 * room, vitals, blood group) deterministically from each record's
 * stable login.uuid so the same person always maps to the same
 * patient across reloads. The `seed` query param keeps the 20
 * results identical across requests, which is required for our
 * edit/delete persistence to work.
 * ───────────────────────────────────────────────────────────────────── */

const RANDOM_USER_BASE = 'https://randomuser.me/api/';
// nat= requests diverse nationalities; inc= trims the response to fields we need.
const PATIENTS_API_URL =
  `${RANDOM_USER_BASE}?results=20&seed=medicore` +
  `&nat=us,gb,fr,de,br,in,au,ca,nz,es,no,nl,fi,dk,ch,ir,mx` +
  `&inc=gender,name,email,phone,dob,login,nat`;

interface RandomUser {
  gender: 'male' | 'female';
  name: { first: string; last: string };
  email: string;
  phone: string;
  dob: { date: string; age: number };
  login: { uuid: string };
  nat: string;
}
interface RandomUserResponse {
  results: RandomUser[];
  info: { seed: string; results: number; page: number; version: string };
}

const DEPARTMENTS: Department[] = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Oncology',
  'Pediatrics', 'Emergency', 'ICU', 'General',
];

const STATUSES: PatientStatus[] = ['active', 'critical', 'stable', 'pending', 'discharged'];

const DOCTORS = [
  'Dr. James Cooper', 'Dr. Priya Sharma', 'Dr. Mark Jensen', 'Dr. Nina Patel',
  'Dr. Lisa Wang', 'Dr. Carlos Rivera', 'Dr. Olivia Brooks', 'Dr. Daniel Park',
];

const DIAGNOSIS_BY_DEPT: Record<Department, string[]> = {
  Cardiology:  ['Acute Myocardial Infarction', 'Hypertensive Crisis', 'Atrial Fibrillation', 'Heart Failure'],
  Neurology:   ['Ischemic Stroke', 'Migraine', 'Multiple Sclerosis Relapse', 'Epilepsy'],
  Orthopedics: ['Femur Fracture', 'ACL Reconstruction', 'Spinal Disc Herniation', 'Hip Replacement'],
  Oncology:    ['Lung Carcinoma Stage II', 'Breast Cancer', 'Lymphoma', 'Chemotherapy Cycle 3'],
  Pediatrics:  ['Acute Appendicitis', 'Asthma Exacerbation', 'Bronchiolitis', 'Otitis Media'],
  Emergency:   ['Pulmonary Embolism', 'Sepsis', 'Trauma — MVA', 'Anaphylaxis'],
  ICU:         ['Septic Shock', 'Respiratory Failure', 'Post-Op Recovery', 'Multi-Organ Failure'],
  General:     ['Pneumonia', 'Diabetes Type 2', 'Cellulitis', 'Gastroenteritis'],
};

const ROOM_PREFIX: Record<Department, string> = {
  Cardiology: 'CARD', Neurology: 'NEU', Orthopedics: 'ORT', Oncology: 'ONC',
  Pediatrics: 'PED', Emergency: 'ER', ICU: 'ICU', General: 'GEN',
};

/** Cheap deterministic 0..1 generator from an integer seed. */
function rand01(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(rand01(seed) * arr.length)];
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** Stable numeric seed from a FHIR resource id (which may contain dashes/letters). */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function genVitals(seed: number, status: PatientStatus): Vitals {
  // Plausible ranges biased by clinical status
  const baseHR   = status === 'critical' ? 108 : status === 'pending' ? 92 : 72;
  const baseSpO2 = status === 'critical' ? 89  : status === 'pending' ? 95 : 98;
  const baseTemp = status === 'critical' ? 38.6 : status === 'pending' ? 37.4 : 36.8;
  const sysBase  = status === 'critical' ? 95 : status === 'stable' ? 118 : 130;

  return {
    heartRate:     Math.round(baseHR + rand01(seed)     * 18),
    oxygenSat:     Math.min(100, Math.round(baseSpO2 + rand01(seed + 4) * 4)),
    temperature:   +(baseTemp + rand01(seed + 3) * 0.6).toFixed(1),
    bloodPressure: `${Math.round(sysBase + rand01(seed + 1) * 25)}/${Math.round(72 + rand01(seed + 2) * 22)}`,
  };
}

function transformRandomUser(u: RandomUser, idx: number): Patient {
  const firstName = u.name.first;
  const lastName  = u.name.last;
  const fullName  = `${firstName} ${lastName}`;
  const seed      = seedFromId(u.login.uuid);

  // Domain ID — keep the P### convention so existing logic (deletedSeedIds
  // tombstones, etc.) stays intact across reloads.
  const id = `P${String(idx + 1).padStart(3, '0')}`;

  const department = pick(DEPARTMENTS, seed);
  const status     = pick(STATUSES, seed + 7);
  const doctor     = pick(DOCTORS, seed + 11);
  const diagnosis  = pick(DIAGNOSIS_BY_DEPT[department], seed + 17);
  const bloodGroup = pick(BLOOD_GROUPS, seed + 23);
  const room       = `${ROOM_PREFIX[department]}-${String((seed % 18) + 1).padStart(2, '0')}`;

  const daysAgo = seed % 30;
  const admittedDate = new Date();
  admittedDate.setDate(admittedDate.getDate() - daysAgo);

  return {
    id,
    name: fullName,
    age: u.dob.age,
    gender: u.gender === 'female' ? 'Female' : 'Male',
    bloodGroup,
    department, status, doctor,
    admittedOn: admittedDate.toISOString().split('T')[0],
    diagnosis, room,
    vitals: genVitals(seed, status),
    avatar: (firstName[0] + lastName[0]).toUpperCase(),
    phone: u.phone,
    email: u.email,
  };
}

export async function fetchPatientsAPI(): Promise<Patient[]> {
  const res = await fetch(PATIENTS_API_URL);
  if (!res.ok) throw new Error(`Random User API failed (${res.status})`);

  const data = (await res.json()) as RandomUserResponse;
  // Defensive cap at 20 even if the API ever returns more.
  return data.results.slice(0, 20).map((u, i) => transformRandomUser(u, i));
}

/* ── Firestore (Add / Update / Delete) ──────────────────────────────── */

export async function addPatientToFirestore(patient: Omit<Patient, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
    ...patient,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Upsert by id — creates the doc if missing (seed patients on first edit), merges fields otherwise. */
export async function upsertPatientInFirestore(id: string, patient: Omit<Patient, 'id'>): Promise<void> {
  await setDoc(
    doc(db, PATIENTS_COLLECTION, id),
    { ...patient, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deletePatientFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, PATIENTS_COLLECTION, id));
}

export async function deletePatientsFromFirestore(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  ids.forEach(id => batch.delete(doc(db, PATIENTS_COLLECTION, id)));
  await batch.commit();
}

export function subscribeToFirestorePatients(
  onUpdate: (patients: Patient[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  // No orderBy — `orderBy('createdAt')` would silently exclude any doc lacking
  // that field (e.g. seed patients edited via setDoc/merge, which only stamp updatedAt).
  const q = query(collection(db, PATIENTS_COLLECTION));
  return onSnapshot(
    q,
    snapshot => {
      const patients: Patient[] = snapshot.docs.map(d => {
        const { ...data } = d.data() as Omit<Patient, 'id'>;
        return { ...data, id: d.id };
      });
      onUpdate(patients);
    },
    err => onError?.(err),
  );
}

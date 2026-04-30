import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Patient, ViewMode, PatientStatus, Department } from '@/types';
import {
  fetchPatientsAPI, addPatientToFirestore,
  upsertPatientInFirestore, deletePatientsFromFirestore,
} from '@/services/patientService';

interface PatientFilters {
  search: string;
  status: PatientStatus | 'all';
  department: Department | 'all';
}

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  viewMode: ViewMode;
  filters: PatientFilters;
  loading: boolean;
  error: string | null;
  adding: boolean;
  addError: string | null;
  /** IDs of locally-deleted seed patients — keeps them out after a re-fetch. */
  deletedSeedIds: string[];
  /** IDs the user has check-marked for bulk operations. */
  selectedIds: string[];
}

const DELETED_SEEDS_KEY = 'medicore_deleted_seed_ids';

function loadDeletedSeedIds(): string[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_SEEDS_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDeletedSeedIds(ids: string[]): void {
  try { localStorage.setItem(DELETED_SEEDS_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

const initialState: PatientState = {
  patients: [],
  selectedPatient: null,
  viewMode: 'grid',
  filters: { search: '', status: 'all', department: 'all' },
  loading: false,
  error: null,
  adding: false,
  addError: null,
  deletedSeedIds: loadDeletedSeedIds(),
  selectedIds: [],
};

export const fetchPatients = createAsyncThunk<Patient[], void>(
  'patients/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPatientsAPI();
    } catch (err) {
      return rejectWithValue((err as Error).message ?? 'Failed to fetch patients');
    }
  },
);

export const addPatientThunk = createAsyncThunk<Patient, Omit<Patient, 'id'>>(
  'patients/add',
  async (patient, { rejectWithValue }) => {
    try {
      const id = await addPatientToFirestore(patient);
      return { ...patient, id } as Patient;
    } catch (err) {
      const msg = (err as Error).message ?? 'Failed to add patient';
      return rejectWithValue(
        msg.includes('permission')
          ? 'Firestore rules denied this write. In Firebase Console → Firestore → Rules, set test mode.'
          : msg,
      );
    }
  },
);

export const updatePatientThunk = createAsyncThunk<Patient, Patient>(
  'patients/update',
  async (patient, { rejectWithValue }) => {
    try {
      const { id, ...rest } = patient;
      await upsertPatientInFirestore(id, rest);
      return patient;
    } catch (err) {
      return rejectWithValue((err as Error).message ?? 'Failed to update patient');
    }
  },
);

export const deletePatientsThunk = createAsyncThunk<string[], string[]>(
  'patients/delete',
  async (ids, { rejectWithValue }) => {
    try {
      await deletePatientsFromFirestore(ids);
      return ids;
    } catch (err) {
      return rejectWithValue((err as Error).message ?? 'Failed to delete');
    }
  },
);

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    setSelectedPatient(state, action: PayloadAction<Patient | null>) {
      state.selectedPatient = action.payload;
    },
    setSearchFilter(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<PatientStatus | 'all'>) {
      state.filters.status = action.payload;
    },
    setDepartmentFilter(state, action: PayloadAction<Department | 'all'>) {
      state.filters.department = action.payload;
    },
    clearFilters(state) {
      state.filters = { search: '', status: 'all', department: 'all' };
    },
    clearAddError(state) {
      state.addError = null;
    },
    mergeFirestorePatients(state, action: PayloadAction<Patient[]>) {
      const existingIds = new Set(state.patients.map(p => p.id));
      const incoming = action.payload.filter(p => !existingIds.has(p.id) && !state.deletedSeedIds.includes(p.id));
      state.patients = [...incoming, ...state.patients];
    },

    // ── selection ────────────────────────────────────────────────
    togglePatientSelection(state, action: PayloadAction<string>) {
      const id = action.payload;
      const i = state.selectedIds.indexOf(id);
      if (i >= 0) state.selectedIds.splice(i, 1);
      else state.selectedIds.push(id);
    },
    selectAllPatients(state, action: PayloadAction<string[]>) {
      state.selectedIds = action.payload;
    },
    clearSelection(state) {
      state.selectedIds = [];
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchPatients.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        // MERGE seeds with whatever's already in state (e.g. Firestore patients
        // pushed by the live listener if it fired first). Replacing wholesale
        // would wipe Firestore-persisted patients on every refresh.
        const existingIds = new Set(state.patients.map(p => p.id));
        const newSeeds = action.payload.filter(
          p => !existingIds.has(p.id) && !state.deletedSeedIds.includes(p.id),
        );
        state.patients = [...state.patients, ...newSeeds];
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? 'Unknown error';
      })

      .addCase(addPatientThunk.pending, state => {
        state.adding = true;
        state.addError = null;
      })
      .addCase(addPatientThunk.fulfilled, (state, action) => {
        state.adding = false;
        if (!state.patients.some(p => p.id === action.payload.id)) {
          state.patients = [action.payload, ...state.patients];
        }
      })
      .addCase(addPatientThunk.rejected, (state, action) => {
        state.adding = false;
        state.addError = (action.payload as string) ?? 'Failed to add patient';
      })

      .addCase(updatePatientThunk.pending, state => {
        state.adding = true;
        state.addError = null;
      })
      .addCase(updatePatientThunk.fulfilled, (state, action) => {
        state.adding = false;
        const idx = state.patients.findIndex(p => p.id === action.payload.id);
        if (idx >= 0) state.patients[idx] = action.payload;
        if (state.selectedPatient?.id === action.payload.id) state.selectedPatient = action.payload;
      })
      .addCase(updatePatientThunk.rejected, (state, action) => {
        state.adding = false;
        state.addError = (action.payload as string) ?? 'Failed to update patient';
      })

      .addCase(deletePatientsThunk.pending, (state, action) => {
        // Optimistic: drop them from the list immediately
        const ids = new Set(action.meta.arg);
        state.patients = state.patients.filter(p => !ids.has(p.id));
        // If any are seed patients (P###), remember their deletion so re-fetch doesn't bring them back
        const seedDeleted = action.meta.arg.filter(id => /^P\d{3}$/.test(id));
        if (seedDeleted.length > 0) {
          state.deletedSeedIds = Array.from(new Set([...state.deletedSeedIds, ...seedDeleted]));
          saveDeletedSeedIds(state.deletedSeedIds);
        }
        if (state.selectedPatient && ids.has(state.selectedPatient.id)) {
          state.selectedPatient = null;
        }
        state.selectedIds = state.selectedIds.filter(id => !ids.has(id));
      })
      .addCase(deletePatientsThunk.rejected, (state, action) => {
        state.addError = (action.payload as string) ?? 'Failed to delete';
      });
  },
});

export const {
  setViewMode, setSelectedPatient, setSearchFilter,
  setStatusFilter, setDepartmentFilter, clearFilters,
  clearAddError, mergeFirestorePatients,
  togglePatientSelection, selectAllPatients, clearSelection,
} = patientSlice.actions;
export default patientSlice.reducer;

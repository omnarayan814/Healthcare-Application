import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, AlertCircle, CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addPatientThunk, updatePatientThunk, clearAddError } from '@/store/slices/patientSlice';
import type { Patient, BloodGroup, Department, PatientStatus } from '@/types';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DEPARTMENTS: Department[] = ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 'Emergency', 'ICU', 'General'];
const STATUSES: PatientStatus[] = ['active', 'critical', 'stable', 'pending', 'discharged'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface FormState {
  name: string;
  age: string;
  gender: 'Male' | 'Female';
  bloodGroup: BloodGroup;
  department: Department;
  status: PatientStatus;
  doctor: string;
  diagnosis: string;
  room: string;
  phone: string;
  email: string;
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  oxygenSat: string;
}

const EMPTY_FORM: FormState = {
  name: '', age: '', gender: 'Male', bloodGroup: 'O+', department: 'General', status: 'active',
  doctor: '', diagnosis: '', room: '', phone: '', email: '',
  heartRate: '', bloodPressure: '', temperature: '', oxygenSat: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided, modal switches to Edit mode and pre-fills the form. */
  editingPatient?: Patient | null;
}

function patientToForm(p: Patient): FormState {
  return {
    name: p.name, age: String(p.age), gender: p.gender, bloodGroup: p.bloodGroup,
    department: p.department, status: p.status, doctor: p.doctor,
    diagnosis: p.diagnosis, room: p.room, phone: p.phone, email: p.email,
    heartRate: String(p.vitals.heartRate),
    bloodPressure: p.vitals.bloodPressure,
    temperature: String(p.vitals.temperature),
    oxygenSat: String(p.vitals.oxygenSat),
  };
}

export default function AddPatientModal({ open, onClose, editingPatient }: Props) {
  const dispatch = useAppDispatch();
  const { adding, addError } = useAppSelector(s => s.patients);
  const isEdit = !!editingPatient;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setSuccess(false);
      dispatch(clearAddError());
      return;
    }
    setForm(editingPatient ? patientToForm(editingPatient) : EMPTY_FORM);
    setErrors({});
    setSuccess(false);
    dispatch(clearAddError());
  }, [open, editingPatient, dispatch]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => { const next = { ...e }; delete next[key]; return next; });
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.age || isNaN(+form.age) || +form.age < 0 || +form.age > 130) errs.age = 'Enter age 0–130';
    if (!form.doctor.trim()) errs.doctor = 'Required';
    if (!form.diagnosis.trim()) errs.diagnosis = 'Required';
    if (!form.room.trim()) errs.room = 'Required';
    if (!form.phone.trim()) errs.phone = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.heartRate || isNaN(+form.heartRate)) errs.heartRate = 'Required';
    if (!form.bloodPressure.trim()) errs.bloodPressure = 'e.g. 120/80';
    else if (!/^\d{2,3}\/\d{2,3}$/.test(form.bloodPressure)) errs.bloodPressure = 'Format: 120/80';
    if (!form.temperature || isNaN(+form.temperature)) errs.temperature = 'Required';
    if (!form.oxygenSat || isNaN(+form.oxygenSat) || +form.oxygenSat < 0 || +form.oxygenSat > 100) errs.oxygenSat = '0–100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const base: Omit<Patient, 'id'> = {
      name: form.name.trim(),
      age: +form.age,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      department: form.department,
      status: form.status,
      doctor: form.doctor.trim(),
      admittedOn: editingPatient?.admittedOn ?? new Date().toISOString().split('T')[0],
      diagnosis: form.diagnosis.trim(),
      room: form.room.trim(),
      vitals: {
        heartRate: +form.heartRate,
        bloodPressure: form.bloodPressure.trim(),
        temperature: +form.temperature,
        oxygenSat: +form.oxygenSat,
      },
      avatar: getInitials(form.name),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };

    if (isEdit && editingPatient) {
      const result = await dispatch(updatePatientThunk({ ...base, id: editingPatient.id }));
      if (updatePatientThunk.fulfilled.match(result)) {
        setSuccess(true);
        setTimeout(() => onClose(), 900);
      }
    } else {
      const result = await dispatch(addPatientThunk(base));
      if (addPatientThunk.fulfilled.match(result)) {
        setSuccess(true);
        setTimeout(() => onClose(), 1100);
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)', zIndex: 100,
            }}
          />

          {/* Modal — outer flex wrapper handles centering, inner motion handles animation */}
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 101,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, pointerEvents: 'none',
            }}
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(160deg, #0e0e1c 0%, #0a0a14 100%)',
              border: '1px solid rgba(99,102,241,0.18)', borderRadius: 18,
              boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.1)',
              pointerEvents: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 26px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'linear-gradient(180deg, rgba(14,14,28,0.95), rgba(14,14,28,0.85))',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isEdit ? <Pencil size={17} color="white" /> : <UserPlus size={18} color="white" />}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                    {isEdit ? 'Edit Patient' : 'Add New Patient'}
                  </h2>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0' }}>
                    {isEdit ? `${editingPatient?.id} · changes save to Firestore` : 'Saved to Firestore · syncs in real-time'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', color: '#64748b', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} noValidate style={{ padding: '22px 26px' }}>
              <AnimatePresence>
                {addError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '11px 13px', borderRadius: 10, marginBottom: 16,
                      background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.22)',
                      color: '#fb7185', fontSize: 12.5, lineHeight: 1.5,
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{addError}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 13px', borderRadius: 10, marginBottom: 16,
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)',
                      color: '#34d399', fontSize: 12.5,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {isEdit ? 'Changes saved — closing…' : 'Patient added successfully — closing…'}
                  </motion.div>
                )}
              </AnimatePresence>

              <SectionTitle>Identity</SectionTitle>
              <Row>
                <Field label="Full Name" error={errors.name} flex={2}>
                  <input className={`input-field ${errors.name ? 'error' : ''}`}
                    value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Doe" />
                </Field>
                <Field label="Age" error={errors.age}>
                  <input className={`input-field ${errors.age ? 'error' : ''}`} type="number"
                    value={form.age} onChange={e => update('age', e.target.value)} placeholder="42" />
                </Field>
              </Row>

              <Row>
                <Field label="Gender">
                  <select className="input-field" value={form.gender}
                    onChange={e => update('gender', e.target.value as 'Male' | 'Female')}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select className="input-field" value={form.bloodGroup}
                    onChange={e => update('bloodGroup', e.target.value as BloodGroup)}>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="input-field" value={form.status}
                    onChange={e => update('status', e.target.value as PatientStatus)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </Field>
              </Row>

              <SectionTitle>Clinical</SectionTitle>
              <Row>
                <Field label="Department">
                  <select className="input-field" value={form.department}
                    onChange={e => update('department', e.target.value as Department)}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Room" error={errors.room}>
                  <input className={`input-field ${errors.room ? 'error' : ''}`}
                    value={form.room} onChange={e => update('room', e.target.value)} placeholder="ICU-04" />
                </Field>
              </Row>

              <Row>
                <Field label="Attending Doctor" error={errors.doctor} flex={2}>
                  <input className={`input-field ${errors.doctor ? 'error' : ''}`}
                    value={form.doctor} onChange={e => update('doctor', e.target.value)} placeholder="Dr. Jane Smith" />
                </Field>
              </Row>
              <Row>
                <Field label="Diagnosis" error={errors.diagnosis} flex={2}>
                  <input className={`input-field ${errors.diagnosis ? 'error' : ''}`}
                    value={form.diagnosis} onChange={e => update('diagnosis', e.target.value)} placeholder="Acute Bronchitis" />
                </Field>
              </Row>

              <SectionTitle>Vitals</SectionTitle>
              <Row>
                <Field label="Heart Rate (bpm)" error={errors.heartRate}>
                  <input className={`input-field ${errors.heartRate ? 'error' : ''}`} type="number"
                    value={form.heartRate} onChange={e => update('heartRate', e.target.value)} placeholder="72" />
                </Field>
                <Field label="Blood Pressure" error={errors.bloodPressure}>
                  <input className={`input-field ${errors.bloodPressure ? 'error' : ''}`}
                    value={form.bloodPressure} onChange={e => update('bloodPressure', e.target.value)} placeholder="120/80" />
                </Field>
              </Row>
              <Row>
                <Field label="Temperature (°C)" error={errors.temperature}>
                  <input className={`input-field ${errors.temperature ? 'error' : ''}`} type="number" step="0.1"
                    value={form.temperature} onChange={e => update('temperature', e.target.value)} placeholder="36.8" />
                </Field>
                <Field label="Oxygen Sat (%)" error={errors.oxygenSat}>
                  <input className={`input-field ${errors.oxygenSat ? 'error' : ''}`} type="number"
                    value={form.oxygenSat} onChange={e => update('oxygenSat', e.target.value)} placeholder="98" />
                </Field>
              </Row>

              <SectionTitle>Contact</SectionTitle>
              <Row>
                <Field label="Phone" error={errors.phone}>
                  <input className={`input-field ${errors.phone ? 'error' : ''}`}
                    value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1-555-0142" />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input className={`input-field ${errors.email ? 'error' : ''}`} type="email"
                    value={form.email} onChange={e => update('email', e.target.value)} placeholder="patient@email.com" />
                </Field>
              </Row>

              {/* Footer */}
              <div style={{
                display: 'flex', gap: 10, justifyContent: 'flex-end',
                paddingTop: 18, marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <button type="button" onClick={onClose} className="btn-ghost"
                  style={{ height: 42, padding: '0 18px', fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit" disabled={adding || success} className="btn-primary"
                  style={{ height: 42, padding: '0 22px', fontSize: 13.5, minWidth: 150 }}>
                  {adding ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                      Saving…
                    </span>
                  ) : success ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={15} /> {isEdit ? 'Saved' : 'Added'}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isEdit ? <><Pencil size={14} /> Save Changes</> : <><UserPlus size={15} /> Add Patient</>}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── tiny presentational helpers ─────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 700, color: '#6366f1',
      letterSpacing: '0.14em', textTransform: 'uppercase',
      marginTop: 18, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, error, flex = 1, children }: { label: string; error?: string; flex?: number; children: React.ReactNode }) {
  return (
    <div style={{ flex, minWidth: 140 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: 10.5, color: '#f43f5e', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

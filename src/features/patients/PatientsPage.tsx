import './styles/PatientsPage.css';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, Search, Filter, X, Heart, Activity, Thermometer,
  Droplets, Phone, Mail, Building, Calendar, UserPlus, Pencil, Trash2, Check,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setViewMode, setSelectedPatient, setSearchFilter,
  setStatusFilter, setDepartmentFilter, clearFilters,
  togglePatientSelection, selectAllPatients, clearSelection,
  deletePatientsThunk,
} from '@/store/slices/patientSlice';
import AddPatientModal from './AddPatientModal';
import { getInitialsBg, getStatusColor, formatDate } from '@/utils/formatters';
import type { Patient, PatientStatus, Department } from '@/types';

const STATUS_OPTIONS: PatientStatus[] = ['active', 'critical', 'stable', 'pending', 'discharged'];
const DEPT_OPTIONS: Department[] = ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 'Emergency', 'ICU', 'General'];

function PatientCard({
  patient, onClick, selected, onToggleSelect, anySelected,
}: {
  patient: Patient;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  anySelected: boolean;
}) {
  const statusColor = getStatusColor(patient.status);

  return (
    <motion.div
      className={`glass-card patient-card`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring' as const, stiffness: 380, damping: 26 }}
      onClick={() => {
        if (anySelected) onToggleSelect();
        else onClick();
      }}
      style={{
        padding: '18px 18px 16px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        outline: selected ? `2px solid var(--accent-primary)` : undefined,
        outlineOffset: selected ? -2 : undefined,
      }}
    >
      {/* Selection checkbox */}
      <button
        type="button"
        aria-label={selected ? 'Deselect patient' : 'Select patient'}
        onClick={e => { e.stopPropagation(); onToggleSelect(); }}
        className="patient-card-checkbox"
        style={{
          border: selected ? `2px solid var(--accent-primary)` : '1.5px solid var(--border-subtle)',
          background: selected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          opacity: selected || anySelected ? 1 : 0,
        }}
      >
        {selected && <Check size={12} color="white" strokeWidth={3} />}
      </button>

      {/* Header — avatar, name, status */}
      <div className="patient-card-header">
        <div
          className="avatar"
          style={{
            background: getInitialsBg(patient.name),
            width: 40, height: 40, fontSize: 13, flexShrink: 0,
          }}
        >
          {patient.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="patient-card-name">
            {patient.name}
          </div>
          <div className="patient-card-meta">
            {patient.id} · {patient.age}y · {patient.gender}
          </div>
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '3px 9px', borderRadius: 12,
            background: `${statusColor}1A`,
            color: statusColor,
            border: `1px solid ${statusColor}33`,
            flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor }} />
          {patient.status}
        </span>
      </div>

      {/* Diagnosis — primary clinical info */}
      <div className="patient-card-diagnosis">
        {patient.diagnosis}
      </div>

      {/* Footer — department · room  +  blood group */}
      <div className="patient-card-footer">
        <div className="patient-card-dept">
          {patient.department} · {patient.room}
        </div>
        <span className="patient-card-blood">
          {patient.bloodGroup}
        </span>
      </div>
    </motion.div>
  );
}

function PatientListRow({
  patient, onClick, selected, onToggleSelect, anySelected,
}: {
  patient: Patient;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  anySelected: boolean;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => { if (anySelected) onToggleSelect(); else onClick(); }}
      style={{
        cursor: 'pointer',
        background: selected ? 'rgba(99,102,241,0.08)' : undefined,
      }}
    >
      <td style={{ width: 36, paddingRight: 0 }} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          aria-label={selected ? 'Deselect' : 'Select'}
          onClick={onToggleSelect}
          className="patient-list-checkbox"
          style={{
            border: selected ? '2px solid #818cf8' : '1.5px solid rgba(255,255,255,0.18)',
            background: selected ? '#6366f1' : 'transparent',
          }}
        >
          {selected && <Check size={12} color="white" strokeWidth={3} />}
        </button>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ background: getInitialsBg(patient.name), fontSize: 12 }}>{patient.avatar}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{patient.name}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{patient.age}y · {patient.gender} · {patient.bloodGroup}</div>
          </div>
        </div>
      </td>
      <td style={{ fontSize: 12.5 }}>{patient.department}</td>
      <td>
        <span className={`badge badge-${patient.status}`}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: getStatusColor(patient.status), flexShrink: 0 }} />
          {patient.status}
        </span>
      </td>
      <td style={{ fontSize: 12.5, color: '#94a3b8' }}>{patient.doctor}</td>
      <td style={{ fontSize: 12, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.diagnosis}</td>
      <td>
        <div style={{ fontSize: 11.5, display: 'flex', gap: 8 }}>
          <span style={{ color: '#f43f5e' }}>♥ {patient.vitals.heartRate}</span>
          <span style={{ color: '#22d3ee' }}>O₂ {patient.vitals.oxygenSat}%</span>
          <span style={{ color: '#f59e0b' }}>{patient.vitals.temperature}°C</span>
        </div>
      </td>
      <td style={{ fontSize: 12 }}>{formatDate(patient.admittedOn)}</td>
    </motion.tr>
  );
}

function PatientDetailModal({
  patient, onClose, onEdit, onDelete,
}: {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusColor = getStatusColor(patient.status);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="patient-detail-overlay"
    >
      <motion.div
        initial={{ scale: 0.94, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 24 }}
        transition={{ type: 'spring' as const, stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="patient-detail-modal"
      >
        {/* Header */}
        <div className="patient-detail-header">
          <div className="patient-detail-avatar-wrap">
            <div className="avatar" style={{ background: getInitialsBg(patient.name), width: 52, height: 52, fontSize: 16 }}>
              {patient.avatar}
            </div>
            <div className="patient-detail-status-dot" style={{ background: statusColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="patient-detail-name">{patient.name}</div>
            <div className="patient-detail-meta">{patient.id} · {patient.age}y · {patient.gender} · {patient.bloodGroup}</div>
          </div>
          <span className={`badge badge-${patient.status}`} style={{ fontSize: 12 }}>
            <span className="status-dot" style={{ background: statusColor }} />
            {patient.status}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onEdit} aria-label="Edit patient" title="Edit patient" className="patient-edit-btn">
              <Pencil size={14} />
            </button>
            <button onClick={onDelete} aria-label="Delete patient" title="Delete patient" className="patient-delete-btn">
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} aria-label="Close" className="patient-close-btn">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="patient-detail-body">
          {/* Diagnosis */}
          <div className="patient-diagnosis-block">
            <div className="patient-diagnosis-label">Primary Diagnosis</div>
            <div className="patient-diagnosis-value">{patient.diagnosis}</div>
          </div>

          {/* Vitals grid */}
          <div>
            <div className="patient-vitals-label">Vitals</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { icon: Heart,       label: 'Heart Rate',    value: `${patient.vitals.heartRate}`,    unit: 'bpm',  color: '#f43f5e' },
                { icon: Activity,    label: 'Oxygen Sat.',   value: `${patient.vitals.oxygenSat}`,    unit: '%',    color: '#22d3ee' },
                { icon: Thermometer, label: 'Temperature',   value: `${patient.vitals.temperature}`,  unit: '°C',   color: '#f59e0b' },
                { icon: Droplets,    label: 'Blood Pressure',value: patient.vitals.bloodPressure,     unit: 'mmHg', color: '#6366f1' },
              ].map(({ icon: Icon, label, value, unit, color }) => (
                <div key={label} className="patient-vital-cell" style={{ background: `${color}0A`, border: `1px solid ${color}22` }}>
                  <Icon size={16} color={color} style={{ marginBottom: 8 }} />
                  <div className="patient-vital-value">{value}</div>
                  <div className="patient-vital-unit">{unit}</div>
                  <div className="patient-vital-name">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient info */}
          <div>
            <div className="patient-info-label">Patient Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {[
                { icon: Building,  label: 'Department',      value: patient.department },
                { icon: Building,  label: 'Room',            value: patient.room },
                { icon: Activity,  label: 'Attending Doctor',value: patient.doctor },
                { icon: Calendar,  label: 'Admitted On',     value: formatDate(patient.admittedOn) },
                { icon: Phone,     label: 'Phone',           value: patient.phone },
                { icon: Mail,      label: 'Email',           value: patient.email },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="patient-info-cell">
                  <div className="patient-info-cell-header">
                    <Icon size={11} color="#475569" />
                    <span className="patient-info-cell-label">{label}</span>
                  </div>
                  <div className="patient-info-cell-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PatientCardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, borderRadius: 6, marginBottom: 8, width: '60%' }} />
          <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '40%' }} />
        </div>
        <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 20 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
      </div>
      <div className="skeleton" style={{ height: 11, borderRadius: 6, marginBottom: 14, width: '80%' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 50, borderRadius: 9 }} />)}
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const dispatch = useAppDispatch();
  const { patients, viewMode, filters, selectedPatient, loading, selectedIds } = useAppSelector(s => s.patients);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const anySelected = selectedIds.length > 0;

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase();
    return patients.filter(p => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search) ||
        p.diagnosis.toLowerCase().includes(search) ||
        p.doctor.toLowerCase().includes(search) ||
        p.id.toLowerCase().includes(search);
      const matchStatus = filters.status === 'all' || p.status === filters.status;
      const matchDept = filters.department === 'all' || p.department === filters.department;
      return matchSearch && matchStatus && matchDept;
    });
  }, [patients, filters.search, filters.status, filters.department]);

  const hasActiveFilters = filters.status !== 'all' || filters.department !== 'all';

  return (
    <div className="patients-page">

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 220 }}>
          <Search size={15} className="search-icon" />
          <input
            className="input-field"
            placeholder="Search by name, ID, diagnosis, doctor..."
            value={filters.search}
            onChange={e => dispatch(setSearchFilter(e.target.value))}
            style={{ height: 40, fontSize: 13 }}
          />
        </div>

        <button
          className="btn-ghost"
          onClick={() => setShowFilters(s => !s)}
          style={{
            height: 40, fontSize: 13,
            background: showFilters ? 'rgba(99,102,241,0.1)' : undefined,
            borderColor: showFilters ? 'rgba(99,102,241,0.35)' : undefined,
            color: showFilters ? '#818cf8' : undefined,
          }}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
          )}
        </button>

        <div className="toggle-switch">
          <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => dispatch(setViewMode('grid'))}>
            <LayoutGrid size={14} /> Grid
          </button>
          <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => dispatch(setViewMode('list'))}>
            <List size={14} /> List
          </button>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ height: 40, padding: '0 16px', fontSize: 13, gap: 6 }}
        >
          <UserPlus size={14} />
          Add Patient
        </button>

        {/* Selection-aware status area:
            • idle  → shows "X / Y" patient count
            • active → shows "N selected · Select All · Clear · Delete"  */}
        <AnimatePresence mode="wait" initial={false}>
          {anySelected ? (
            <motion.div
              key="sel"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}
            >
              <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => dispatch(selectAllPatients(filtered.map(p => p.id)))}
                disabled={selectedIds.length === filtered.length && filtered.length > 0}
                className="btn-ghost"
                style={{ height: 30, padding: '0 10px', fontSize: 11.5 }}
              >
                Select all ({filtered.length})
              </button>
              <button
                onClick={() => dispatch(clearSelection())}
                className="btn-ghost"
                style={{ height: 30, padding: '0 10px', fontSize: 11.5 }}
              >
                Clear
              </button>
              <button
                onClick={() => setConfirmDeleteIds(selectedIds)}
                className="patients-delete-selection-btn"
              >
                <Trash2 size={12} />
                Delete {selectedIds.length}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="count"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ fontSize: 12, color: '#475569', padding: '0 4px', whiteSpace: 'nowrap' }}
            >
              {loading
                ? <span>Loading…</span>
                : <><span style={{ color: '#818cf8', fontWeight: 600 }}>{filtered.length}</span> / {patients.length}</>
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass-card filter-panel" style={{ padding: '18px 22px', display: 'flex', gap: 24, flexWrap: 'wrap', position: 'relative' }}>
              {/* Clear-filters action — only when at least one filter is active */}
              <AnimatePresence>
                {(hasActiveFilters || filters.search) && (
                  <motion.button
                    key="clear-filters"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => dispatch(clearFilters())}
                    className="filter-clear-btn"
                  >
                    <X size={12} />
                    Clear filters
                  </motion.button>
                )}
              </AnimatePresence>

              <div>
                <div className="patients-filter-label">Status</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(s => {
                    const active = filters.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => dispatch(setStatusFilter(active ? 'all' : s))}
                        className={`filter-status-btn${active ? ' active' : ''}`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="patients-filter-label">Department</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DEPT_OPTIONS.map(d => {
                    const active = filters.department === d;
                    return (
                      <button
                        key={d}
                        onClick={() => dispatch(setDepartmentFilter(active ? 'all' : d))}
                        className={`filter-dept-btn${active ? ' active' : ''}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient grid */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}
          >
            {loading
              ? Array.from({ length: 8 }, (_, i) => <PatientCardSkeleton key={i} />)
              : filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <PatientCard
                    patient={p}
                    onClick={() => dispatch(setSelectedPatient(p))}
                    selected={selectedSet.has(p.id)}
                    onToggleSelect={() => dispatch(togglePatientSelection(p.id))}
                    anySelected={anySelected}
                  />
                </motion.div>
              ))
            }
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card"
            style={{ overflow: 'hidden' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 36, paddingRight: 0 }}>
                      <button
                        type="button"
                        aria-label={
                          selectedIds.length === filtered.length && filtered.length > 0
                            ? 'Clear selection' : 'Select all on page'
                        }
                        onClick={() => {
                          if (selectedIds.length === filtered.length && filtered.length > 0) {
                            dispatch(clearSelection());
                          } else {
                            dispatch(selectAllPatients(filtered.map(p => p.id)));
                          }
                        }}
                        style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: selectedIds.length === filtered.length && filtered.length > 0
                            ? '2px solid #818cf8' : '1.5px solid rgba(255,255,255,0.18)',
                          background: selectedIds.length === filtered.length && filtered.length > 0
                            ? '#6366f1' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        {selectedIds.length === filtered.length && filtered.length > 0 && (
                          <Check size={11} color="white" strokeWidth={3} />
                        )}
                      </button>
                    </th>
                    <th>Patient</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Doctor</th>
                    <th>Diagnosis</th>
                    <th>Vitals</th>
                    <th>Admitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <PatientListRow
                      key={p.id}
                      patient={p}
                      onClick={() => dispatch(setSelectedPatient(p))}
                      selected={selectedSet.has(p.id)}
                      onToggleSelect={() => dispatch(togglePatientSelection(p.id))}
                      anySelected={anySelected}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="patients-empty-state"
        >
          <Search size={36} style={{ marginBottom: 14, opacity: 0.25 }} />
          <p className="patients-empty-title">No patients found</p>
          <p className="patients-empty-hint">Try adjusting your search or filters</p>
        </motion.div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedPatient && (
          <PatientDetailModal
            patient={selectedPatient}
            onClose={() => dispatch(setSelectedPatient(null))}
            onEdit={() => {
              setEditingPatient(selectedPatient);
              dispatch(setSelectedPatient(null));
              setShowAddModal(true);
            }}
            onDelete={() => setConfirmDeleteIds([selectedPatient.id])}
          />
        )}
      </AnimatePresence>

      <AddPatientModal
        open={showAddModal}
        editingPatient={editingPatient}
        onClose={() => { setShowAddModal(false); setEditingPatient(null); }}
      />

      <ConfirmDeleteDialog
        ids={confirmDeleteIds}
        onCancel={() => setConfirmDeleteIds(null)}
        onConfirm={async () => {
          if (!confirmDeleteIds) return;
          await dispatch(deletePatientsThunk(confirmDeleteIds));
          setConfirmDeleteIds(null);
        }}
      />
    </div>
  );
}

/* ── Confirm-delete dialog ─────────────────────────────────────────── */

function ConfirmDeleteDialog({
  ids, onCancel, onConfirm,
}: {
  ids: string[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {ids && ids.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="confirm-delete-overlay"
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            role="alertdialog"
            className="confirm-delete-modal"
          >
            <div className="confirm-delete-header">
              <div className="confirm-delete-icon">
                <Trash2 size={17} color="#fb7185" />
              </div>
              <div>
                <h3 className="confirm-delete-title">
                  Delete {ids.length === 1 ? 'patient' : `${ids.length} patients`}?
                </h3>
                <p className="confirm-delete-subtitle">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="confirm-delete-actions">
              <button onClick={onCancel} className="btn-ghost"
                style={{ height: 38, padding: '0 16px', fontSize: 12.5 }}>
                Cancel
              </button>
              <button onClick={onConfirm} className="confirm-delete-btn">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

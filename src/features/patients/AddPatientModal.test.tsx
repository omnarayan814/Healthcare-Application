import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/services/patientService', () => ({
  addPatientToFirestore: vi.fn(async () => 'newId'),
  upsertPatientInFirestore: vi.fn(async () => undefined),
  fetchPatientsAPI: vi.fn(),
  deletePatientsFromFirestore: vi.fn(),
}));
vi.mock('@/services/firebase', () => ({
  loginWithEmail: vi.fn(), signUpWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(), logout: vi.fn(),
}));
vi.mock('@/services/notifications', () => ({ showLocalNotification: vi.fn() }));

import patientReducer from '@/store/slices/patientSlice';
import notifReducer from '@/store/slices/notificationSlice';
import uiReducer from '@/store/slices/uiSlice';
import authReducer from '@/store/slices/authSlice';
import AddPatientModal from './AddPatientModal';

function renderModal() {
  const store = configureStore({
    reducer: {
      patients: patientReducer, notifications: notifReducer,
      ui: uiReducer, auth: authReducer,
    },
  });
  const onClose = vi.fn();
  render(
    <Provider store={store}>
      <AddPatientModal open onClose={onClose} />
    </Provider>,
  );
  return { store, onClose };
}

beforeEach(() => { vi.clearAllMocks(); });

describe('AddPatientModal — form validation', () => {
  it('shows multiple inline errors when submitted empty', () => {
    renderModal();
    const submit = screen.getByRole('button', { name: /Add Patient/i });
    fireEvent.click(submit);

    // Several "Required" hints should appear
    const errors = screen.getAllByText(/^Required$/);
    expect(errors.length).toBeGreaterThan(3);
  });

  it('rejects an invalid blood-pressure format', async () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('John Doe'),         { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('42'),               { target: { value: '42' } });
    fireEvent.change(screen.getByPlaceholderText('Dr. Jane Smith'),   { target: { value: 'Dr. X' } });
    fireEvent.change(screen.getByPlaceholderText('Acute Bronchitis'), { target: { value: 'Diag' } });
    fireEvent.change(screen.getByPlaceholderText('ICU-04'),           { target: { value: 'GEN-01' } });
    fireEvent.change(screen.getByPlaceholderText('+1-555-0142'),      { target: { value: '+1' } });
    fireEvent.change(screen.getByPlaceholderText('patient@email.com'),{ target: { value: 't@x.com' } });
    fireEvent.change(screen.getByPlaceholderText('72'),               { target: { value: '70' } });
    fireEvent.change(screen.getByPlaceholderText('120/80'),           { target: { value: 'INVALID' } });
    fireEvent.change(screen.getByPlaceholderText('36.8'),             { target: { value: '36.8' } });
    fireEvent.change(screen.getByPlaceholderText('98'),               { target: { value: '98' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Patient/i }));
    expect(await screen.findByText(/Format: 120\/80/)).toBeInTheDocument();
  });

  it('rejects invalid email', async () => {
    renderModal();
    const emailInput = screen.getByPlaceholderText('patient@email.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    expect(emailInput.value).toBe('not-an-email');

    fireEvent.click(screen.getByRole('button', { name: /Add Patient/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('rejects out-of-range age', async () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('42'), { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Patient/i }));
    expect(await screen.findByText(/Enter age 0–130/)).toBeInTheDocument();
  });
});

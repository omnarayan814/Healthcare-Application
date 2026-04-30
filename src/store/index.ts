import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import patientReducer from './slices/patientSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import { notificationMiddleware } from './middleware/notificationMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientReducer,
    notifications: notificationReducer,
    ui: uiReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(notificationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

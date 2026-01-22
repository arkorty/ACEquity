import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import CTAReducer from './slices/CTASlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cta: CTAReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
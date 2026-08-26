import { configureStore } from '@reduxjs/toolkit';
import adminAuthReducer from './slices/authSlice';
import adminProductsReducer from './slices/productsSlice';

export const adminStore = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    adminProducts: adminProductsReducer,
  },
});

export type AdminRootState = ReturnType<typeof adminStore.getState>;
export type AdminAppDispatch = typeof adminStore.dispatch;

'use client';

import { Provider } from 'react-redux';
import { adminStore } from '../../redux/admin/store';

export function AdminReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={adminStore}>{children}</Provider>;
}

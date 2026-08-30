'use client';

import { Toast } from '@heroui/react';

export function StorefrontUiProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast.Provider placement="top end" width={360} maxVisibleToasts={3} />
    </>
  );
}

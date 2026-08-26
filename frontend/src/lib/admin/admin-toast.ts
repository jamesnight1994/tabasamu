import { Toast } from '@heroui/react';

export function showAdminSuccess(title: string, description?: string) {
  Toast.toast.success(title, description ? { description } : undefined);
}

export function showAdminError(title: string, description?: string) {
  Toast.toast.danger(title, description ? { description } : undefined);
}

export const ADMIN_API_PATHS = {
  login: '/custom_auth/login/user',
  profile: '/accounts/profile/',
  user: (id: string) => `/api/users/${id}/`,
  forgotPassword: '/api/accountRecovery/forgotPassword',
} as const;

export const ADMIN_ROUTES = {
  login: '/admin/login',
  forgotPassword: '/admin/forgot-password',
  dashboard: '/dashboard',
} as const;

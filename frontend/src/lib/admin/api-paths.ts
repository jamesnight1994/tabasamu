export const ADMIN_API_PATHS = {
  login: '/custom_auth/login/user',
  profile: '/accounts/profile/',
  user: (id: string) => `/api/users/${id}/`,
  forgotPassword: '/api/accountRecovery/forgotPassword',
  products: '/admin/products',
  product: (id: string) => `/admin/products/${id}`,
  productPublish: (id: string) => `/admin/products/${id}/publish`,
} as const;

export const ADMIN_ROUTES = {
  login: '/admin/login',
  forgotPassword: '/admin/forgot-password',
  dashboard: '/dashboard',
} as const;

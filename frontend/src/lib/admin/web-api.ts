import axios from 'axios';
import { AdminApiError } from './admin-api-error';
import { adminAuthClient } from './auth-client';
import { ADMIN_API_PATHS } from './api-paths';
import {
  getDevBypassApiKey,
  isActiveDevBypassSession,
  isDevBypassSession,
} from './dev-auth-bypass';
import {
  extractApiErrorMessage,
  isAuthExpiredError,
  looksLikeAuthFailureMessage,
} from './extract-api-error';

const serverUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const authServerUrl = process.env.NEXT_PUBLIC_ADMIN_AUTH_URL ?? serverUrl;

export const AUTH_SESSION_EXPIRED_EVENT = 'admin:auth:session-expired';

export const axiosApi = axios.create({ baseURL: serverUrl, timeout: 15_000 });
export const authAxiosApi = axios.create({ baseURL: authServerUrl, timeout: 15_000 });

let isRedirectingToLogin = false;

export const resetAuthRedirectState = () => {
  isRedirectingToLogin = false;
};

const clearBearerHeaders = () => {
  delete axiosApi.defaults.headers.common.Authorization;
  delete authAxiosApi.defaults.headers.common.Authorization;
};

const clearAdminApiKeyHeader = () => {
  delete axiosApi.defaults.headers.common['X-Admin-Api-Key'];
};

const configBearerHeader = () => {
  const token = adminAuthClient.getAuthToken();
  if (!token || isDevBypassSession(token)) return;
  const header = `Bearer ${token}`;
  axiosApi.defaults.headers.common.Authorization = header;
  authAxiosApi.defaults.headers.common.Authorization = header;
};

export const applyAuthHeaders = () => {
  if (isActiveDevBypassSession(adminAuthClient.getAuthToken())) {
    clearBearerHeaders();
    const key = getDevBypassApiKey();
    clearAdminApiKeyHeader();
    if (key) {
      axiosApi.defaults.headers.common['X-Admin-Api-Key'] = key;
    }
    return;
  }

  clearAdminApiKeyHeader();
  configBearerHeader();
};

export const clearAuthHeaders = () => {
  clearBearerHeaders();
  clearAdminApiKeyHeader();
};

const reauthorize = () => {
  adminAuthClient.signOut();
  clearAuthHeaders();

  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));

  const pathname = window.location.pathname;
  const isAuthPage =
    pathname === '/admin/login' || pathname.startsWith('/admin/forgot-password');

  // Already on a public auth page — clear storage only; avoid reload loops that
  // leave the login bootstrap overlay stuck.
  if (isAuthPage) {
    resetAuthRedirectState();
    return;
  }

  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/admin/login?returnUrl=${returnUrl}`);
};

const rejectAdminApiError = (err: unknown, status?: number, message?: string) => {
  const apiMessage = message ?? extractApiErrorMessage(err, 'Request failed');
  return Promise.reject(new AdminApiError(apiMessage, { status }));
};

const handleResponseError = (err: unknown) => {
  const axiosErr = err as {
    response?: { status?: number; data?: unknown };
    config?: { url?: string };
  };
  const status = axiosErr?.response?.status;
  const apiMessage = extractApiErrorMessage(err, 'Request failed');
  const requestUrl = axiosErr?.config?.url ?? '';
  const isLoginRequest = requestUrl.includes(ADMIN_API_PATHS.login);
  const bypassSession = isActiveDevBypassSession(adminAuthClient.getAuthToken());

  const authExpired =
    !bypassSession &&
    !isLoginRequest &&
    (isAuthExpiredError(err) ||
      ((status === 401 || status === 403) && looksLikeAuthFailureMessage(apiMessage)));

  if (authExpired) {
    reauthorize();
    return rejectAdminApiError(err, status, apiMessage || 'Session expired');
  }

  return rejectAdminApiError(err, status, apiMessage);
};

[axiosApi, authAxiosApi].forEach((instance) => {
  instance.interceptors.response.use((res) => res, handleResponseError);
});

const returnApiResponse = <T>(response: { data?: T }): T => (response?.data ?? {}) as T;

const createAuthRecord = async <T>(path: string, data: unknown): Promise<T> => {
  clearAuthHeaders();
  const response = await authAxiosApi.post(path, data, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

const getAllAuth = async <T>(path: string): Promise<T> => {
  applyAuthHeaders();
  const response = await authAxiosApi.get(path, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

const createRecord = async <T>(path: string, data: unknown): Promise<T> => {
  applyAuthHeaders();
  const response = await axiosApi.post(path, data, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

export const adminWebApi = {
  createAuthRecord,
  getAllAuth,
  createRecord,
  clearAuthHeaders,
  applyAuthHeaders,
  /** @deprecated Use applyAuthHeaders */
  configHeader: applyAuthHeaders,
};

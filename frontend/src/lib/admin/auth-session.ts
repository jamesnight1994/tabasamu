import { ADMIN_API_PATHS } from './api-paths';
import { adminAuthClient } from './auth-client';
import {
  isAdminDevBypassEnabled,
  isDevBypassSession,
} from './dev-auth-bypass';
import { adminWebApi, resetAuthRedirectState } from './web-api';

export const fetchAuthenticatedStaff = async (token?: string) => {
  const tokenStr = token ?? adminAuthClient.getAuthToken();
  if (!tokenStr) throw new Error('No token');

  if (isDevBypassSession(tokenStr)) {
    if (!isAdminDevBypassEnabled()) {
      throw new Error('Dev bypass session is not allowed');
    }
    adminAuthClient.setAuthToken(tokenStr);
    adminWebApi.applyAuthHeaders();
    const user = adminAuthClient.getUserDetails();
    if (!user) throw new Error('No user');
    return { user, token: tokenStr };
  }

  adminAuthClient.setAuthToken(tokenStr);
  adminWebApi.applyAuthHeaders();

  const profile = await adminWebApi.getAllAuth<{ id: string }>(ADMIN_API_PATHS.profile);
  const user = await adminWebApi.getAllAuth(ADMIN_API_PATHS.user(profile.id));

  return { user, token: tokenStr };
};

export const completeLogin = (user: unknown, token: string) => {
  resetAuthRedirectState();
  adminAuthClient.setUserDetails(user, token);
  adminWebApi.applyAuthHeaders();
};

export const restoreStoredSession = async () => {
  const token = adminAuthClient.getAuthToken();
  if (!token) return null;

  if (isDevBypassSession(token)) {
    if (!isAdminDevBypassEnabled()) {
      clearStaleAuth();
      return null;
    }
    const user = adminAuthClient.getUserDetails();
    adminWebApi.applyAuthHeaders();
    return user ? { user, token } : null;
  }

  try {
    return await fetchAuthenticatedStaff();
  } catch {
    adminAuthClient.signOut();
    adminWebApi.clearAuthHeaders();
    return null;
  }
};

export const clearStaleAuth = () => {
  adminAuthClient.signOut();
  adminWebApi.clearAuthHeaders();
};

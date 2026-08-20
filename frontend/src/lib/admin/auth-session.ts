import { ADMIN_API_PATHS } from './api-paths';
import { adminAuthClient } from './auth-client';
import { adminWebApi, resetAuthRedirectState } from './web-api';

export const fetchAuthenticatedStaff = async (token?: string) => {
  const tokenStr = token ?? adminAuthClient.getAuthToken();
  if (!tokenStr) throw new Error('No token');

  adminAuthClient.setAuthToken(tokenStr);
  adminWebApi.configHeader();

  const profile = await adminWebApi.getAllAuth<{ id: string }>(ADMIN_API_PATHS.profile);
  const user = await adminWebApi.getAllAuth(ADMIN_API_PATHS.user(profile.id));

  return { user, token: tokenStr };
};

export const completeLogin = (user: unknown, token: string) => {
  resetAuthRedirectState();
  adminAuthClient.setUserDetails(user, token);
  adminWebApi.configHeader();
};

export const restoreStoredSession = async () => {
  if (!adminAuthClient.getAuthToken()) return null;
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

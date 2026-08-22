import { ADMIN_API_PATHS } from '../../lib/admin/api-paths';
import { adminAuthClient } from '../../lib/admin/auth-client';
import {
  buildDevBypassStaff,
  DEV_BYPASS_TOKEN,
  isAdminDevBypassEnabled,
} from '../../lib/admin/dev-auth-bypass';
import {
  clearStaleAuth,
  completeLogin,
  fetchAuthenticatedStaff,
} from '../../lib/admin/auth-session';
import { adminWebApi } from '../../lib/admin/web-api';

export const adminAuthService = {
  async login(email: string, password: string) {
    clearStaleAuth();

    if (isAdminDevBypassEnabled()) {
      const user = buildDevBypassStaff(email);
      const token = DEV_BYPASS_TOKEN;
      completeLogin(user, token);
      return { user, token };
    }

    const loginResp = await adminWebApi.createAuthRecord<{ accessToken: string }>(
      ADMIN_API_PATHS.login,
      { username: email, password },
    );

    const token = loginResp.accessToken;
    adminAuthClient.setAuthToken(token);

    const session = await fetchAuthenticatedStaff(token);
    completeLogin(session.user, session.token);
    return session;
  },

  async logout() {
    adminAuthClient.signOut();
    adminWebApi.clearAuthHeaders();
  },

  async requestPasswordReset(email: string) {
    const uri = `${ADMIN_API_PATHS.forgotPassword}?email=${encodeURIComponent(email)}`;
    return adminWebApi.createRecord(uri, { email });
  },

  async currentStaff() {
    return fetchAuthenticatedStaff();
  },
};

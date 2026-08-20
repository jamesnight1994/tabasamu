const TOKEN_KEY = 'tabasamu.admin.token';
const USER_KEY = 'tabasamu.admin.user';
const COOKIE_NAME = 'tabasamu.admin.token';

const isBrowser = () => typeof window !== 'undefined';

const setSessionCookie = (token: string) => {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=28800`;
};

const clearSessionCookie = () => {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
};

export const adminAuthClient = {
  getAuthToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setAuthToken(token: string) {
    if (!isBrowser()) return;
    localStorage.setItem(TOKEN_KEY, token);
    setSessionCookie(token);
  },

  getUserDetails<T = unknown>(): T | null {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  setUserDetails(user: unknown, token?: string) {
    if (!isBrowser()) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (token) this.setAuthToken(token);
  },

  hasSession(): boolean {
    return !!(this.getAuthToken() && this.getUserDetails());
  },

  signOut() {
    if (!isBrowser()) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearSessionCookie();
  },
};

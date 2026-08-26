# Admin Setup — Login, Logout & Forgot Password

**Date:** 2026-08-19  
**Scope:** End-to-end admin auth in `frontend/` — login, logout, forgot password, session storage, axios interceptors, middleware, and a default **`/dashboard`** page.  
**Pattern:** Mirrors `next-app/` auth stack. Admin UI uses **HeroUI v3** (React 19 + Tailwind v4). **No mocks.**  
**Status:** Implemented — HeroUI login/forgot-password, Redux, axios, middleware, admin shell (Phases 1–2).  
**Shell:** Done — see [`admin-shell-spec.md`](./admin-shell-spec.md). Phase 3 dashboard metrics on hold.  
**Next:** UI & design polish, then product CRUD on `/dashboard/products`.

---

## 1. Executive summary

```
/admin/login  |  /admin/forgot-password          /dashboard
       │                    │                         │
       └─────────── Redux authSlice ──────────────────┘
                           │
                    auth-service.ts
                           │
              web-api.ts (axios + interceptors)
                           │
                    API (NEXT_PUBLIC_API_URL)
                           │
              auth-client.ts → localStorage + cookie (for middleware)
```

| Flow | Behaviour |
|------|-----------|
| **Login** | POST credentials → JWT → localStorage + cookie → fetch user → redirect `/dashboard` |
| **Logout** | Clear storage + cookie + axios headers → Redux reset → `/admin/login` |
| **Forgot password** | POST email → neutral success UI (no enumeration) |
| **401** | Interceptor clears session → hard redirect `/admin/login?returnUrl=…` |
| **Valid token on login page** | Client restore + middleware cookie check → `/dashboard` |
| **No token on `/dashboard`** | Middleware → `/admin/login?returnUrl=/dashboard` |

Storefront auth (`SessionProvider`, Medusa) stays **separate** — different keys, routes, and Redux store.

---

## 2. Routes

| Route | Group | Auth | Purpose |
|-------|-------|------|---------|
| `/admin/login` | `(admin-auth)` | Public | Sign in |
| `/admin/forgot-password` | `(admin-auth)` | Public | Request reset email |
| `/dashboard` | `(admin)` | Protected | Default landing after login |

**Default redirect target:** `/dashboard` (not `/admin`).

**Login query params:** `?returnUrl=/dashboard` — middleware and login form preserve this.

---

## 3. Reference → target mapping

| next-app | `frontend/` |
|----------|-------------|
| `utils/webApi.tsx` → `webApiService` | `src/lib/admin/web-api.ts` → `adminWebApi` |
| `utils/authClient.tsx` | `src/lib/admin/auth-client.ts` |
| `utils/authSession.ts` | `src/lib/admin/auth-session.ts` |
| `utils/extractApiError.ts` | `src/lib/admin/extract-api-error.ts` |
| `components/RouteGard.tsx` | `src/components/admin/AdminAuthProvider.tsx` |
| `pages/auth/login` | `app/(admin-auth)/admin/login/page.tsx` |
| `pages/auth/forgotpassword` | `app/(admin-auth)/admin/forgot-password/page.tsx` |
| `pages/pages/dashboard` | `app/(admin)/dashboard/page.tsx` |
| `redux/slices/profileSlice` (logout/password) | `redux/admin/slices/authSlice.ts` |
| PrimeReact UI in next-app (`Toast`, `InputText`, `Password`, …) | **HeroUI v3** in `AdminLoginForm` / `AdminForgotPasswordForm` |
| next-app side panels | HeroUI **`Drawer`** (future admin side sheets) |

Use **axios** (same as next-app) for request/response interceptors. Admin auth forms use **yup** + **react-hook-form** with HeroUI **`TextField`**, **`FieldError`**, **`Form`**, **`Button`**, **`Checkbox`**, **`Alert`**, **`Card`**.

---

## 3b. Admin UI (HeroUI v3)

Admin login/forgot-password use **[HeroUI v3](https://heroui.com)** — React 19 + Tailwind v4 native, no PrimeReact.

**Packages:**

```bash
yarn add @heroui/react @heroui/styles react-aria react-aria-components @react-aria/i18n @react-aria/ssr @react-aria/utils
```

**Global styles** (`src/app/globals.css`):

```css
@import 'tailwindcss';
@import '@heroui/styles';
```

**Provider** — HeroUI v3 needs no root provider. `(admin-auth)` / `(admin)` layouts wrap `AdminUiProvider` (admin shell CSS only).

**Login form components (100% HeroUI):**

| HeroUI | Usage |
|--------|-------|
| `Card` | Auth card shell |
| `Form` | Submit wrapper |
| `TextField` + `Label` + `Input` | Email & password |
| `FieldError` | Yup / RHF validation messages |
| `Checkbox` | Remember me |
| `Button` | Submit (`isPending`) + forgot-password link |
| `Alert` | API login / reset errors |
| `Spinner` | Session bootstrap + button loading |

**Validation:** `react-hook-form` + `yupResolver` + HeroUI `TextField` `isInvalid` + `FieldError` (see `AdminLoginForm.tsx`).

---

## 4. Environment variables

Add to `frontend/.env.example`:

```bash
# Main API — same host as next-app SERVER_URL / AUTH_SERVER_URL
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_AUTH_URL=http://localhost:3001

# Optional debug logging (next-app: NEXT_PUBLIC_AUTH_DEBUG)
NEXT_PUBLIC_ADMIN_AUTH_DEBUG=false
```

---

## 5. API paths

```typescript
// src/lib/admin/api-paths.ts
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
```

| Call | Method | Body / query | Response |
|------|--------|--------------|----------|
| Login | POST `ADMIN_API_PATHS.login` | `{ username: email, password }` | `{ accessToken: string }` |
| Profile | GET `ADMIN_API_PATHS.profile` | Bearer JWT | `{ id: string, … }` |
| User | GET `ADMIN_API_PATHS.user(id)` | Bearer JWT | Full user object |
| Forgot password | POST `` `${forgotPassword}?email=${email}` `` | `{ email }` | Success payload |

---

## 6. Session storage (`auth-client.ts`)

Mirror next-app `authClient` — **localStorage** plus a **cookie** so middleware can read the token on the server.

```typescript
// src/lib/admin/auth-client.ts
const TOKEN_KEY = 'tabasamu.admin.token';
const USER_KEY = 'tabasamu.admin.user';
const COOKIE_NAME = 'tabasamu.admin.token';

const isBrowser = () => typeof window !== 'undefined';

const setSessionCookie = (token: string) => {
  if (!isBrowser()) return;
  // Middleware-readable; not HttpOnly so client can sync on login/logout.
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
```

---

## 7. HTTP layer (`web-api.ts`) — axios + interceptors

Port the core of `next-app/utils/webApi.tsx`: two instances (main + auth), `configHeader`, `clearAuthHeaders`, `reauthorize` on 401/403.

```typescript
// src/lib/admin/web-api.ts
import axios from 'axios';
import { adminAuthClient } from './auth-client';
import {
  extractApiErrorMessage,
  isAuthExpiredError,
  looksLikeAuthFailureMessage,
} from './extract-api-error';

const serverUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const authServerUrl = process.env.NEXT_PUBLIC_ADMIN_AUTH_URL ?? serverUrl;

export const AUTH_SESSION_EXPIRED_EVENT = 'admin:auth:session-expired';

export const axiosApi = axios.create({ baseURL: serverUrl });
export const authAxiosApi = axios.create({ baseURL: authServerUrl });

let isRedirectingToLogin = false;

export const resetAuthRedirectState = () => {
  isRedirectingToLogin = false;
};

const configHeader = () => {
  const token = adminAuthClient.getAuthToken();
  if (!token) return;
  const header = `Bearer ${token}`;
  axiosApi.defaults.headers.common.Authorization = header;
  authAxiosApi.defaults.headers.common.Authorization = header;
};

export const clearAuthHeaders = () => {
  delete axiosApi.defaults.headers.common.Authorization;
  delete authAxiosApi.defaults.headers.common.Authorization;
};

const reauthorize = () => {
  adminAuthClient.signOut();
  clearAuthHeaders();

  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));

  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
  const loginPath =
    window.location.pathname !== '/admin/login'
      ? `/admin/login?returnUrl=${returnUrl}`
      : '/admin/login';

  window.location.assign(loginPath);
};

const handleResponseError = (err: unknown) => {
  const axiosErr = err as { response?: { status?: number; data?: unknown } };
  const status = axiosErr?.response?.status;
  const apiMessage = extractApiErrorMessage(err, 'Request failed');

  const authExpired =
    isAuthExpiredError(err) ||
    ((status === 401 || status === 403) && looksLikeAuthFailureMessage(apiMessage));

  if (authExpired) {
    reauthorize();
    return Promise.reject(new Error(apiMessage || 'Session expired'));
  }

  return Promise.reject(new Error(apiMessage));
};

[axiosApi, authAxiosApi].forEach((instance) => {
  instance.interceptors.response.use((res) => res, handleResponseError);
});

const returnApiResponse = <T>(response: { data?: T }): T =>
  (response?.data ?? {}) as T;

/** Login — strip stale Bearer first (next-app createAuthRecord). */
const createAuthRecord = async <T>(path: string, data: unknown): Promise<T> => {
  clearAuthHeaders();
  const response = await authAxiosApi.post(path, data, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

const getAllAuth = async <T>(path: string): Promise<T> => {
  configHeader();
  const response = await authAxiosApi.get(path, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

const createRecord = async <T>(path: string, data: unknown): Promise<T> => {
  configHeader();
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
  configHeader,
};
```

---

## 8. Session helpers (`auth-session.ts`)

```typescript
// src/lib/admin/auth-session.ts
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
```

---

## 9. Auth service

```typescript
// src/services/admin/auth-service.ts
import { ADMIN_API_PATHS } from '../../lib/admin/api-paths';
import { adminAuthClient } from '../../lib/admin/auth-client';
import {
  clearStaleAuth,
  completeLogin,
  fetchAuthenticatedStaff,
} from '../../lib/admin/auth-session';
import { adminWebApi } from '../../lib/admin/web-api';

export const adminAuthService = {
  async login(email: string, password: string) {
    clearStaleAuth();

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
```

---

## 10. Redux (`authSlice.ts`)

```typescript
// src/redux/admin/slices/authSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminAuthService } from '../../../services/admin/auth-service';
import { restoreStoredSession } from '../../../lib/admin/auth-session';

export const loginStaff = createAsyncThunk(
  'adminAuth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const session = await adminAuthService.login(email, password);
      return session.user;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  },
);

export const logoutStaff = createAsyncThunk('adminAuth/logout', async () => {
  await adminAuthService.logout();
});

export const bootstrapAdminSession = createAsyncThunk(
  'adminAuth/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      const session = await restoreStoredSession();
      return session?.user ?? null;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  },
);

export const requestPasswordReset = createAsyncThunk(
  'adminAuth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      await adminAuthService.requestPasswordReset(email);
      return true;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  },
);

const authSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    user: null as unknown | null,
    status: 'idle' as 'idle' | 'loading' | 'error',
    bootstrapped: false,
    error: null as string | null,
    resetSent: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginStaff.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginStaff.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'idle';
      })
      .addCase(loginStaff.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Sign in failed';
      })
      .addCase(logoutStaff.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      })
      .addCase(bootstrapAdminSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(bootstrapAdminSession.rejected, (state) => {
        state.user = null;
        state.bootstrapped = true;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.resetSent = true;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
```

---

## 11. Middleware

Middleware reads the **session cookie** set by `auth-client` on login. localStorage alone is invisible to the server.

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'tabasamu.admin.token';
const LOGIN = '/admin/login';
const DASHBOARD = '/dashboard';

const PUBLIC_ADMIN_PATHS = [LOGIN, '/admin/forgot-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const isPublicAdmin = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isProtected = pathname.startsWith(DASHBOARD) || (pathname.startsWith('/admin') && !isPublicAdmin);

  // Authenticated user hitting login → dashboard
  if (token && pathname === LOGIN) {
    return NextResponse.redirect(new URL(DASHBOARD, req.url));
  }

  // Unauthenticated user hitting protected route → login
  if (!token && isProtected) {
    const loginUrl = new URL(LOGIN, req.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

**Note:** Middleware checks cookie **presence** only. Validity is confirmed client-side via `restoreStoredSession()` (calls `/accounts/profile/`). Invalid tokens trigger the 401 interceptor → logout → login.

---

## 12. `AdminAuthProvider` (RouteGard equivalent)

```typescript
// src/components/admin/AdminAuthProvider.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch } from '../../redux/admin/hooks';
import { bootstrapAdminSession, logoutStaff } from '../../redux/admin/slices/authSlice';
import { adminAuthClient } from '../../lib/admin/auth-client';
import { AUTH_SESSION_EXPIRED_EVENT } from '../../lib/admin/web-api';
import { ADMIN_ROUTES } from '../../lib/admin/api-paths';

type AdminAuthContextValue = {
  logout: () => Promise<void>;
  authChecker: () => boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void dispatch(bootstrapAdminSession());

    const onExpired = () => router.replace(ADMIN_ROUTES.login);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  }, [dispatch, router]);

  const authChecker = useCallback(() => {
    if (!adminAuthClient.hasSession()) {
      router.replace(`${ADMIN_ROUTES.login}?returnUrl=${encodeURIComponent(pathname)}`);
      return false;
    }
    return true;
  }, [router, pathname]);

  const logout = useCallback(async () => {
    await dispatch(logoutStaff());
    router.push(ADMIN_ROUTES.login);
  }, [dispatch, router]);

  const value = useMemo(() => ({ logout, authChecker }), [logout, authChecker]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
```

Wrap `(admin)` layout with `AdminAuthProvider`. `(admin-auth)` layout only needs Redux provider.

---

## 13. UI components (HeroUI)

Login and forgot-password use HeroUI **`TextField`**, **`FieldError`**, **`Form`**, **`Button`**, **`Checkbox`**, **`Alert`**, and **`Card`**.

### 13.1 Login — `AdminLoginForm.tsx`

```tsx
import { TextField, Label, Input, FieldError, Form, Button, Checkbox, Alert, Card } from '@heroui/react';
// Controller + yupResolver for email/password
// TextField isInvalid + FieldError for field validation
// Alert status="danger" for API errors
// Button isPending + Spinner for submit loading
```

### 13.2 Forgot password — `AdminForgotPasswordForm.tsx`

```tsx
import { TextField, Label, Input, FieldError, Form, Button, Alert, Card } from '@heroui/react';
// Alert status="success" when resetSent
// FieldError for email validation
```

### 13.3 Drawer (future admin side sheets)

```tsx
import { Drawer } from '@heroui/react';
// Use for schedule/questionnaire side panels (next-app parity)
```

### 13.4 Dashboard — default admin page

```tsx
// src/app/(admin)/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useAppSelector } from '../../../redux/admin/hooks';
import { useAdminAuth } from '../../../components/admin/AdminAuthProvider';

export default function DashboardPage() {
  const { authChecker, logout } = useAdminAuth();
  const user = useAppSelector((s) => s.adminAuth.user);

  useEffect(() => {
    authChecker();
  }, [authChecker]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-h2 text-charcoal">Dashboard</h1>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-small font-medium text-forest underline"
        >
          Sign out
        </button>
      </div>
      <p className="mt-4 text-body text-charcoal/70">
        Welcome{user && typeof user === 'object' && 'email' in (user as object)
          ? `, ${(user as { email: string }).email}`
          : ''}.
      </p>
    </div>
  );
}
```

```tsx
// src/app/(admin)/layout.tsx
import { AdminReduxProvider } from '../../components/admin/AdminReduxProvider';
import { AdminUiProvider } from '../../components/admin/AdminUiProvider';
import { AdminAuthProvider } from '../../components/admin/AdminAuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminReduxProvider>
      <AdminUiProvider>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </AdminUiProvider>
    </AdminReduxProvider>
  );
}
```

---

## 14. End-to-end flows

### Login

```
1. User opens /admin/login
2. Middleware: no cookie → allow
3. AdminLoginForm mount → restoreStoredSession()
   ├─ valid token → GET profile + user → redirect /dashboard (or returnUrl)
   └─ no/invalid token → show form
4. Submit → loginStaff thunk
   → createAuthRecord(login, { username, password })
   → accessToken → localStorage + cookie
   → getAllAuth profile + user
   → completeLogin → configHeader (Bearer on axios instances)
5. router.push(returnUrl ?? /dashboard)
6. Middleware: cookie present → allow /dashboard
```

### Logout

```
1. User clicks Sign out on /dashboard
2. logoutStaff thunk → adminAuthService.logout()
   → signOut localStorage + cookie
   → clearAuthHeaders on axios
3. Redux user = null
4. router.push(/admin/login)
5. Middleware: no cookie → allow login page
```

### Forgot password

```
1. User opens /admin/forgot-password
2. Submit email → requestPasswordReset thunk
   → createRecord(/api/accountRecovery/forgotPassword?email=…, { email })
3. Always show neutral success (resetSent = true) on fulfilled
4. Link back to /admin/login
```

### 401 session expiry

```
1. Any authenticated adminWebApi call returns 401/403 (auth failure)
2. axios response interceptor → reauthorize()
   → signOut + clearAuthHeaders
   → dispatch admin:auth:session-expired
   → window.location.assign(/admin/login?returnUrl=…)
3. AdminAuthProvider listener clears UI state
```

---

## 15. File tree

```
frontend/src/
├── middleware.ts
├── styles/admin/
│   └── admin-auth.css                 # Slate page ground only
├── app/
│   ├── (admin-auth)/
│   │   ├── layout.tsx                 # AdminReduxProvider + AdminUiProvider
│   │   └── admin/
│   │       ├── login/page.tsx
│   │       └── forgot-password/page.tsx
│   └── (admin)/
│       ├── layout.tsx                 # Redux + AdminUiProvider + AdminAuthProvider
│       └── dashboard/page.tsx
├── components/admin/
│   ├── AdminUiProvider.tsx
│   ├── AdminReduxProvider.tsx
│   ├── AdminAuthProvider.tsx
│   ├── AdminLoginForm.tsx             # HeroUI login
│   └── AdminForgotPasswordForm.tsx
├── lib/admin/
│   ├── api-paths.ts
│   ├── auth-client.ts
│   ├── auth-session.ts
│   ├── web-api.ts
│   └── extract-api-error.ts
├── services/admin/
│   └── auth-service.ts
└── redux/admin/
    ├── store.ts
    ├── hooks.ts
    └── slices/authSlice.ts
```

---

## 16. Dependencies

```bash
cd frontend
yarn add @heroui/react @heroui/styles axios @reduxjs/toolkit react-redux yup @hookform/resolvers react-hook-form react-aria react-aria-components @react-aria/i18n @react-aria/ssr @react-aria/utils
```

---

## 17. Implementation phases

| Phase | Work |
|-------|------|
| **0** | Yarn deps; route groups `(admin-auth)` + `(admin)`; `middleware.ts` |
| **1** | `auth-client`, `web-api` (axios + interceptors), `extract-api-error`, `api-paths` |
| **2** | `auth-session`, `auth-service` |
| **3** | Redux store + `authSlice` (login, logout, bootstrap, forgot password) |
| **4** | Login page + `AdminLoginForm` |
| **5** | Forgot password page + `AdminForgotPasswordForm` |
| **6** | `/dashboard` + logout button + `AdminAuthProvider` |
| **7** | Unit tests (`auth-client`, interceptor 401, slice thunks) |

---

## 18. Acceptance criteria

- [ ] Login POSTs to real API; JWT stored in localStorage **and** session cookie
- [ ] Axios sends `Authorization: Bearer <token>` on authenticated calls
- [ ] 401/403 auth failures clear session and redirect to `/admin/login`
- [ ] Logout clears localStorage, cookie, axios headers, and Redux user
- [ ] Forgot password POSTs to real API; UI shows neutral success only
- [ ] Successful login redirects to `/dashboard` (or `returnUrl`)
- [ ] Valid session on `/admin/login` redirects to `/dashboard`
- [ ] `/dashboard` without cookie redirects to `/admin/login?returnUrl=/dashboard`
- [ ] `restoreStoredSession` validates token against API before trusting it
- [ ] No shared auth with storefront `SessionProvider`
- [ ] `yarn typecheck` passes

---

## 19. Related references

| Path | Purpose |
|------|---------|
| `next-app/utils/webApi.tsx` | axios instances, interceptors, reauthorize |
| `next-app/utils/authClient.tsx` | localStorage session |
| `next-app/utils/authSession.ts` | fetchAuthenticatedUser, completeLogin |
| `next-app/components/RouteGard.tsx` | authChecker, logout, session-expired event |
| `next-app/pages/auth/login/index.tsx` | Login page flow |
| `next-app/pages/auth/forgotpassword/index.tsx` | Forgot password flow |
| `frontend/src/components/commerce/ResetFlow.tsx` | Enumeration-safe reset copy |

---

## 20. Deferred (later specs)

- Reset password confirmation page (`?token=`)
- Full admin shell (sidebar, nav)
- Role-based UI gates (doc 38)
- HttpOnly cookie + BFF (stronger XSS resistance than current cookie mirror)

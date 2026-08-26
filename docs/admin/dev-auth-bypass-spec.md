# Admin dev auth bypass — recommendation & implementation spec

**Date:** 2026-08-22  
**Status:** Implemented (Phase A)  
**Audience:** Frontend admin CRUD work while Nest staff login is unbuilt  
**Related:** [`admin-setup.md`](./admin-setup.md) · [`../71_Nest_Product_Admin_API.md`](../71_Nest_Product_Admin_API.md)

---

## 1. Problem

| Layer | Today |
|-------|--------|
| **Admin UI** | Login form POSTs to `/custom_auth/login/user`, expects JWT + profile endpoints |
| **Nest API** | No staff login, no User model, no JWT — admin writes use `X-Admin-Api-Key` only |
| **Result** | `/admin/login` cannot succeed against Nest; CRUD screens cannot be built end-to-end |

We need a **temporary, dev-only bridge** so admin screens can:

1. Keep the **existing login UX** (form, middleware, Redux, cookie) intact for when real auth lands.
2. Treat login as **successful** when a flag is set — **without** calling missing auth APIs.
3. Send **`X-Admin-Api-Key`** on Nest `/v1/admin/*` requests (the auth Nest actually understands today).

---

## 2. Assessment of the proposed approach

**Proposal:** Env variable enables always-success login and wires `X-Admin-Api-Key` for API calls.

### Verdict: **Good temporary fix — with guardrails**

| Pros | Cons |
|------|------|
| Unblocks admin CRUD UI immediately | API key in browser bundle if sent client-side (dev only) |
| Real login code path stays; one branch at the top of `auth-service.login()` | Easy to misconfigure in staging/prod if guards are weak |
| Matches Nest’s *actual* admin auth today (`X-Admin-Api-Key`) | Synthetic session is not a real JWT — must be removed later |
| Middleware / cookie / Redux flows stay realistic | Forgot-password still won’t work (acceptable in bypass mode) |

### What we should **not** do

- **Do not** permanently replace login with “skip auth” links — hides UX bugs before real auth.
- **Do not** use bypass in production without a BFF/proxy (see §4).
- **Do not** store the API key in `localStorage` as the “JWT” — keep session token synthetic; attach the key per-request from env.

---

## 3. Recommended approach (chosen)

### Name: **Dev API-key session bypass**

Two concerns are intentionally separated:

| Concern | Mechanism | Purpose |
|---------|-----------|---------|
| **“Is the user logged into admin UI?”** | Synthetic session in `auth-client` + cookie | Middleware, dashboard guard, logout |
| **“Can this client call Nest admin APIs?”** | `X-Admin-Api-Key` on `axiosApi` | Real Nest `/v1/admin/*` auth |

When bypass is **off** (default): behaviour is unchanged — real login API, Bearer token, profile fetch.

When bypass is **on** (dev only):

1. User submits login form (any email/password).
2. `auth-service.login()` **short-circuits** — no HTTP to `/custom_auth/login/user`.
3. Creates a **synthetic staff user** + fixed session token (e.g. `__admin_dev_bypass__`).
4. `web-api.ts` sets `X-Admin-Api-Key` on Nest requests (and **does not** treat Nest 401 as “session expired” for admin-key failures during bypass).
5. `restoreStoredSession()` / bootstrap **skip** profile API calls when bypass session is detected.

### Why this over alternatives

| Alternative | Why not chosen (for now) |
|-------------|--------------------------|
| **Remove login; open `/dashboard` directly** | Skips middleware/cookie/Redux testing; bigger revert when auth ships |
| **Mock entire auth in MSW** | Doesn’t exercise real Nest admin endpoints |
| **Next.js BFF proxy only** (best long-term) | More files/routes upfront; good **Phase B** before staging |
| **Hard-code bypass in components** | Scattered logic; env toggle is cleaner |

**Phase A (now):** Client bypass + client-sent API key — **strictly gated to local development**.  
**Phase B (before staging):** Optional BFF at `/api/admin/nest/[...path]` so `ADMIN_API_KEY` stays server-only.

---

## 4. Environment variables

### Phase A — implement first

Add to `frontend/.env.local` (never commit):

```env
# ── Admin dev bypass (local only) ─────────────────────────────────────
# Enables synthetic login + X-Admin-Api-Key for Nest admin CRUD.
# Requires NEXT_PUBLIC_APP_ENV=development — ignored otherwise.
NEXT_PUBLIC_ADMIN_AUTH_BYPASS=true

# Same value as backend ADMIN_API_KEY (docker-compose.dev.yml default).
# Only read when bypass is active. NEVER set in production builds.
NEXT_PUBLIC_ADMIN_API_KEY=dev-admin-key-change-me
```

| Variable | Scope | Required when bypass on |
|----------|-------|-------------------------|
| `NEXT_PUBLIC_ADMIN_AUTH_BYPASS` | Client | `true` |
| `NEXT_PUBLIC_ADMIN_API_KEY` | Client | Must match backend `ADMIN_API_KEY` |
| `NEXT_PUBLIC_APP_ENV` | Client | Must be `development` (hard gate) |
| `NEXT_PUBLIC_API_URL` | Client | Nest base, e.g. `http://localhost:3001` |

**Triple gate:** bypass runs only if  
`BYPASS === 'true' && APP_ENV === 'development' && API_KEY non-empty`.

### Phase B — before non-local deploy (optional upgrade)

```env
# Server only — no NEXT_PUBLIC_
ADMIN_API_KEY=dev-admin-key-change-me
ADMIN_AUTH_BYPASS=true
```

Proxy route adds the header; client never sees the key. Bypass login branch can stay identical.

---

## 5. Implementation spec

### 5.1 New module: `src/lib/admin/dev-auth-bypass.ts`

Centralize all bypass logic — **single place to delete** when Nest auth ships.

```typescript
export const DEV_BYPASS_TOKEN = '__admin_dev_bypass__';

export function isAdminDevBypassEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_APP_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ADMIN_AUTH_BYPASS === 'true' &&
    Boolean(process.env.NEXT_PUBLIC_ADMIN_API_KEY?.trim())
  );
}

export function isDevBypassSession(token: string | null): boolean {
  return token === DEV_BYPASS_TOKEN;
}

export function buildDevBypassStaff(email: string) {
  return {
    id: 'dev-bypass',
    email,
    name: 'Dev Admin (bypass)',
    roles: ['admin'],
  };
}

export function getDevBypassApiKey(): string | null {
  if (!isAdminDevBypassEnabled()) return null;
  return process.env.NEXT_PUBLIC_ADMIN_API_KEY!.trim();
}
```

### 5.2 `auth-service.ts` — login branch (keep existing path below)

```typescript
async login(email: string, password: string) {
  clearStaleAuth();

  if (isAdminDevBypassEnabled()) {
    const user = buildDevBypassStaff(email);
    const token = DEV_BYPASS_TOKEN;
    adminAuthClient.setUserDetails(user, token);
    adminWebApi.applyAuthHeaders(); // sets X-Admin-Api-Key, not Bearer
    return { user, token };
  }

  // ── existing production-intent path (unchanged) ──
  const loginResp = await adminWebApi.createAuthRecord(...);
  ...
}
```

- **Email** is taken from the form (helps debugging); **password is ignored** in bypass mode.
- No toast/alert changes required — login “succeeds” normally.

### 5.3 `auth-session.ts` — bootstrap / restore

```typescript
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

  // ── existing JWT + profile path ──
  try {
    return await fetchAuthenticatedStaff();
  } catch { ... }
};
```

If bypass env is turned off but cookie remains → session cleared (fail closed).

### 5.4 `web-api.ts` — headers & interceptors

Replace ad-hoc `configHeader()` with explicit modes:

```typescript
export function applyAuthHeaders() {
  if (isAdminDevBypassEnabled() && isDevBypassSession(adminAuthClient.getAuthToken())) {
    const key = getDevBypassApiKey();
    delete axiosApi.defaults.headers.common.Authorization;
    delete authAxiosApi.defaults.headers.common.Authorization;
    if (key) {
      axiosApi.defaults.headers.common['X-Admin-Api-Key'] = key;
    }
    return;
  }

  // JWT mode (existing)
  clearAdminApiKeyHeader();
  configBearerHeader();
}

function clearAdminApiKeyHeader() {
  delete axiosApi.defaults.headers.common['X-Admin-Api-Key'];
}
```

**Interceptor tweak:** When bypass session is active, a Nest `401` on `/v1/admin/*` should **not** trigger `reauthorize()` (wrong/missing API key is a config error, not expired JWT). Show error in UI instead.

### 5.5 `auth-service.logout()` / `clearStaleAuth()`

Always call `clearAdminApiKeyHeader()` alongside existing clears.

### 5.6 Middleware — **no changes**

Cookie presence check still works — synthetic token is stored in the same cookie name (`tabasamu.admin.token`).

### 5.7 Admin CRUD services (new work)

All Nest admin calls use `adminWebApi` → `axiosApi` (base `NEXT_PUBLIC_API_URL`):

```typescript
// Example future service
await axiosApi.get('/v1/admin/products');
await axiosApi.post('/v1/admin/products', body);
```

Headers applied by `applyAuthHeaders()` after login/bootstrap.

### 5.8 `.env.example` additions

```env
# Dev-only admin bypass — see docs/admin/dev-auth-bypass-spec.md
# NEXT_PUBLIC_ADMIN_AUTH_BYPASS=true
# NEXT_PUBLIC_ADMIN_API_KEY=dev-admin-key-change-me
```

### 5.9 `docker-compose.dev.yml` (optional convenience)

Under `app` service `environment`:

```yaml
NEXT_PUBLIC_ADMIN_AUTH_BYPASS: "true"
NEXT_PUBLIC_ADMIN_API_KEY: ${ADMIN_API_KEY:-dev-admin-key-change-me}
```

Only when explicitly desired for Compose-based admin dev.

---

## 6. Flow diagrams

### Login (bypass on)

```
/admin/login → submit form
    → auth-service.login()
        → isAdminDevBypassEnabled()? YES
            → synthetic user + DEV_BYPASS_TOKEN
            → cookie + localStorage
            → applyAuthHeaders() → X-Admin-Api-Key
    → redirect /dashboard
```

### Login (bypass off — unchanged)

```
/admin/login → submit form
    → POST /custom_auth/login/user
    → Bearer token
    → GET /accounts/profile/ + /api/users/:id
    → redirect /dashboard
```

### Nest admin CRUD request (bypass on)

```
Admin CRUD component
    → adminWebApi / axiosApi
    → GET http://localhost:3001/v1/admin/products
    → Header: X-Admin-Api-Key: dev-admin-key-change-me
```

---

## 7. Security guardrails

1. **`isAdminDevBypassEnabled()` must check `NEXT_PUBLIC_APP_ENV === 'development'`** — not bypassable by flag alone.
2. **Document in README/admin-setup:** never set bypass env vars in Vercel/production.
3. **CI:** do not set bypass vars; E2E continues to test real auth path when API exists.
4. **Optional runtime warning:** `console.warn` once when bypass active (or dev-only banner on dashboard).
5. **Remove before production admin launch** — track as tech debt; grep for `dev-auth-bypass` before release.

---

## 8. Migration when Nest auth is implemented

1. Implement Nest staff login (JWT or session) under `/v1/auth/...` (exact path TBD).
2. Point `ADMIN_API_PATHS.login` at the new Nest route.
3. Delete `dev-auth-bypass.ts` and bypass branches in `auth-service` / `auth-session` / `web-api`.
4. Remove `NEXT_PUBLIC_ADMIN_AUTH_BYPASS` and `NEXT_PUBLIC_ADMIN_API_KEY` from env templates.
5. Move to Phase B BFF if admin key must remain server-side for any server actions.

---

## 9. Testing checklist

- [ ] Bypass **off** + wrong credentials → login fails (unchanged).
- [ ] Bypass **on** + any credentials → `/dashboard`, cookie set.
- [ ] Bypass **on** → `GET /v1/admin/products` succeeds with API key (curl or UI).
- [ ] Bypass **on** → wrong `NEXT_PUBLIC_ADMIN_API_KEY` → 401, no redirect loop.
- [ ] Bypass **on** → reload `/dashboard` → session restored without profile API.
- [ ] Bypass **off** after session existed → stale bypass cookie cleared on restore.
- [ ] `NEXT_PUBLIC_APP_ENV=production` + bypass flag → bypass ignored.
- [ ] Logout clears API key header and cookie.

---

## 10. Summary

| Question | Answer |
|----------|--------|
| **Is env-based bypass a reasonable temp fix?** | **Yes**, for local admin CRUD against Nest. |
| **Better approach?** | Same UX + **BFF proxy** before staging; bypass branch stays, key moves server-side. |
| **Keep current login intact?** | **Yes** — bypass is an early return; production path untouched. |
| **What auth does Nest use today?** | `X-Admin-Api-Key` on `/v1/admin/*` — bypass should use that, not fake JWT against Nest. |

**Next step:** Implement §5.1–5.5, then build admin product CRUD against `/v1/admin/products`.

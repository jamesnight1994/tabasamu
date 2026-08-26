# Admin shell & dashboard — implementation spec

**Date:** 2026-08-22  
**Status:** **Done** (Phases 1–2). Phase 3 on hold until dashboard metrics APIs exist.  
**Builds on:** [`admin-setup.md`](./admin-setup.md) · [`dev-auth-bypass-spec.md`](./dev-auth-bypass-spec.md)  
**Reference UI:** `next-app/layout/*`, `next-app/pages/pages/dashboard/index.tsx`  
**Next:** UI & design polish (spacing, typography, mobile nav, visual parity with next-app).

---

## 1. Does this make sense?

**Yes.** The current admin stack stops at a bare `/dashboard` page (title + sign out). The next step is an **authenticated admin chrome** — fixed topnav, icon sidenav, and a dashboard home — matching the look and feel of `next-app`’s `/pages/pages/*` routes while staying on **HeroUI v3 + Tailwind v4** (no PrimeReact port).

| Goal | Approach |
|------|----------|
| Same admin “frame” as next-app | Fixed topbar (~5rem) + narrow icon sidebar (~6.4rem) + scrollable main |
| Logged-in user visible | Welcome header on dashboard (avatar, name, email) + profile menu in topbar |
| Two dashboard tabs | HeroUI `Tabs` — e-commerce placeholders, not collection-schedule data |
| Keep auth intact | `(admin-auth)` routes stay full-screen login; `(admin)` routes wrap in shell |
| CRUD later | Shell nav links to future routes (`/dashboard/products`, etc.) — stub or 404 OK for now |

**Out of scope for this spec:** Real analytics API, product CRUD pages, role-based menu filtering (stub “admin sees all” until Nest roles exist).

---

## 2. Reference → target mapping

| next-app | `frontend/` (this spec) |
|----------|---------------------------|
| `layout/layout.tsx` | `components/admin/shell/AdminShell.tsx` |
| `layout/AppTopbar.tsx` | `components/admin/shell/AdminTopbar.tsx` |
| `layout/AppSidebar.tsx` + `AppMenu.tsx` | `components/admin/shell/AdminSidebar.tsx` |
| `layout/AppMenuitem.tsx` | `components/admin/shell/AdminSidebarItem.tsx` |
| `components/nav/TopbarProfileMenu.tsx` | `components/admin/shell/AdminProfileMenu.tsx` |
| `components/dashboard/DashboardWelcomeHeader.tsx` | `components/admin/dashboard/AdminDashboardWelcome.tsx` |
| `pages/pages/dashboard/index.tsx` (TabView × 2) | `app/(admin)/dashboard/page.tsx` + tab panels |
| PrimeReact `TabView` / `Avatar` / `Menu` | HeroUI `Tabs`, `Avatar`, `Dropdown` or `Popover` + `Button` |
| Sakai SCSS (`styles/layout/*`) | Tailwind + `styles/admin/admin-shell.css` (dimensions only) |
| `LayoutProvider` / mobile overlay | Lightweight `AdminShellProvider` (sidebar mobile toggle only) |
| `useUser()` / `authChecker` | Existing `useAdminAuth()` + `authChecker()` |

**Do not port:** PrimeReact, `LayoutConfig`, season indicator, county geo, collection-schedule Redux.

---

## 3. Layout anatomy

Match next-app proportions (Sakai-style):

```
┌──────────────────────────────────────────────────────────── Topbar (fixed, h=5rem, z=997)
│ [Logo + Tabasamu Admin]                    [Profile ▾]     bg: brand green #305138 → Tabasamu teal
├──────┬──────────────────────────────────────────────────
│ Side │ Main content (scroll)
│ 6.4rem│  padding-top: 5rem (clear topbar)
│ fixed│  margin-left: 6.4rem (clear sidebar)
│      │
│ [icon│  ┌─ Welcome band (dark, avatar + greeting) ─────┐
│  nav]│  └─ White card (tabs) overlapping welcome ──────┘
│      │
└──────┴──────────────────────────────────────────────────
```

| Token | Value | Source |
|-------|-------|--------|
| Topbar height | `5rem` | next-app `_topbar.scss` |
| Sidebar width | `6.4rem` | next-app `_menu.scss` |
| Sidebar top offset | `5.1rem` | below topbar |
| Main padding-top | `5rem` | clear topbar |
| Brand topbar bg | `#0f766e` / `#305138` | Tabasamu teal (prefer teal-800 for Tabasamu) |

---

## 4. Route & layout structure

### 4.1 Route groups (unchanged)

| Group | Routes | Shell? |
|-------|--------|--------|
| `(admin-auth)` | `/admin/login`, `/admin/forgot-password` | **No** — full-screen auth card |
| `(admin)` | `/dashboard`, future `/dashboard/*` or `/admin/*` (protected) | **Yes** — `AdminShell` |

### 4.2 Recommended URL plan

| Route | Nav label | Phase |
|-------|-----------|-------|
| `/dashboard` | Dashboard | **This spec** |
| `/dashboard/products` | Products | Stub link (disabled or “Coming soon”) |
| `/dashboard/orders` | Orders | Stub |
| `/dashboard/settings` | Settings | Stub |
| `/admin/profile` | — | Profile menu only (optional later) |

Keep **`/dashboard`** as post-login landing (already in middleware + `ADMIN_ROUTES.dashboard`).

**Tab query param:** `/dashboard?tab=overview` | `/dashboard?tab=activity` (mirrors next-app shallow `?tab=`).

### 4.3 Layout wiring

Update `app/(admin)/layout.tsx`:

```tsx
<AdminReduxProvider>
  <AdminUiProvider>
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  </AdminUiProvider>
</AdminReduxProvider>
```

`(admin-auth)/layout.tsx` — **unchanged** (no shell).

---

## 5. Component architecture

```
src/components/admin/shell/
├── AdminShell.tsx              # Grid: topbar + sidebar + <main>{children}</main>
├── AdminShellProvider.tsx      # mobile sidebar open state
├── AdminTopbar.tsx             # logo, brand, profile trigger
├── AdminSidebar.tsx            # nav list container
├── AdminSidebarItem.tsx        # icon + label link, active state
├── AdminProfileMenu.tsx        # user block + Profile + Sign out
└── admin-nav-config.ts         # menu items (label, href, icon, disabled?)

src/components/admin/dashboard/
├── AdminDashboardWelcome.tsx   # dark welcome band + avatar + subtitle
├── AdminDashboardOverviewTab.tsx   # KPI stat cards (placeholder)
├── AdminDashboardActivityTab.tsx   # recent activity list (placeholder)
└── admin-dashboard-types.ts    # shared placeholder types (optional)

src/styles/admin/
├── admin-auth.css              # existing — login only
└── admin-shell.css             # NEW — shell dimensions + menu active states
```

### 5.1 `AdminShell`

- Client component.
- Renders `AdminTopbar`, `AdminSidebar`, and `<main className="admin-shell-main">{children}</main>`.
- On mobile (`max-width: 768px`): sidebar off-canvas; topbar menu button toggles drawer (HeroUI `Drawer` or CSS translate).
- Does **not** call `authChecker` — leave that to pages or `AdminAuthProvider` bootstrap.

### 5.2 `AdminTopbar`

- Fixed full width, flex row.
- Left: Tabasamu monogram (`/brand/approved/tabasamu-monogram.svg`) + “Tabasamu Admin”.
- Right: `AdminProfileMenu`.
- Mobile: hamburger toggles sidebar (optional phase 1 — can ship desktop-first if needed).

### 5.3 `AdminSidebar`

- Vertical icon nav (label under icon, truncated ~4.5rem — same as `AppMenuitem`).
- Active route: highlight background (`bg-teal-100` / `font-semibold`) when `pathname` matches or starts with `href`.
- Icons: **`lucide-react`** (already in project) — map from next-app pi icons:

| Nav item | Lucide icon |
|----------|-------------|
| Dashboard | `LayoutDashboard` |
| Products | `Package` |
| Orders | `ShoppingCart` |
| Settings | `Settings` |

### 5.4 `AdminProfileMenu`

Mirror `TopbarProfileMenu` structure with HeroUI:

- Trigger: circular `Button` with user icon or initials `Avatar`.
- Menu content:
  - **Header block:** avatar, display name, email (from Redux `adminAuth.user` or `adminAuthClient.getUserDetails()`).
  - **Separator**
  - Profile → `/admin/profile` (optional stub page later).
  - Sign out → `useAdminAuth().logout()`.

Display name resolution (same logic as next-app `DashboardWelcomeHeader`):

1. `user.name` or `first_name` / `firstName`
2. Email local-part
3. Fallback: “Admin”

Works with **dev bypass user** (`name: 'Dev Admin (bypass)'`, `email` from login form).

### 5.5 Dashboard page

Replace minimal `dashboard/page.tsx` with:

```tsx
'use client';

// 1. authChecker on mount (keep existing pattern)
// 2. AdminDashboardWelcome
// 3. Card with HeroUI Tabs (controlled + URL ?tab= sync via useSearchParams + router.replace shallow)
//    Tab 1: "Overview" → AdminDashboardOverviewTab
//    Tab 2: "Recent activity" → AdminDashboardActivityTab
```

**No Redux/API for dashboard data in phase 1** — static placeholder content.

---

## 6. Dashboard tab content (e-commerce placeholders)

### Tab 1 — Overview

Four stat cards in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`):

| Card | Placeholder value | Note |
|------|-------------------|------|
| Orders today | `—` | Awaiting orders API |
| Revenue (KES) | `—` | D-14 pricing TBD |
| Active products | Fetch optional | Can call public `GET /v1/products?status=active` count if desired |
| Low stock | `—` | Awaiting inventory rules |

Optional enhancement: wire **Active products** to Nest public endpoint (no admin key) for one live stat — document as nice-to-have.

### Tab 2 — Recent activity

Placeholder list/table (HeroUI `Table` or styled list):

- 5–8 fake rows: “Order #1001 — Paid”, “Product ‘Kenyan PB’ updated”, etc.
- Footer note: “Connect to Nest/Medusa activity feed in a later phase.”

### Welcome header copy

```
Welcome back, {name}!
Manage catalogue, orders, and store operations for Tabasamu Sips.
```

Dark band (`bg-zinc-900`), white text — same visual hierarchy as next-app dashboard.

---

## 7. Styling strategy

**Do not** import next-app Sakai SCSS (PrimeReact coupling, variable soup).

**Do** add `admin-shell.css`:

```css
.admin-shell-root { /* min-height 100vh, bg gray-100 */ }
.admin-shell-topbar { position: fixed; height: 5rem; ... }
.admin-shell-sidebar { position: fixed; width: 6.4rem; top: 5.1rem; ... }
.admin-shell-main { margin-left: 6.4rem; padding-top: 5rem; min-height: 100vh; }
.admin-shell-nav-item.active { /* teal highlight */ }
```

Import in `AdminUiProvider` alongside `admin-auth.css`:

```tsx
import '../../styles/admin/admin-shell.css';
```

Use Tailwind utilities inside components; CSS file only for fixed layout math that is awkward in utilities.

---

## 8. Auth integration (no changes to auth stack)

| Concern | Handling |
|---------|----------|
| Session user | `useAppSelector(s => s.adminAuth.user)` + `adminAuthClient` fallback |
| Route guard | Each protected page keeps `useEffect(() => authChecker(), [authChecker])` |
| Logout | Profile menu → existing `logoutStaff` thunk |
| Dev bypass | Bypass user shows in welcome header + profile menu automatically |
| Middleware | Unchanged — cookie gate only |

**Remove** standalone “Sign out” text link from dashboard body — profile menu owns logout (matches next-app).

---

## 9. Navigation config

`admin-nav-config.ts`:

```typescript
export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  tooltip?: string;
  disabled?: boolean;
  matchPrefix?: boolean; // default true for active state
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package, disabled: true },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, disabled: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, disabled: true },
];
```

Disabled items: visible but `aria-disabled`, no navigation, muted style — communicates roadmap.

---

## 10. Implementation phases

### Phase 1 — Shell + dashboard

**Status:** Implemented

1. Add `admin-shell.css` + shell components.
2. Wrap `(admin)/layout` with `AdminShell`.
3. Rebuild `dashboard/page.tsx` with welcome + 2 tabs.
4. Add `admin-nav-config.ts`.
5. Manual test: login (incl. dev bypass) → shell visible → tabs switch → logout.

### Phase 2 — Stub routes

**Status:** Implemented

- `/dashboard/products`, `/dashboard/orders`, `/dashboard/settings` — “Coming soon” cards inside shell
- Sidebar nav items enabled (link to stub pages)
- Reusable `AdminComingSoon` component with route guard

### Phase 3 — Live dashboard metrics

**Status:** On hold — no dashboard metrics API on Nest/Medusa yet. Overview tab keeps placeholder `—` values until backend aggregates exist.

- Wire Overview cards to Nest/Medusa aggregates when APIs exist.

---

## 11. Files to create / modify

### Create

| File | Purpose |
|------|---------|
| `src/components/admin/shell/AdminShell.tsx` | Layout frame |
| `src/components/admin/shell/AdminShellProvider.tsx` | Mobile menu state |
| `src/components/admin/shell/AdminTopbar.tsx` | Top navigation |
| `src/components/admin/shell/AdminSidebar.tsx` | Side navigation |
| `src/components/admin/shell/AdminSidebarItem.tsx` | Nav link item |
| `src/components/admin/shell/AdminProfileMenu.tsx` | Profile dropdown |
| `src/components/admin/shell/admin-nav-config.ts` | Nav data |
| `src/components/admin/dashboard/AdminDashboardWelcome.tsx` | Welcome header |
| `src/components/admin/dashboard/AdminDashboardOverviewTab.tsx` | Tab 1 |
| `src/components/admin/dashboard/AdminDashboardActivityTab.tsx` | Tab 2 |
| `src/styles/admin/admin-shell.css` | Shell layout CSS |

### Modify

| File | Change |
|------|--------|
| `app/(admin)/layout.tsx` | Wrap children in `AdminShell` |
| `app/(admin)/dashboard/page.tsx` | Full dashboard with tabs |
| `components/admin/AdminUiProvider.tsx` | Import `admin-shell.css` |
| `docs/admin/admin-setup.md` | Cross-link this spec (optional one line) |

---

## 12. HeroUI component map

| UI need | HeroUI |
|---------|--------|
| Dashboard tabs | `Tabs`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel` |
| Stat cards | `Card` |
| Profile menu | `Dropdown` or `Popover` + `Button` |
| Avatar | `Avatar` (or initials in rounded div if Avatar API differs) |
| Activity table | `Table` (optional) or semantic HTML + Tailwind |
| Mobile drawer | `Drawer` (if mobile sidebar in phase 1) |

---

## 13. Testing checklist

- [x] `/admin/login` — no shell (unchanged).
- [x] After login — topbar + sidebar visible on `/dashboard`.
- [x] Active nav highlight on `/dashboard`.
- [x] Welcome header shows bypass or real user email/name.
- [x] Profile menu shows email + sign out works.
- [x] Tab 1 ↔ Tab 2 switch; URL updates `?tab=overview|activity`.
- [x] Direct load `/dashboard?tab=activity` selects correct tab.
- [x] Stub routes (`/dashboard/products`, etc.) render inside shell.
- [x] Refresh `/dashboard` — session restore + shell still works (dev bypass).
- [ ] Viewport &lt; 768px — sidebar polish (functional; design pass deferred).

---

## 14. Why this approach

| Decision | Reason |
|----------|--------|
| HeroUI, not PrimeReact | Matches [`admin-setup.md`](./admin-setup.md); avoids dual UI stacks |
| Tailwind shell CSS, not Sakai SCSS | Smaller port; no Prime dependency |
| Icon sidebar 6.4rem | Visual parity with next-app admin users already know |
| Placeholder dashboard data | Unblocks layout/UX before orders/revenue APIs |
| Stub nav for Products/Orders | Shell complete before CRUD; links show roadmap |
| Keep `authChecker` per page | Minimal change to proven auth flow |
| URL-synced tabs | Same bookmark/share behaviour as next-app dashboard |

---

## 15. Cross-references

- Auth & middleware: [`admin-setup.md`](./admin-setup.md)
- Dev login + Nest API key: [`dev-auth-bypass-spec.md`](./dev-auth-bypass-spec.md)
- Nest admin API (future CRUD): [`../71_Nest_Product_Admin_API.md`](../71_Nest_Product_Admin_API.md)
- next-app reference: `next-app/layout/layout.tsx`, `next-app/pages/pages/dashboard/index.tsx`

---

## 16. Completion summary

| Deliverable | Status |
|-------------|--------|
| Topnav + sidenav shell | Done |
| Profile menu + logout | Done |
| Dashboard welcome + 2 tabs (placeholder data) | Done |
| Stub routes (products, orders, settings) | Done |
| Live dashboard metrics (Phase 3) | **On hold** |
| UI / design polish | **Next** |

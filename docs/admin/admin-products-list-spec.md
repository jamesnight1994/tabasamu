# Admin products list — implementation spec

**Date:** 2026-08-22  
**Status:** Draft — ready to implement  
**Builds on:** [`admin-setup.md`](./admin-setup.md) · [`admin-shell-spec.md`](./admin-shell-spec.md) · [`dev-auth-bypass-spec.md`](./dev-auth-bypass-spec.md)  
**Reference UI:** `next-app/pages/pages/settings/index.tsx` → Users tab (`DewsGrid` + `SettingsToolbar`)  
**Target route:** `/dashboard/products` (replace `AdminComingSoon` stub)  
**API:** Nest `GET/PUT/POST /v1/admin/products` (existing — see `backend/src/products/`)

---

## 1. Goal

Implement a **products listing page** in the Tabasamu admin shell that mirrors the **layout and interaction model** of the next-app Settings → Users grid:

| Reference (next-app) | Target (frontend admin) |
|----------------------|-------------------------|
| PrimeReact `DataTable` | HeroUI v3 **`Table`** + Tailwind |
| `SettingsToolbar` (title + search) | `AdminProductsToolbar` |
| Round icon row actions (edit / deactivate) | `AdminProductsRowActions` (edit / deactivate / publish) |
| `webApiService` → Redux → components | `adminWebApi` + **`adminProductsService`** → Redux → components |
| Client-side search + paginator | Client-side search + paginator (API returns full list today) |

**Phase 1 scope:** Read list + UI parity. Row actions dispatch Redux thunks but **edit navigation and forms are stubs** (toast or no-op). Publish and deactivate call real Nest endpoints where they exist.

**Out of scope (later specs):** Product create/edit drawer, variant editor, image upload, server-side pagination, role-based action visibility.

---

## 2. Reference anatomy (next-app Users listing)

```
SettingsManagement (users branch)
├── SettingsToolbar          ← title + search InputText
└── DewsGrid
    ├── DataTable            ← striped, scrollable, paginator 25/50/100
    │   ├── Column × N       ← from gridConfigs
    │   └── Column (actions) ← rounded icon Buttons
    ├── Empty / skeleton state
    └── Dialogs / FAB       ← user CRUD (products: FAB deferred)
```

Key reference files:

| File | Role |
|------|------|
| `next-app/components/settings/SettingsManagement.tsx` | Toolbar + grid switch |
| `next-app/components/common/DewsGrid.tsx` | Users table + actions + pagination |
| `next-app/redux/slices/settingsSlice.ts` | `fetchUsers`, search filter, loaders |
| `next-app/utils/webApi.tsx` | `webApiService.getAll`, `createRecord`, … |
| `next-app/utils/settingsMenuConfig.ts` | Column config (`gridConfigs`) |

**Layout tokens to mirror:**

```tsx
// SettingsToolbar (next-app)
<div className="flex items-center justify-between px-4 pt-[.25rem] pb-[.2rem] border-b border-gray-100 bg-white shrink-0">
  <h2 className="text-lg font-medium text-gray-700 pt-2">{title}</h2>
  <span className="p-input-icon-left">
    <InputText placeholder="Search..." className="!h-[2.4rem] !pl-9" />
  </span>
</div>

// DewsGrid table shell
<div className="h-px flex flex-col flex-1 overflow-hidden …">
  <DataTable paginator rows={25} rowsPerPageOptions={[25, 50, 100]} scrollHeight="flex" … />
</div>
```

Admin products page should fill **`admin-shell-main`** height the same way dashboard cards do: `flex flex-col flex-1 min-h-0 overflow-hidden`.

---

## 3. NestJS product model → list columns

### 3.1 Source of truth

| Layer | Path |
|-------|------|
| Prisma | `backend/prisma/schema.prisma` → `Product`, `Variant`, `ProductStatus` |
| API mapper | `backend/src/products/product.mapper.ts` → `ApiProduct`, `ApiVariant` |
| Admin routes | `backend/src/products/admin-products.controller.ts` |
| E2E contract | `backend/test/admin-products.e2e-spec.ts` |

### 3.2 `ProductStatus` enum

```prisma
enum ProductStatus {
  draft
  active
  archived
}
```

### 3.3 List response shape (today)

```http
GET /v1/admin/products
GET /v1/admin/products?status=draft|active|archived
X-Admin-Api-Key: <key>
```

```typescript
// Response (ProductsService.list)
type AdminProductsListResponse = {
  items: ApiProduct[];
  nextCursor: null; // no server pagination yet
};

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  flavour: string;
  position: number;
  subscriptionEligible: boolean;
  descriptor: Pending<string>;
  base: Pending<string>;
  forwardNote: Pending<string>;
  status: 'draft' | 'active' | 'archived';
  variants: ApiVariant[];
  images: Array<{ url: string; alt: string; … }>;
  strip: { color: string; label: string };
  seo: Record<string, unknown> | null;
  // Note: createdAt/updatedAt not exposed in ApiProduct today — omit from v1 columns
};

type ApiVariant = {
  id: string;
  productId: string;
  sku: string;
  size: { code: string; millilitres?: number; label?: string };
  price: Pending<ApiMoney>;
  compareAtPrice: ApiMoney | null;
  active: boolean;
  stockOnHand?: number;
};
```

### 3.4 Admin write endpoints (for row actions)

| Action | HTTP | Body | Notes |
|--------|------|------|-------|
| **Publish** | `POST /v1/admin/products/:id/publish` | — | Sets `status → active`. **422** if `descriptor` or `base` missing. |
| **Deactivate** | `PUT /v1/admin/products/:id` | `{ status: 'archived' }` | Uses existing update — no dedicated deactivate route. |
| **Edit** (later) | `PUT /v1/admin/products/:id` | `UpdateProductDto` | Stub in Phase 1. |

### 3.5 Recommended grid columns (Phase 1)

Derived from `ApiProduct` + first variant helpers — mirrors how Users grid uses `gridConfigs`:

| Column key | Label | Source | Cell type |
|------------|-------|--------|-----------|
| `name` | Name | `product.name` | text |
| `slug` | Slug | `product.slug` | text (mono, muted) |
| `status` | Status | `product.status` | status badge |
| `flavour` | Flavour | `product.flavour` | text |
| `primarySku` | SKU | `variants[0]?.sku` | text |
| `stockOnHand` | Stock | sum of `variants[].stockOnHand` | number |
| `subscriptionEligible` | Subscribe | `product.subscriptionEligible` | boolean badge |
| `descriptor` | Descriptor | `product.descriptor` | pending field |
| `actions` | — | — | row actions |

**Not in v1 columns:** `Pending` price fields (D-14), `images`, `seo`, nested variant price — too wide for admin list; detail screen later.

---

## 4. Architecture (service → Redux → components → UI)

Same layering as next-app Settings, adapted to admin folder conventions:

```
app/(admin)/dashboard/products/page.tsx
  └── AdminProductsPage (client)
        ├── useAdminAuth().authChecker()
        ├── dispatch(fetchAdminProducts()) on mount
        └── AdminProductsManagement
              ├── AdminProductsToolbar
              └── AdminProductsGrid
                    ├── HeroUI Table (+ pagination footer)
                    ├── AdminProductsRowActions
                    └── empty / skeleton states

services/admin/admin-products-service.ts
  └── adminProductsService.list | publish | archive

lib/admin/web-api.ts
  └── adminWebApi.getAll | updateRecord | createRecord  ← extend

lib/admin/api-paths.ts
  └── ADMIN_API_PATHS.products*

redux/admin/slices/productsSlice.ts
  └── fetchProducts, publishProduct, archiveProduct, setSearchQuery, selectors

utils/admin/products/
  ├── products-grid-config.ts      ← column definitions
  ├── products-display.ts          ← row mappers, badges, pending labels
  └── products-search.ts           ← client filter
```

### 4.1 Mapping to next-app names

| next-app | Tabasamu admin |
|----------|----------------|
| `webApiService` | `adminWebApi` (extend with generic GET/PUT) |
| `webApiService.getAllLocal` | not needed — Nest uses same `axiosApi` base |
| `settingsSlice` | `productsSlice` |
| `DewsGrid` | `AdminProductsGrid` |
| `SettingsToolbar` | `AdminProductsToolbar` |
| `settingsMenuConfig.gridConfigs` | `products-grid-config.ts` |

---

## 5. File plan

### 5.1 New files

```
frontend/src/
├── lib/admin/
│   └── api-paths.ts                          # extend
│   └── web-api.ts                            # extend (getAll, updateRecord)
├── services/admin/
│   └── admin-products-service.ts             # NEW
├── redux/admin/
│   └── slices/productsSlice.ts               # NEW
│   └── store.ts                              # register reducer
├── utils/admin/products/
│   ├── products-grid-config.ts               # NEW
│   ├── products-display.ts                   # NEW
│   ├── products-types.ts                     # NEW
│   └── products-search.ts                    # NEW
├── components/admin/products/
│   ├── AdminProductsManagement.tsx           # NEW
│   ├── AdminProductsToolbar.tsx              # NEW
│   ├── AdminProductsGrid.tsx                 # NEW
│   ├── AdminProductsRowActions.tsx           # NEW
│   ├── AdminProductsStatusBadge.tsx          # NEW
│   ├── AdminProductsTableSkeleton.tsx        # NEW
│   └── AdminProductsEmptyState.tsx           # NEW
├── styles/admin/
│   └── admin-products.css                    # NEW (table + action button parity)
└── app/(admin)/dashboard/products/
    └── page.tsx                              # replace AdminComingSoon
```

---

## 6. Code samples

### 6.1 API paths

```typescript
// frontend/src/lib/admin/api-paths.ts
export const ADMIN_API_PATHS = {
  // …existing auth paths
  products: '/admin/products',
  product: (id: string) => `/admin/products/${id}`,
  productPublish: (id: string) => `/admin/products/${id}/publish`,
} as const;
```

### 6.2 Extend `adminWebApi`

```typescript
// frontend/src/lib/admin/web-api.ts (additions)
const getAll = async <T>(path: string, params?: Record<string, string>): Promise<T> => {
  applyAuthHeaders();
  const response = await axiosApi.get(path, {
    params,
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

const updateRecord = async <T>(path: string, data: unknown): Promise<T> => {
  applyAuthHeaders();
  const response = await axiosApi.put(path, data, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

const postRecord = async <T>(path: string, data?: unknown): Promise<T> => {
  applyAuthHeaders();
  const response = await axiosApi.post(path, data ?? {}, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return returnApiResponse<T>(response);
};

export const adminWebApi = {
  // …existing
  getAll,
  updateRecord,
  postRecord,
};
```

### 6.3 Types + row view model

```typescript
// frontend/src/utils/admin/products/products-types.ts
import type { ApiProduct } from './products-display'; // or inline

export type AdminProductStatus = 'draft' | 'active' | 'archived';

/** Flattened row for table + search — derived from ApiProduct */
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  flavour: string;
  status: AdminProductStatus;
  position: number;
  subscriptionEligible: boolean;
  primarySku: string | null;
  stockOnHand: number;
  descriptorLabel: string; // resolved Pending display
  canPublish: boolean;
  canArchive: boolean;
};

export type AdminProductsGridColumn = {
  id: keyof AdminProductRow | 'actions';
  label: string;
  type?: 'text' | 'status' | 'boolean' | 'pending' | 'number' | 'actions';
  className?: string;
};
```

```typescript
// frontend/src/utils/admin/products/products-display.ts
import type { AdminProductRow } from './products-types';

type Pending<T> =
  | { available: true; value: T }
  | { available: false; decision: string; note?: string };

export type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  flavour: string;
  position: number;
  subscriptionEligible: boolean;
  descriptor: Pending<string>;
  base: Pending<string>;
  status: 'draft' | 'active' | 'archived';
  variants: Array<{ sku: string; stockOnHand?: number; active: boolean }>;
};

function resolvePendingLabel(field: Pending<string>): string {
  return field.available ? field.value : 'Pending';
}

export function toAdminProductRow(product: ApiProduct): AdminProductRow {
  const activeVariants = product.variants.filter((v) => v.active);
  const primarySku = activeVariants[0]?.sku ?? product.variants[0]?.sku ?? null;
  const stockOnHand = product.variants.reduce(
    (sum, v) => sum + (v.stockOnHand ?? 0),
    0,
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    flavour: product.flavour,
    status: product.status,
    position: product.position,
    subscriptionEligible: product.subscriptionEligible,
    primarySku,
    stockOnHand,
    descriptorLabel: resolvePendingLabel(product.descriptor),
    canPublish: product.status === 'draft',
    canArchive: product.status === 'active',
  };
}
```

### 6.4 Grid column config

```typescript
// frontend/src/utils/admin/products/products-grid-config.ts
import type { AdminProductsGridColumn } from './products-types';

export const ADMIN_PRODUCTS_GRID_COLUMNS: AdminProductsGridColumn[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'slug', label: 'Slug', type: 'text' },
  { id: 'status', label: 'Status', type: 'status' },
  { id: 'flavour', label: 'Flavour', type: 'text' },
  { id: 'primarySku', label: 'SKU', type: 'text' },
  { id: 'stockOnHand', label: 'Stock', type: 'number' },
  { id: 'subscriptionEligible', label: 'Subscribe', type: 'boolean' },
  { id: 'descriptorLabel', label: 'Descriptor', type: 'pending' },
  { id: 'actions', label: '', type: 'actions' },
];
```

### 6.5 Client search

```typescript
// frontend/src/utils/admin/products/products-search.ts
import type { AdminProductRow } from './products-types';

export function filterAdminProducts(
  rows: AdminProductRow[],
  query: string,
): AdminProductRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((row) =>
    [row.name, row.slug, row.flavour, row.primarySku, row.descriptorLabel, row.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)),
  );
}
```

### 6.6 Service layer

```typescript
// frontend/src/services/admin/admin-products-service.ts
import { ADMIN_API_PATHS } from '../../lib/admin/api-paths';
import { adminWebApi } from '../../lib/admin/web-api';
import type { ApiProduct } from '../../utils/admin/products/products-display';

type ListResponse = { items: ApiProduct[]; nextCursor: null };

export const adminProductsService = {
  async list(status?: string): Promise<ApiProduct[]> {
    const params = status ? { status } : undefined;
    const res = await adminWebApi.getAll<ListResponse>(
      ADMIN_API_PATHS.products,
      params,
    );
    return res.items ?? [];
  },

  async publish(id: string): Promise<ApiProduct> {
    return adminWebApi.postRecord<ApiProduct>(ADMIN_API_PATHS.productPublish(id));
  },

  async archive(id: string): Promise<ApiProduct> {
    return adminWebApi.updateRecord<ApiProduct>(ADMIN_API_PATHS.product(id), {
      status: 'archived',
    });
  },
};
```

### 6.7 Redux slice

```typescript
// frontend/src/redux/admin/slices/productsSlice.ts
import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { adminProductsService } from '../../../services/admin/admin-products-service';
import { extractApiErrorMessage } from '../../../lib/admin/extract-api-error';
import { toAdminProductRow } from '../../../utils/admin/products/products-display';
import { filterAdminProducts } from '../../../utils/admin/products/products-search';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';
import type { AdminRootState } from '../store';

type ProductsState = {
  rows: AdminProductRow[];
  listLoader: boolean;
  actionLoader: boolean;
  searchQuery: string;
  page: number;
  rowsPerPage: number;
  error: string | null;
  statusFilter: 'all' | 'draft' | 'active' | 'archived';
};

const initialState: ProductsState = {
  rows: [],
  listLoader: false,
  actionLoader: false,
  searchQuery: '',
  page: 1,
  rowsPerPage: 25,
  error: null,
  statusFilter: 'all',
};

export const fetchAdminProducts = createAsyncThunk(
  'adminProducts/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { statusFilter } = (getState() as AdminRootState).adminProducts;
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const items = await adminProductsService.list(status);
      return items.map(toAdminProductRow);
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to load products'));
    }
  },
);

export const publishAdminProduct = createAsyncThunk(
  'adminProducts/publish',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await adminProductsService.publish(id);
      await dispatch(fetchAdminProducts());
      return id;
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to publish product'));
    }
  },
);

export const archiveAdminProduct = createAsyncThunk(
  'adminProducts/archive',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await adminProductsService.archive(id);
      await dispatch(fetchAdminProducts());
      return id;
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to deactivate product'));
    }
  },
);

const productsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setRowsPerPage(state, action: PayloadAction<number>) {
      state.rowsPerPage = action.payload;
      state.page = 1;
    },
    setStatusFilter(state, action: PayloadAction<ProductsState['statusFilter']>) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.listLoader = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.listLoader = false;
        state.rows = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.listLoader = false;
        state.error = String(action.payload ?? action.error.message);
      })
      .addCase(publishAdminProduct.pending, (state) => {
        state.actionLoader = true;
      })
      .addCase(publishAdminProduct.fulfilled, (state) => {
        state.actionLoader = false;
      })
      .addCase(archiveAdminProduct.pending, (state) => {
        state.actionLoader = true;
      })
      .addCase(archiveAdminProduct.fulfilled, (state) => {
        state.actionLoader = false;
      });
  },
});

export const { setSearchQuery, setPage, setRowsPerPage, setStatusFilter } =
  productsSlice.actions;
export default productsSlice.reducer;

// Selectors
export const selectFilteredProductRows = createSelector(
  [(s: AdminRootState) => s.adminProducts.rows, (s: AdminRootState) => s.adminProducts.searchQuery],
  (rows, searchQuery) => filterAdminProducts(rows, searchQuery),
);

export const selectPaginatedProductRows = createSelector(
  [
    selectFilteredProductRows,
    (s: AdminRootState) => s.adminProducts.page,
    (s: AdminRootState) => s.adminProducts.rowsPerPage,
  ],
  (rows, page, rowsPerPage) => {
    const start = (page - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  },
);

export const selectProductsPaginationMeta = createSelector(
  [selectFilteredProductRows, (s: AdminRootState) => s.adminProducts.page, (s: AdminRootState) => s.adminProducts.rowsPerPage],
  (rows, page, rowsPerPage) => ({
    total: rows.length,
    page,
    rowsPerPage,
    totalPages: Math.max(1, Math.ceil(rows.length / rowsPerPage)),
  }),
);
```

```typescript
// frontend/src/redux/admin/store.ts (register)
import productsReducer from './slices/productsSlice';

export const adminStore = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    adminProducts: productsReducer,
  },
});
```

### 6.8 Toolbar (HeroUI)

```tsx
// frontend/src/components/admin/products/AdminProductsToolbar.tsx
'use client';

import { Search } from 'lucide-react';
import { Input } from '@heroui/react';

type AdminProductsToolbarProps = {
  title?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export function AdminProductsToolbar({
  title = 'Products',
  searchQuery,
  onSearchChange,
}: AdminProductsToolbarProps) {
  return (
    <div className="admin-products-toolbar flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-4 pb-2 pt-1">
      <h2 className="pt-2 font-body text-lg font-medium text-zinc-700">{title}</h2>
      <div className="relative w-full max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <Input
          aria-label="Search products"
          className="h-10 pl-9"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
```

### 6.9 Row actions (round icon buttons — next-app parity)

```tsx
// frontend/src/components/admin/products/AdminProductsRowActions.tsx
'use client';

import { Ban, Pencil, UploadCloud } from 'lucide-react';
import { Button } from '@heroui/react';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';

type AdminProductsRowActionsProps = {
  row: AdminProductRow;
  disabled?: boolean;
  onEdit: (row: AdminProductRow) => void;
  onPublish: (row: AdminProductRow) => void;
  onDeactivate: (row: AdminProductRow) => void;
};

export function AdminProductsRowActions({
  row,
  disabled,
  onEdit,
  onPublish,
  onDeactivate,
}: AdminProductsRowActionsProps) {
  return (
    <div className="flex gap-2 pr-3">
      <Button
        isIconOnly
        aria-label={`Edit ${row.name}`}
        className="admin-products-action admin-products-action--edit size-11 min-h-11 min-w-11 rounded-full"
        isDisabled={disabled}
        variant="secondary"
        onPress={() => onEdit(row)}
      >
        <Pencil size={18} aria-hidden />
      </Button>

      {row.canPublish ? (
        <Button
          isIconOnly
          aria-label={`Publish ${row.name}`}
          className="admin-products-action admin-products-action--publish size-11 min-h-11 min-w-11 rounded-full"
          isDisabled={disabled}
          variant="secondary"
          onPress={() => onPublish(row)}
        >
          <UploadCloud size={18} aria-hidden />
        </Button>
      ) : null}

      {row.canArchive ? (
        <Button
          isIconOnly
          aria-label={`Deactivate ${row.name}`}
          className="admin-products-action admin-products-action--deactivate size-11 min-h-11 min-w-11 rounded-full"
          isDisabled={disabled}
          variant="secondary"
          onPress={() => onDeactivate(row)}
        >
          <Ban size={18} aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
```

```css
/* frontend/src/styles/admin/admin-products.css */
.admin-products-action--edit {
  background-color: #eff6ff;
  color: #2563eb;
}
.admin-products-action--edit:hover {
  background-color: #dbeafe;
}
.admin-products-action--publish {
  background-color: #ecfdf5;
  color: #059669;
}
.admin-products-action--publish:hover {
  background-color: #d1fae5;
}
.admin-products-action--deactivate {
  background-color: #fef2f2;
  color: #dc2626;
}
.admin-products-action--deactivate:hover {
  background-color: #fee2e2;
}
```

### 6.10 Grid + HeroUI Table

```tsx
// frontend/src/components/admin/products/AdminProductsGrid.tsx (sketch)
'use client';

import { Table } from '@heroui/react';
import { ADMIN_PRODUCTS_GRID_COLUMNS } from '../../../utils/admin/products/products-grid-config';
import { AdminProductsRowActions } from './AdminProductsRowActions';
import { AdminProductsStatusBadge } from './AdminProductsStatusBadge';
import { AdminProductsTableSkeleton } from './AdminProductsTableSkeleton';
import { AdminProductsEmptyState } from './AdminProductsEmptyState';
import type { AdminProductRow } from '../../../utils/admin/products/products-types';

export function AdminProductsGrid({ rows, loading, actionLoading, onEdit, onPublish, onDeactivate }: {
  rows: AdminProductRow[];
  loading: boolean;
  actionLoading: boolean;
  onEdit: (row: AdminProductRow) => void;
  onPublish: (row: AdminProductRow) => void;
  onDeactivate: (row: AdminProductRow) => void;
}) {
  if (loading) return <AdminProductsTableSkeleton columns={ADMIN_PRODUCTS_GRID_COLUMNS.length} rows={6} />;
  if (!rows.length) return <AdminProductsEmptyState />;

  return (
    <div className="admin-products-grid flex min-h-0 flex-1 flex-col overflow-hidden">
      <Table aria-label="Products" className="admin-products-table flex-1">
        <Table.ScrollContainer>
          <Table.Content>
            <Table.Header>
              {ADMIN_PRODUCTS_GRID_COLUMNS.filter((c) => c.type !== 'actions').map((col) => (
                <Table.Column key={col.id} id={col.id}>{col.label}</Table.Column>
              ))}
              <Table.Column id="actions" aria-label="Actions" />
            </Table.Header>
            <Table.Body items={rows}>
              {(row: AdminProductRow) => (
                <Table.Row id={row.id}>
                  {/* map columns → Table.Cell with type-specific renderers */}
                  <Table.Cell>
                    <AdminProductsRowActions
                      row={row}
                      disabled={actionLoading}
                      onEdit={onEdit}
                      onPublish={onPublish}
                      onDeactivate={onDeactivate}
                    />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
      {/* AdminProductsPagination — client-side, mirrors Prime paginator template */}
    </div>
  );
}
```

### 6.11 Page shell

```tsx
// frontend/src/app/(admin)/dashboard/products/page.tsx
'use client';

import { useEffect } from 'react';
import { useAdminAuth } from '../../../../components/admin/AdminAuthProvider';
import { AdminProductsManagement } from '../../../../components/admin/products/AdminProductsManagement';
import { useAppDispatch } from '../../../../redux/admin/hooks';
import { fetchAdminProducts } from '../../../../redux/admin/slices/productsSlice';

export default function AdminProductsPage() {
  const dispatch = useAppDispatch();
  const { authChecker } = useAdminAuth();

  useEffect(() => {
    authChecker();
  }, [authChecker]);

  useEffect(() => {
    void dispatch(fetchAdminProducts());
  }, [dispatch]);

  return (
    <div className="flex h-[calc(100vh-4.25rem)] min-h-0 flex-col overflow-hidden bg-zinc-50 p-4">
      <div className="admin-products-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-md">
        <AdminProductsManagement />
      </div>
    </div>
  );
}
```

### 6.12 Stub handlers (Phase 1 — unwired edit)

```typescript
// AdminProductsManagement.tsx
const handleEdit = (row: AdminProductRow) => {
  // Phase 1: no route yet
  console.info('[admin] edit product stub', row.id);
  // Optional: toast.info('Product editor coming soon');
};

const handlePublish = (row: AdminProductRow) => {
  void dispatch(publishAdminProduct(row.id));
};

const handleDeactivate = (row: AdminProductRow) => {
  void dispatch(archiveAdminProduct(row.id));
};
```

---

## 7. UI parity checklist (vs next-app Users grid)

| Element | next-app | Admin products target |
|---------|----------|------------------------|
| Page title | `SettingsToolbar` h2 | `AdminProductsToolbar` h2 |
| Search | Prime `InputText` + icon | HeroUI `Input` + Lucide `Search` |
| Table density | `p-datatable-sm` | Compact HeroUI `Table` + `text-sm` cells |
| Striped rows | `stripedRows` | Alternating `bg-zinc-50/50` on even rows |
| Pagination | 25 / 50 / 100 | Same options, client-side |
| Row actions | ~2.8rem round buttons, tinted bg | ~2.75rem (`size-11`) round HeroUI buttons |
| Loading | `DataTableSkeleton` | `AdminProductsTableSkeleton` |
| Empty | Icon + helper text | Package icon + “No products yet” |
| Full height | `flex-1 overflow-hidden` | Same in products card |

---

## 8. Phased implementation

### Phase 1 — Foundation (types, API, Redux)

- [ ] Extend `ADMIN_API_PATHS` + `adminWebApi` (`getAll`, `updateRecord`, `postRecord`)
- [ ] Add `admin-products-service.ts`
- [ ] Add `products-types`, `products-display`, `products-search`, `products-grid-config`
- [ ] Add `productsSlice` + register in `adminStore`
- [ ] Unit-test `toAdminProductRow`, `filterAdminProducts` (optional but recommended)

**Exit:** `fetchAdminProducts` returns mapped rows against local Nest with dev bypass key.

### Phase 2 — UI shell (no mutations)

- [ ] `AdminProductsToolbar`, `AdminProductsGrid`, skeleton, empty state
- [ ] HeroUI `Table` with all columns + status/pending renderers
- [ ] Client pagination footer component
- [ ] `admin-products.css` + import in `AdminUiProvider`
- [ ] Replace `/dashboard/products` stub page

**Exit:** Products list renders seeded Nest data; search + pagination work client-side.

### Phase 3 — Row actions (wired to API)

- [ ] `AdminProductsRowActions` with edit / publish / deactivate
- [ ] `publishAdminProduct` + `archiveAdminProduct` thunks
- [ ] Toast feedback on success/error (HeroUI `Toast`, same pattern as login)
- [ ] Disable actions while `actionLoader`
- [ ] **Edit remains stub** (log or toast only)

**Exit:** Publish and deactivate update list after API call; edit shows “coming soon”.

### Phase 4 — Confirmations + polish

- [ ] Confirm modal before publish (warn on missing descriptor/base — handle 422 message)
- [x] Confirm modal before deactivate
- [ ] Status filter tabs or dropdown (`all | draft | active | archived`) — optional
- [ ] Match admin shell spacing / full-height behavior
- [ ] Mobile: horizontal scroll on table

**Exit:** UX parity with next-app settings list; safe destructive actions.

### Phase 5 — Edit/create (separate spec)

- [ ] `/dashboard/products/[id]` or side drawer
- [ ] Forms for `UpdateProductDto` / `CreateProductDto`
- [ ] Wire edit button → editor route
- [ ] FAB “Add product” (mirrors next-app `FloatingButton` on other settings tabs)

---

## 9. Environment & auth

Same as existing admin stack:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
NEXT_PUBLIC_ADMIN_AUTH_BYPASS=true
NEXT_PUBLIC_ADMIN_API_KEY=dev-admin-key-change-me
```

`adminWebApi.applyAuthHeaders()` attaches `X-Admin-Api-Key` under dev bypass — required for `GET /v1/admin/products`.

---

## 10. Testing plan

| Check | How |
|-------|-----|
| List loads | `/dashboard/products` with bypass → rows from seed |
| Search | Filter by name, slug, SKU |
| Pagination | 25/50/100, page next/prev |
| Publish draft | Draft with descriptor+base → status `active` |
| Publish blocked | Draft missing base → 422 toast with `missing[]` |
| Deactivate | Active → `archived` via PUT |
| Edit stub | Click edit → no navigation, no crash |
| 401 | Wrong API key → admin auth redirect / error toast |

**Backend contract:** `yarn test:e2e -- test/admin-products.e2e-spec.ts` in `backend/`.

---

## 11. Open questions / follow-ups

1. **`updatedAt` column** — Prisma has it; `ApiProduct` does not expose it. Add to mapper in a small backend PR if needed for “Last updated” column.
2. **Server pagination** — `nextCursor` is always `null` today; client pagination is correct for catalogue size (~dozen SKUs). Revisit when catalogue grows.
3. **Dedicated archive endpoint** — Phase 1 uses `PUT { status: 'archived' }`; add `POST …/archive` later if audit requirements differ from update.
4. **Reactivate archived product** — Not in Phase 1; would be `PUT { status: 'draft' }` or `'active'`.
5. **Price column** — Remains Pending (D-14); do not show raw demo amounts in admin list until approved.

---

## 12. Related docs

- [`admin-shell-spec.md`](./admin-shell-spec.md) — nav link `/dashboard/products` already stubbed
- [`admin-setup.md`](./admin-setup.md) — `adminWebApi`, Redux, HeroUI patterns
- [`backend/README.md`](../../backend/README.md) — admin products endpoints
- Nest skill: `.cursor/skills/nestjs-backend/SKILL.md`

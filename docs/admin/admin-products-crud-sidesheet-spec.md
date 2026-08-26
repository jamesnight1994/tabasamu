# Admin products CRUD side sheet — implementation spec

**Date:** 2026-08-23  
**Status:** Draft — ready to implement  
**Builds on:** [`admin-products-list-spec.md`](./admin-products-list-spec.md) · [`admin-setup.md`](./admin-setup.md) · [`admin-shell-spec.md`](./admin-shell-spec.md)  
**Reference UI:** next-app **Questionnaire hub → Sections** (`QuestionnaireHubManagement` + `QuestionnaireSectionSideSheet`)  
**Target route:** `/dashboard/products` (list stays; create/edit opens a **single** side sheet overlay)

---

## 1. Goal

Implement **create and update product** flows in the Tabasamu admin shell using the same **workflow architecture** as next-app questionnaire section CRUD:

| Reference (next-app) | Target (frontend admin) |
|----------------------|-------------------------|
| `FloatingButton` FAB on listing | `AdminProductsFloatingButton` |
| `openSectionSheet({ context, item? })` | `openProductSheet({ context, item? })` |
| `QuestionnaireSectionSideSheet` (always mounted) | `AdminProductsSideSheet` (always mounted) |
| `DewsSideSheet` + `DewsForm` | HeroUI **`Drawer`** + `react-hook-form` + HeroUI fields |
| `createSection` / `updateSection` thunks | `createAdminProduct` / `updateAdminProduct` thunks |
| PrimeReact Toast via slice helper | HeroUI **`Toast.toast.success` / `.danger`** |
| Submit button `loading={submitLoader}` | Submit button `isPending` / spinner while `createLoader \|\| updateLoader` |
| Config-driven fields (`SectionForm`) | Config-driven sections (`PRODUCT_FORM_SECTIONS`) |

### 1.1 UX requirements (explicit)

1. **Single sheet instance** — one `AdminProductsSideSheet` mounted under `AdminProductsManagement`; visibility driven by Redux (`productSheet.visible`), not route changes.
2. **Width** — sheet occupies **50% of viewport width** on `md+`; full width on small screens.
3. **Bordered form sections** — grouped fields inside bordered cards (unlike next-app section form which is flat).
4. **Add FAB** — bottom-right floating “+” button (mirrors next-app `FloatingButton` on questionnaire hub).
5. **Edit** — row pencil opens same sheet prefilled from selected product.
6. **Submit loader** — disable Cancel + Submit while create/update in flight; show loading on primary button.
7. **Toast** — success on create/update; error toast with API message on failure (same stack as login).
8. **Edit load source (required)** — update mode **must** prefill from the **cached admin list** (`items: NestApiProduct[]` in Redux from the last `fetchAdminProducts`). Do **not** call a per-product GET on edit in Phases 0–5. If the product is missing from cache, show an error toast and refuse to open the sheet.

### 1.2 Out of scope (later specs)

- Variant editor (multi-SKU CRUD after create)
- Image upload / gallery management
- SEO JSON editor (beyond a simple title field if added later)
- Server-side pagination changes
- Role-based FAB visibility (admin API key is sufficient for now)

---

## 2. Reference workflow (next-app sections)

### 2.1 Data flow

```
QuestionnaireHubManagement
  ├─ FAB onAdd → dispatch(openSectionSheet({ context: 'addSection' }))
  ├─ Row edit → dispatch(openSectionSheet({ context: 'updateSection', item: row }))
  └─ QuestionnaireSectionSideSheet (always mounted)
       ├─ useSelector(sectionSheet, submitLoader)
       ├─ getSectionSheetConfig(context) → title, fields, submitLabel
       ├─ useForm + useEffect reset() when visible (prefill on edit)
       └─ onSubmit → createSection | updateSection
            → webApiService → toast → closeSectionSheet → refresh list
```

### 2.2 Key reference files

| File | Role |
|------|------|
| `next-app/components/questionnaires/QuestionnaireHubManagement.tsx` | FAB + edit handlers + mounts sheet |
| `next-app/components/questionnaires/QuestionnaireSectionSideSheet.tsx` | Form + submit wiring |
| `next-app/components/common/DewsSideSheet.tsx` | Sheet shell (header / scroll body / footer) |
| `next-app/components/common/FloatingButton.tsx` | Blue circular FAB |
| `next-app/redux/slices/questionnaireAdminSlice.ts` | `sectionSheet` state, thunks, toast helpers |
| `next-app/utils/questionnaireSheetConfig.ts` | Context config + payload builders |

### 2.3 Patterns to port verbatim (conceptually)

**Redux-owned sheet state**

```typescript
// questionnaireAdminSlice (reference)
sectionSheet: {
  visible: boolean;
  context: 'addSection' | 'updateSection' | null;
  item: Section | null;
}
```

**Prefill on edit**

```typescript
// QuestionnaireSectionSideSheet (reference)
useEffect(() => {
  if (!visible || !config) return;
  if (config.isUpdate && sectionSheet.item) {
    reset({ title: sectionSheet.item.title, order: sectionSheet.item.order });
  } else {
    reset(buildEmptyDefaults(nextOrder));
  }
}, [visible, config, sectionSheet.item, nextOrder, reset]);
```

**Thunk owns side effects**

```typescript
// questionnaireAdminSlice (reference)
await webApiService.createRecord(path, payload);
showToast('success', 'Section added successfully');
dispatch(closeSectionSheet());
await dispatch(fetchQuestionnaireById(selectedQuestionnaire.id));
```

**Admin equivalent for toast**

```typescript
import { Toast } from '@heroui/react';

Toast.toast.success('Product created', {
  description: 'The product was saved as a draft.',
});
Toast.toast.danger('Could not save product', { description: message });
```

---

## 3. Nest API contract

### 3.1 Routes (existing)

| Action | HTTP | Path | Body |
|--------|------|------|------|
| List | `GET` | `/v1/admin/products` | — |
| Create | `POST` | `/v1/admin/products` | `CreateProductDto` |
| Update | `PUT` | `/v1/admin/products/:id` | `UpdateProductDto` |
| Publish | `POST` | `/v1/admin/products/:id/publish` | — |

**No admin GET by id today.** Edit prefill uses **only** the cached list (`items` in Redux). After every successful `fetchAdminProducts`, store the raw `NestApiProduct[]` alongside flattened table rows. `selectProductSheetProduct` resolves `productSheet.productId` against that cache — never a network fetch on edit open.

```typescript
// Required pattern — edit open (AdminProductsManagement)
const cached = items.find((item) => item.id === row.id);
if (!cached) {
  showAdminError('Product unavailable', 'Refresh the list and try again.');
  return;
}
dispatch(openProductSheet({ context: 'updateProduct', productId: row.id }));
```

Phase 6 may add `GET /v1/admin/products/:id` for deep links / stale cache recovery only — **not** the default edit path.

### 3.2 DTOs (`backend/src/products/dto/product.dto.ts`)

**CreateProductDto** (required: `slug`, `name`)

```typescript
type CreateProductDto = {
  id?: string;
  slug: string;
  name: string;
  flavour?: string;
  position?: number;
  status?: 'draft' | 'active' | 'archived';
  subscriptionEligible?: boolean;
  descriptor?: string | null;
  base?: string | null;
  forwardNote?: string | null;
  seo?: Record<string, unknown> | null;
  variants?: CreateVariantDto[];
  images?: CreateImageDto[];
};

type CreateVariantDto = {
  sku: string;
  sizeCode?: string;
  millilitres?: number;
  priceAmount?: number | null;
  currency?: string;
  compareAt?: number | null;
  active?: boolean;
  stockOnHand?: number;
};
```

**UpdateProductDto** (all optional; **no slug**, **no variants**)

```typescript
type UpdateProductDto = {
  name?: string;
  flavour?: string;
  position?: number;
  status?: 'draft' | 'active' | 'archived';
  subscriptionEligible?: boolean;
  descriptor?: string | null;
  base?: string | null;
  forwardNote?: string | null;
  seo?: Record<string, unknown> | null;
};
```

### 3.3 Pending fields → form values

API list/detail returns `descriptor`, `base`, `forwardNote` as `NestPending<string>`:

```typescript
type NestPending<T> =
  | { available: true; value: T }
  | { available: false; decision: string; note?: string };
```

Form uses plain strings. Map on load / save:

```typescript
// utils/admin/products/products-form-mappers.ts

export function pendingToInput(field?: NestPending<string>): string {
  if (!field) return '';
  return field.available ? (field.value ?? '') : '';
}

export function inputToNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
```

---

## 4. Architecture

### 4.1 Layer diagram

```
┌─────────────────────────────────────────────────────────────┐
│ AdminProductsManagement                                      │
│  ├─ AdminProductsToolbar / Grid / Pagination                │
│  ├─ AdminProductsFloatingButton                             │
│  └─ AdminProductsSideSheet  ← single instance, Redux-driven │
└───────────────────────────┬─────────────────────────────────┘
                            │ useAppDispatch / useAppSelector
┌───────────────────────────▼─────────────────────────────────┐
│ redux/admin/slices/productsSlice.ts                          │
│  productSheet state · create/update thunks · loaders         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ services/admin/admin-products-service.ts                     │
│  list · create · update · publish · archive                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ lib/admin/web-api.ts + api-paths.ts                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                     Nest /v1/admin/products
```

### 4.2 Utils layout

```
frontend/src/utils/admin/products/
├── products-types.ts              # extend with sheet context + form types
├── products-display.ts            # existing list row mapper
├── products-grid-config.ts
├── products-search.ts
├── products-form-config.ts        # NEW — section + field definitions
├── products-form-defaults.ts      # NEW — empty defaults + next position
├── products-form-mappers.ts       # NEW — API ↔ form, build create/update payloads
└── products-form-schema.ts        # NEW — yup validation (mirror login form stack)
```

### 4.3 Components layout

```
frontend/src/components/admin/
├── common/
│   ├── AdminSideSheet.tsx         # NEW — reusable HeroUI Drawer shell (50% width preset)
│   └── AdminFloatingButton.tsx    # NEW — FAB (next-app parity)
└── products/
    ├── AdminProductsManagement.tsx      # wire FAB + sheet + edit handler
    ├── AdminProductsSideSheet.tsx       # NEW — create/update orchestrator
    ├── AdminProductsForm.tsx            # NEW — bordered sections renderer
    ├── AdminProductsFormSection.tsx     # NEW — titled bordered group wrapper
    └── … (existing list components)
```

### 4.4 Styles

```
frontend/src/styles/admin/admin-products.css   # extend with sheet + section borders
frontend/src/styles/admin/admin-side-sheet.css # NEW optional — drawer width tokens
```

---

## 5. Form design

### 5.1 Sections (bordered groups)

Phase 1 form groups — each wrapped in `AdminProductsFormSection`:

| Section | Fields | Create | Update |
|---------|--------|--------|--------|
| **Basics** | `name`, `slug`, `flavour`, `position`, `subscriptionEligible` | ✓ | slug **read-only** |
| **Copy** | `descriptor`, `base`, `forwardNote` | ✓ | ✓ |
| **Primary variant** | `primarySku`, `stockOnHand` | ✓ (creates one variant) | **read-only display** from cached product |

> **Note:** `UpdateProductDto` cannot change SKU/stock. Show primary variant as read-only on edit; link to future variant spec for changes.

### 5.2 Form values type

```typescript
// utils/admin/products/products-types.ts

export type ProductSheetContext = 'addProduct' | 'updateProduct';

export type AdminProductFormValues = {
  name: string;
  slug: string;
  flavour: string;
  position: number;
  subscriptionEligible: boolean;
  descriptor: string;
  base: string;
  forwardNote: string;
  primarySku: string;
  stockOnHand: number;
};
```

### 5.3 Field config (declarative — mirrors `SectionForm`)

```typescript
// utils/admin/products/products-form-config.ts

import type { AdminProductFormValues } from './products-types';

export type ProductFormFieldType = 'text' | 'number' | 'boolean' | 'select';

export type ProductFormFieldConfig = {
  key: keyof AdminProductFormValues;
  label: string;
  type: ProductFormFieldType;
  required?: boolean;
  placeholder?: string;
  /** Hide on update (e.g. slug) or create-only variant fields */
  modes?: Array<'addProduct' | 'updateProduct'>;
  readOnlyOnUpdate?: boolean;
  options?: Array<{ label: string; value: string }>;
};

export type ProductFormSectionConfig = {
  id: string;
  title: string;
  description?: string;
  fields: ProductFormFieldConfig[];
};

export const PRODUCT_FORM_SECTIONS: ProductFormSectionConfig[] = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Identity and catalogue ordering.',
    fields: [
      { key: 'name', label: 'Product name', type: 'text', required: true, placeholder: 'Grape & Ginger' },
      { key: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'grape-ginger', readOnlyOnUpdate: true },
      {
        key: 'flavour',
        label: 'Flavour',
        type: 'select',
        required: true,
        options: [
          { label: 'Grape & Ginger', value: 'grape-ginger' },
          { label: 'Pineapple', value: 'pineapple' },
          { label: 'Pineapple Ginger', value: 'pineapple-ginger' },
          { label: 'Passion', value: 'passion' },
          // import FLAVOUR_SLUGS from domain/catalogue for single source
        ],
      },
      { key: 'position', label: 'Position', type: 'number', required: true },
      { key: 'subscriptionEligible', label: 'Subscription eligible', type: 'boolean' },
    ],
  },
  {
    id: 'copy',
    title: 'Copy',
    description: 'Descriptor and tasting notes shown on the storefront when approved.',
    fields: [
      { key: 'descriptor', label: 'Descriptor', type: 'text', placeholder: 'Short product descriptor' },
      { key: 'base', label: 'Base', type: 'text', placeholder: 'e.g. Sparkling water base' },
      { key: 'forwardNote', label: 'Forward note', type: 'text', placeholder: 'Optional forward note' },
    ],
  },
  {
    id: 'variant',
    title: 'Primary variant',
    description: 'Initial SKU and stock. Additional variants come in a later editor.',
    fields: [
      { key: 'primarySku', label: 'SKU', type: 'text', required: true, modes: ['addProduct'] },
      { key: 'stockOnHand', label: 'Stock on hand', type: 'number', modes: ['addProduct'] },
    ],
  },
];
```

### 5.4 Defaults + prefill

```typescript
// utils/admin/products/products-form-defaults.ts

import type { NestApiProduct } from '../../../adapters/http/map-nest-product';
import type { AdminProductFormValues } from './products-types';
import { pendingToInput } from './products-form-mappers';

export function buildEmptyProductFormDefaults(nextPosition: number): AdminProductFormValues {
  return {
    name: '',
    slug: '',
    flavour: 'grape-ginger',
    position: nextPosition,
    subscriptionEligible: true,
    descriptor: '',
    base: '',
    forwardNote: '',
    primarySku: '',
    stockOnHand: 0,
  };
}

export function productToFormValues(product: NestApiProduct): AdminProductFormValues {
  const primary = product.variants?.find((v) => v.active) ?? product.variants?.[0];

  return {
    name: product.name,
    slug: product.slug,
    flavour: product.flavour,
    position: product.position,
    subscriptionEligible: product.subscriptionEligible,
    descriptor: pendingToInput(product.descriptor),
    base: pendingToInput(product.base),
    forwardNote: pendingToInput(product.forwardNote),
    primarySku: primary?.sku ?? '',
    stockOnHand: primary?.stockOnHand ?? 0,
  };
}

export function computeNextProductPosition(products: NestApiProduct[]): number {
  if (!products.length) return 1;
  return Math.max(...products.map((p) => p.position ?? 0)) + 1;
}
```

### 5.5 Payload builders

```typescript
// utils/admin/products/products-form-mappers.ts

import type { NestApiProduct } from '../../../adapters/http/map-nest-product';
import type { AdminProductFormValues } from './products-types';

export function buildCreateProductPayload(values: AdminProductFormValues) {
  return {
    slug: values.slug.trim(),
    name: values.name.trim(),
    flavour: values.flavour,
    position: values.position,
    subscriptionEligible: values.subscriptionEligible,
    status: 'draft' as const,
    descriptor: inputToNullableString(values.descriptor),
    base: inputToNullableString(values.base),
    forwardNote: inputToNullableString(values.forwardNote),
    variants: [
      {
        sku: values.primarySku.trim(),
        stockOnHand: values.stockOnHand,
        active: true,
        sizeCode: '1l',
        millilitres: 1000,
      },
    ],
  };
}

export function buildUpdateProductPayload(values: AdminProductFormValues) {
  return {
    name: values.name.trim(),
    flavour: values.flavour,
    position: values.position,
    subscriptionEligible: values.subscriptionEligible,
    descriptor: inputToNullableString(values.descriptor),
    base: inputToNullableString(values.base),
    forwardNote: inputToNullableString(values.forwardNote),
  };
}
```

### 5.6 Validation (yup)

```typescript
// utils/admin/products/products-form-schema.ts

import * as Yup from 'yup';

export const adminProductCreateSchema = Yup.object({
  name: Yup.string().trim().required('Product name is required'),
  slug: Yup.string()
    .trim()
    .required('Slug is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens'),
  flavour: Yup.string().required('Flavour is required'),
  position: Yup.number().integer().min(0).required('Position is required'),
  subscriptionEligible: Yup.boolean().required(),
  primarySku: Yup.string().trim().required('SKU is required'),
  stockOnHand: Yup.number().integer().min(0).required('Stock is required'),
  descriptor: Yup.string(),
  base: Yup.string(),
  forwardNote: Yup.string(),
});

export const adminProductUpdateSchema = adminProductCreateSchema.omit(['slug', 'primarySku', 'stockOnHand']);
```

---

## 6. Service layer

Extend `frontend/src/services/admin/admin-products-service.ts`:

```typescript
import type { NestApiProduct } from '../../adapters/http/map-nest-product';
import { ADMIN_API_PATHS } from '../../lib/admin/api-paths';
import { adminWebApi } from '../../lib/admin/web-api';

export type CreateAdminProductPayload = ReturnType<typeof buildCreateProductPayload>;
export type UpdateAdminProductPayload = ReturnType<typeof buildUpdateProductPayload>;

export const adminProductsService = {
  // … existing list, publish, archive

  async create(payload: CreateAdminProductPayload): Promise<NestApiProduct> {
    return adminWebApi.createRecord<NestApiProduct>(ADMIN_API_PATHS.products, payload);
  },

  async update(id: string, payload: UpdateAdminProductPayload): Promise<NestApiProduct> {
    return adminWebApi.updateRecord<NestApiProduct>(ADMIN_API_PATHS.product(id), payload);
  },

  /** Resolve full product for edit — Phase 1: from in-memory cache */
  findCachedById(items: NestApiProduct[], id: string): NestApiProduct | undefined {
    return items.find((item) => item.id === id);
  },
};
```

`adminWebApi.createRecord` / `updateRecord` already exist in `lib/admin/web-api.ts`.

---

## 7. Redux slice extensions

### 7.1 State additions

```typescript
// redux/admin/slices/productsSlice.ts

type ProductSheetState = {
  visible: boolean;
  context: ProductSheetContext | null;
  productId: string | null; // edit target id
};

type ProductsState = {
  rows: AdminProductRow[];
  items: NestApiProduct[]; // NEW — raw API cache for edit prefill
  listLoader: boolean;
  actionLoader: boolean;
  createLoader: boolean;   // NEW
  updateLoader: boolean;   // NEW
  productSheet: ProductSheetState;
  // … existing search, pagination, statusFilter, error
};

const initialProductSheet: ProductSheetState = {
  visible: false,
  context: null,
  productId: null,
};
```

Update `fetchAdminProducts` to persist both:

```typescript
const items = await adminProductsService.list(status);
return {
  rows: items.map(toAdminProductRow),
  items,
};
```

### 7.2 Sheet reducers

```typescript
openProductSheet(
  state,
  action: PayloadAction<{ context: ProductSheetContext; productId?: string }>,
) {
  state.productSheet = {
    visible: true,
    context: action.payload.context,
    productId: action.payload.productId ?? null,
  };
},
closeProductSheet(state) {
  state.productSheet = initialProductSheet;
},
```

### 7.3 Thunks with toast + close + refresh

```typescript
import { Toast } from '@heroui/react';
import { extractApiErrorMessage } from '../../../lib/admin/extract-api-error';

function showProductToast(severity: 'success' | 'error', title: string, description?: string) {
  if (severity === 'success') {
    Toast.toast.success(title, description ? { description } : undefined);
    return;
  }
  Toast.toast.danger(title, description ? { description } : undefined);
}

export const createAdminProduct = createAsyncThunk(
  'adminProducts/create',
  async (formValues: AdminProductFormValues, { dispatch, rejectWithValue }) => {
    try {
      const payload = buildCreateProductPayload(formValues);
      await adminProductsService.create(payload);
      showProductToast('success', 'Product created', 'The product was saved as a draft.');
      dispatch(closeProductSheet());
      await dispatch(fetchAdminProducts());
      return true;
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to create product');
      showProductToast('error', 'Could not create product', message);
      return rejectWithValue(message);
    }
  },
);

export const updateAdminProduct = createAsyncThunk(
  'adminProducts/update',
  async (
    { id, formValues }: { id: string; formValues: AdminProductFormValues },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const payload = buildUpdateProductPayload(formValues);
      await adminProductsService.update(id, payload);
      showProductToast('success', 'Product updated', 'Changes were saved successfully.');
      dispatch(closeProductSheet());
      await dispatch(fetchAdminProducts());
      return true;
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to update product');
      showProductToast('error', 'Could not update product', message);
      return rejectWithValue(message);
    }
  },
);
```

### 7.4 Selectors

```typescript
export const selectProductSheet = (state: AdminRootState) => state.adminProducts.productSheet;

export const selectProductSheetSubmitLoader = (state: AdminRootState) =>
  state.adminProducts.createLoader || state.adminProducts.updateLoader;

export const selectProductSheetProduct = createSelector(
  [(state: AdminRootState) => state.adminProducts.items, selectProductSheet],
  (items, sheet) =>
    sheet.productId ? items.find((item) => item.id === sheet.productId) ?? null : null,
);

export const selectProductSheetConfig = createSelector([selectProductSheet], (sheet) => {
  if (!sheet.context) return null;
  return PRODUCT_SHEET_CONFIGS[sheet.context];
});
```

### 7.5 Sheet context config (mirrors `SECTION_SHEET_CONFIGS`)

```typescript
// utils/admin/products/products-form-config.ts

export const PRODUCT_SHEET_CONFIGS = {
  addProduct: {
    context: 'addProduct' as const,
    title: 'Add product',
    submitLabel: 'Save',
    isUpdate: false,
    schema: adminProductCreateSchema,
  },
  updateProduct: {
    context: 'updateProduct' as const,
    title: 'Update product',
    submitLabel: 'Update',
    isUpdate: true,
    schema: adminProductUpdateSchema,
  },
} satisfies Record<ProductSheetContext, ProductSheetConfig>;
```

---

## 8. UI components

### 8.1 Reusable side sheet shell (`AdminSideSheet`)

HeroUI v3 `Drawer` with **right placement**, **50% width**, admin topnav offset.

```tsx
// components/admin/common/AdminSideSheet.tsx
'use client';

import { Drawer, Button } from '@heroui/react';
import { X } from 'lucide-react';

type AdminSideSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** default 'half' → 50vw */
  width?: 'half' | 'md';
};

export function AdminSideSheet({
  open,
  title,
  description,
  onClose,
  footer,
  children,
  width = 'half',
}: AdminSideSheetProps) {
  return (
    <Drawer isOpen={open} onOpenChange={(next) => !next && onClose()}>
      <Drawer.Backdrop isDismissable />
      <Drawer.Content
        placement="right"
        className={`admin-side-sheet admin-side-sheet--${width} flex flex-col`}
      >
        <Drawer.Dialog className="flex h-full min-h-0 flex-col">
          <Drawer.Header className="shrink-0 border-b border-zinc-100 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Drawer.Heading className="font-body text-lg font-medium text-zinc-800">
                  {title}
                </Drawer.Heading>
                {description ? (
                  <p className="mt-1 font-body text-sm text-zinc-500">{description}</p>
                ) : null}
              </div>
              <Button
                isIconOnly
                aria-label="Close"
                variant="ghost"
                onPress={onClose}
                className="shrink-0"
              >
                <X className="size-5 text-red-600" aria-hidden />
              </Button>
            </div>
          </Drawer.Header>

          <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</Drawer.Body>

          {footer ? (
            <Drawer.Footer className="shrink-0 border-t border-zinc-100 px-5 py-3">
              {footer}
            </Drawer.Footer>
          ) : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer>
  );
}
```

> **API note:** Confirm exact HeroUI Drawer controlled props (`isOpen` vs overlay `state`) during implementation — use the same pattern as other HeroUI overlays in this repo. Adjust prop names to match installed `@heroui/react@3.2.4`.

**Width CSS**

```css
/* styles/admin/admin-side-sheet.css */

.admin-side-sheet {
  top: 4.25rem; /* admin topnav height — match AdminProductsPageContent calc */
  height: calc(100vh - 4.25rem);
}

.admin-side-sheet--half {
  width: 100%;
  max-width: none;
}

@media (min-width: 768px) {
  .admin-side-sheet--half {
    width: 50vw;
  }
}
```

### 8.2 Bordered form section wrapper

```tsx
// components/admin/products/AdminProductsFormSection.tsx
'use client';

type AdminProductsFormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AdminProductsFormSection({
  title,
  description,
  children,
}: AdminProductsFormSectionProps) {
  return (
    <section className="admin-products-form-section rounded-lg border border-zinc-200 bg-white p-4">
      <header className="mb-4 border-b border-zinc-100 pb-3">
        <h3 className="font-body text-sm font-semibold text-zinc-800">{title}</h3>
        {description ? (
          <p className="mt-1 font-body text-xs text-zinc-500">{description}</p>
        ) : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
```

```css
/* admin-products.css */
.admin-products-form-section + .admin-products-form-section {
  margin-top: 1rem;
}
```

### 8.3 Product side sheet orchestrator

```tsx
// components/admin/products/AdminProductsSideSheet.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@heroui/react';
import { useAppDispatch, useAppSelector } from '../../../redux/admin/hooks';
import {
  closeProductSheet,
  createAdminProduct,
  selectProductSheet,
  selectProductSheetConfig,
  selectProductSheetProduct,
  selectProductSheetSubmitLoader,
  updateAdminProduct,
} from '../../../redux/admin/slices/productsSlice';
import {
  buildEmptyProductFormDefaults,
  computeNextProductPosition,
  productToFormValues,
} from '../../../utils/admin/products/products-form-defaults';
import type { AdminProductFormValues } from '../../../utils/admin/products/products-types';
import { AdminSideSheet } from '../common/AdminSideSheet';
import { AdminProductsForm } from './AdminProductsForm';

export function AdminProductsSideSheet() {
  const dispatch = useAppDispatch();
  const sheet = useAppSelector(selectProductSheet);
  const config = useAppSelector(selectProductSheetConfig);
  const product = useAppSelector(selectProductSheetProduct);
  const submitLoader = useAppSelector(selectProductSheetSubmitLoader);
  const items = useAppSelector((state) => state.adminProducts.items);

  const visible = sheet.visible && !!config;
  const nextPosition = computeNextProductPosition(items);

  const form = useForm<AdminProductFormValues>({
    defaultValues: buildEmptyProductFormDefaults(nextPosition),
    resolver: config ? yupResolver(config.schema) : undefined,
  });

  const { reset, handleSubmit } = form;

  useEffect(() => {
    if (!visible || !config) return;

    if (config.isUpdate && product) {
      reset(productToFormValues(product));
      return;
    }

    reset(buildEmptyProductFormDefaults(nextPosition));
  }, [visible, config, product, nextPosition, reset]);

  const handleClose = () => {
    if (submitLoader) return;
    dispatch(closeProductSheet());
  };

  const onSubmit = (values: AdminProductFormValues) => {
    if (!config) return;

    if (config.isUpdate && sheet.productId) {
      dispatch(updateAdminProduct({ id: sheet.productId, formValues: values }));
      return;
    }

    dispatch(createAdminProduct(values));
  };

  if (!config) return null;

  return (
    <AdminSideSheet
      open={visible}
      title={config.title}
      description={config.isUpdate && product ? product.name : 'Create a new catalogue product.'}
      onClose={handleClose}
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button variant="secondary" onPress={handleClose} isDisabled={submitLoader}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-product-sheet-form"
            variant="primary"
            isPending={submitLoader}
            isDisabled={submitLoader}
          >
            {config.submitLabel}
          </Button>
        </div>
      }
    >
      <form id="admin-product-sheet-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AdminProductsForm
          form={form}
          context={config.context}
          isUpdate={config.isUpdate}
          readOnlyVariant={config.isUpdate ? productToFormValues(product ?? undefined as never) : undefined}
        />
      </form>
    </AdminSideSheet>
  );
}
```

### 8.4 Floating action button

```tsx
// components/admin/common/AdminFloatingButton.tsx
'use client';

import { Plus } from 'lucide-react';

type AdminFloatingButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  className?: string;
};

export function AdminFloatingButton({ ariaLabel, onPress, className }: AdminFloatingButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      className={`admin-floating-button ${className ?? ''}`}
    >
      <Plus className="size-7" aria-hidden />
    </button>
  );
}
```

```css
.admin-floating-button {
  position: absolute;
  right: calc(var(--admin-products-inset, 1.75rem) + 0.25rem);
  bottom: 1.5rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border: 0;
  border-radius: 9999px;
  background-color: #2563eb;
  color: #fff;
  box-shadow: 0 10px 25px rgb(37 99 235 / 0.35);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.admin-floating-button:hover {
  background-color: #1d4ed8;
}
```

### 8.5 Management wiring

```tsx
// AdminProductsManagement.tsx (additions)

import { AdminProductsSideSheet } from './AdminProductsSideSheet';
import { AdminFloatingButton } from '../common/AdminFloatingButton';
import { openProductSheet } from '../../../redux/admin/slices/productsSlice';

// inside component:
const handleAdd = useCallback(() => {
  dispatch(openProductSheet({ context: 'addProduct' }));
}, [dispatch]);

const handleEdit = useCallback(
  (row: AdminProductRow) => {
    dispatch(openProductSheet({ context: 'updateProduct', productId: row.id }));
  },
  [dispatch],
);

// JSX — wrap listing area `relative` for FAB positioning:
return (
  <div className="admin-products-management relative flex min-h-0 flex-1 flex-col overflow-hidden">
    {/* toolbar, grid, pagination */}
    {!listLoader ? (
      <AdminFloatingButton ariaLabel="Add product" onPress={handleAdd} />
    ) : null}
    <AdminProductsSideSheet />
  </div>
);
```

---

## 9. Interaction parity checklist (next-app vs admin)

| Step | next-app sections | admin products |
|------|-------------------|----------------|
| Open create | FAB → `openSectionSheet('addSection')` | FAB → `openProductSheet('addProduct')` |
| Open edit | Row pencil → `openSectionSheet('updateSection', item)` | Row pencil → `openProductSheet('updateProduct', { productId })` |
| Prefill | `reset()` from `sectionSheet.item` | `reset(productToFormValues(product))` from cached `items` |
| Submit | `createSection` / `updateSection` | `createAdminProduct` / `updateAdminProduct` |
| Loading | `loading={submitLoader}` on SAVE | `isPending={submitLoader}` on Save/Update |
| Success | Toast + close + refresh | HeroUI Toast + close + `fetchAdminProducts` |
| Error | Toast + stay open | Toast + stay open |
| Cancel | `closeSectionSheet()` | `closeProductSheet()` |

---

## 10. Implementation phases

### Phase 0 — Prerequisites (from list spec) ✅

- [x] Phase 3 row actions wired (`publish` / `archive`) with toasts
- [x] List stores raw `NestApiProduct[]` in Redux (`items`) for edit prefill
- [x] `AdminProductsManagement` opens sheet via `openProductSheet` (cache lookup before edit)

**Exit:** Edit button opens sheet state; publish/deactivate call API with toasts.

---

### Phase 1 — Foundation (utils + service + Redux) ✅

- [x] Add `products-form-config.ts`, `products-form-defaults.ts`, `products-form-mappers.ts`, `products-form-schema.ts`
- [x] Extend `products-types.ts` with `ProductSheetContext`, `AdminProductFormValues`
- [x] Extend `admin-products-service.ts` with `create`, `update`, `findCachedById`
- [x] Extend `productsSlice`: `items`, `productSheet`, `createLoader`, `updateLoader`
- [x] Add reducers: `openProductSheet`, `closeProductSheet`
- [x] Add thunks: `createAdminProduct`, `updateAdminProduct` with HeroUI toasts
- [x] Add selectors: `selectProductSheet*`, `selectProductSheetSubmitLoader`, `selectCachedProductById`
- [x] Unit tests: payload builders, `productToFormValues`, slug validation

**Exit:** Thunks callable from tests; edit resolves from cached `items` only.

---

### Phase 2 — Side sheet shell + form sections ✅

- [x] `AdminSideSheet` (HeroUI Drawer, 50% width, topnav offset)
- [x] `admin-side-sheet.css` imported in `AdminUiProvider`
- [x] `AdminProductsFormSection` bordered wrapper
- [x] `AdminProductsForm` — renders sections from `PRODUCT_FORM_SECTIONS` with HeroUI `TextField`, `Switch`, `Select`
- [x] Read-only slug + variant display on update
- [x] `AdminProductsSideSheet` mounted in `AdminProductsManagement` (submit logs locally until Phase 3)

**Exit:** Sheet renders all fields; submit logs values locally (temporary).

---

### Phase 3 — Wire create/update end-to-end ✅

- [x] `AdminProductsSideSheet` with `react-hook-form` + yup + prefill `useEffect`
- [x] Mount sheet + FAB in `AdminProductsManagement`
- [x] Wire `handleEdit` → `openProductSheet`
- [x] Submit dispatches `createAdminProduct` / `updateAdminProduct` thunks
- [x] Loader disables Cancel/Submit; primary button shows pending state
- [x] Success/error toasts; sheet closes only on success

**Exit:** Create and update persist via Nest admin API; list refreshes.

---

### Phase 4 — UX polish ✅

- [x] Slug auto-suggest from name on create (optional helper — kebab-case)
- [x] Handle **409 slug conflict** with field-level error message
- [x] Empty-state hint when no products (“Use + to add”)
- [x] Hide FAB while `listLoader` or sheet submit loading
- [x] Keyboard: Escape closes sheet when not submitting
- [x] Focus first field when sheet opens

**Exit:** Matches next-app workflow quality; bordered sections visually clear.

---

### Phase 5 — Confirmations integration (list spec Phase 4)

- [ ] Publish/deactivate confirm modals still work alongside sheet
- [x] Deactivate confirm modal before archive
- [ ] Publish confirm modal *(deferred)*
- [ ] After create, optional toast action “Publish now” *(defer if publish requires descriptor/base)*

**Exit:** No regression on list mutations.

---

### Phase 6 — Optional backend enhancement

- [ ] Add `GET /v1/admin/products/:id` in Nest admin controller
- [ ] `adminProductsService.getById(id)` for deep-link / stale cache recovery
- [ ] Optional route `/dashboard/products?edit=:id` opens sheet on load

**Exit:** Edit works even if product not in current filtered list.

---

## 11. Testing plan

### Unit (`frontend/tests/unit/`)

| Test file | Covers |
|-----------|--------|
| `admin-products-form-mappers.test.ts` | `buildCreateProductPayload`, `buildUpdateProductPayload`, `productToFormValues`, `pendingToInput` |
| `admin-products-form-schema.test.ts` | slug regex, required fields |
| `admin-products-utils.test.ts` | extend existing — `computeNextProductPosition` |

### Manual QA

| Case | Steps | Expected |
|------|-------|----------|
| Create | FAB → fill basics + SKU → Save | Draft product in list; success toast; sheet closes |
| Edit | Pencil → change name → Update | Row updates; toast; sheet closes |
| Prefill | Edit existing | All fields match API product |
| Loader | Slow network | Submit shows pending; Cancel disabled |
| Error | Duplicate slug | Error toast; sheet stays open |
| Width | Desktop | Sheet = 50% viewport; mobile = full width |
| Sections | Visual | Each group has border + title |

---

## 12. File checklist (new / modified)

| Path | Action |
|------|--------|
| `docs/admin/admin-products-crud-sidesheet-spec.md` | **This spec** |
| `utils/admin/products/products-form-*.ts` | **New** |
| `services/admin/admin-products-service.ts` | Extend |
| `redux/admin/slices/productsSlice.ts` | Extend |
| `components/admin/common/AdminSideSheet.tsx` | **New** |
| `components/admin/common/AdminFloatingButton.tsx` | **New** |
| `components/admin/products/AdminProductsSideSheet.tsx` | **New** |
| `components/admin/products/AdminProductsForm.tsx` | **New** |
| `components/admin/products/AdminProductsFormSection.tsx` | **New** |
| `components/admin/products/AdminProductsManagement.tsx` | Wire FAB + sheet + edit |
| `styles/admin/admin-side-sheet.css` | **New** |
| `styles/admin/admin-products.css` | FAB + form section styles |
| `components/admin/AdminUiProvider.tsx` | Import side sheet CSS |
| `tests/unit/admin-products-form-mappers.test.ts` | **New** |

---

## 13. Relationship to `admin-products-list-spec.md`

| List spec phase | CRUD spec |
|-----------------|-----------|
| Phase 3 — row actions + toasts | Phase 0 prerequisite |
| Phase 4 — confirm modals | Phase 5 here |
| Phase 5 — edit/create | **Replaced by this spec** (Phases 1–4) |

Update list spec Phase 5 header to link here once implementation starts:

```markdown
### Phase 5 — Edit/create
See [`admin-products-crud-sidesheet-spec.md`](./admin-products-crud-sidesheet-spec.md).
```

---

## 14. Open decisions (defaults chosen)

| Question | Decision for Phase 1 |
|----------|----------------------|
| Edit data source | **Required:** cached `items` from last `fetchAdminProducts` only (no GET on edit) |
| Variant editing on update | Read-only; defer to variant spec |
| Sheet width token | `50vw` on `md+`, `100%` on mobile |
| Form library | `react-hook-form` + `yup` (matches `AdminLoginForm`) |
| Toast placement | Existing `Toast.Provider` in `AdminUiProvider` (`top end`) |
| Single vs multiple sheets | **Single** `AdminProductsSideSheet` instance |

---

## 15. Reference snippet index

| Concern | Reference file |
|---------|----------------|
| FAB placement | `next-app/components/common/FloatingButton.tsx` |
| Sheet footer buttons | `next-app/components/questionnaires/QuestionnaireSectionSideSheet.tsx` |
| Sheet shell layout | `next-app/components/common/DewsSideSheet.tsx` |
| Redux sheet state | `next-app/redux/slices/questionnaireAdminSlice.ts` (`sectionSheet`) |
| Payload builders | `next-app/utils/questionnaireSheetConfig.ts` |
| Admin toast | `frontend/src/components/admin/AdminLoginForm.tsx` |
| HeroUI Drawer | `frontend/node_modules/@heroui/react/dist/components/drawer/` |
| Nest DTOs | `backend/src/products/dto/product.dto.ts` |

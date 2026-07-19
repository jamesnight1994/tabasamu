# Admin API Contract — Phase 7

**Status:** The handover contract for the staff admin console. [R-13, NN-06]
**Source of truth:** `src/ports/admin.ts` + `src/domain/admin/*`. This is the human-readable map.

The admin console calls these through a SEPARATE composition root (`AdminAdapters`), distinct from the storefront `Adapters`. Mock today; `NEXT_PUBLIC_ADAPTERS=http` swaps in the real backend.

---

## 0. Why a separate adapter set

Admin operations are privileged and must be authorised independently server-side. Keeping `AdminAdapters` separate from the storefront `Adapters` makes it structurally impossible to hand a shopfront component an admin mutation. Two roots, two seams.

---

## 1. The services

| Service | Responsibility |
|---|---|
| `adminAuth` | staff session: `currentStaff`, `signIn`, `signOut` |
| `dashboard` | metrics, product performance, recent activity |
| `reporting` | `run(type, range)` → `ReportResult` (8 report types) |
| `adminProducts` | create / update / archive / duplicate / publish |
| `adminInventory` | movements, `adjust`, `exportCsv` |
| `adminOrders` | search, advanceStatus, cancel, **requestRefund**, notes, resend, manual, timeline |
| `adminPayments` | **read + queue only** — list, byReference, reviewQueue, webhookHistory, markReviewed, reconcile, exportCsv |
| `adminCustomers` | list, detail, orders, addresses, subscriptions, notes, setStatus, **handleDataRequest** |
| `adminSubscriptions` | list, pause, cancel, **retryPayment**, history |
| `promotions` | list, create, update, deactivate |
| `adminDelivery` | config, updateConfig |
| `content` | list, update, publish, unpublish |
| `settings` | get, update, featureFlags, toggleFlag |
| `staff` | list, invite, changeRole, deactivate |
| `audit` | list |

---

## 2. Three invariants the backend MUST preserve

### 2.1 Every write is permission-checked AND audited
Each mutating method: (1) checks the caller's permission and returns `denied` if absent; (2) on success, appends an `AuditEvent`. The mock does both; the tests assert the audit count increments on permitted actions and that denied actions change nothing. The backend re-checks permissions server-side regardless of the UI gate.

### 2.2 No privileged payment call from the browser
`adminPayments` is **read + queue management**. `reconcile` and `markReviewed` FLAG for the server; the server does the actual reconciliation. `requestRefund` (on orders) REQUESTS a refund — M-PESA refunds are a manual B2C reversal, and no money moves from the console. [brief §6]

### 2.3 Blocked values render as `Unavailable`, never faked
Dashboard revenue, customer lifetime value, report money columns, subscription amounts — all `Pending`/`Unavailable` until D-14 (prices) and D-09 (subscription billing). Tax stays off until D-16. The console never invents a number.

---

## 3. Result & error model

Every fallible method returns `Result<T, AdminError>`. `AdminError` includes `denied` (permission), `not_found`, `invalid`. Denials are explicit, not silent no-ops — the UI shows "not permitted", and the backend logs the attempt.

---

## 4. Blocked decisions surfaced by this contract

| Decision | Where it shows |
|---|---|
| D-09 | subscription `retryPayment` requests a charge the model doesn't define |
| D-14 | revenue / LTV / report money columns → `Unavailable` |
| D-16 | `settings.taxEnabled` held, never applied |
| D-21/22/23 | `adminDelivery.config` returns zero zones |
| D-35 | payment views are provider-neutral |
| D-46/49/50/51/52 | content/product copy touching claims stays client-supplied |

---

## 5. Checklist for the backend developer

Implement `src/adapters/http/admin.ts` (currently throws `NotImplemented`) and:

- [ ] Enforce the permission matrix server-side (`docs/38`), independently of the UI.
- [ ] Write an append-only audit event for every mutation (`docs/40`).
- [ ] Keep payments read-only from the console; reconcile/refund are server-settled.
- [ ] Return `Unavailable` for money fields until prices (D-14) and billing (D-09) are set.
- [ ] Back the CSV exports with the documented schemas (`docs/41`).
- [ ] Flip `NEXT_PUBLIC_ADAPTERS=http`. The console UI does not change.

# 62 · Admin Guide

How the back office is authorised, what it can do, and — most importantly — what
the **backend must enforce independently**, because the UI gate is convenience,
not security. The authoritative role/permission source is
`src/domain/admin/rbac.ts`; the full matrix is doc 38; the audit catalogue is
doc 40; the reporting schema is doc 41. This guide is the operational summary.

---

## 1. The single most important rule

> **The admin UI stops people seeing doors they can't open. It is NOT the
> security boundary.** The backend re-checks every permission on every request.
> A forged request from a client that skipped the UI gate must still be refused
> server-side. Build the permission check into the API, not just the nav.

## 2. Role matrix (8 roles)

| Role | Purpose |
|---|---|
| **super_admin** | Full access; the only role that manages staff and feature flags. Use sparingly. |
| **store_manager** | Runs the store day to day: products, orders, inventory, promotions, delivery, content, settings. |
| **order_manager** | Fulfilment: view/advance/cancel orders, order notes. **No refunds** (money bar). |
| **inventory_manager** | Stock adjustments, batches, inventory export. Read-only on orders. |
| **content_editor** | Content and product copy; publish. No commercial access. |
| **customer_care** | Customer lookup, notes, consent, data requests; order notes. |
| **marketing** | Promotions and content; reports. |
| **finance_analyst** | **Read-only.** Reports, payments, exports. No mutating permission. |

Full permission grid: doc 38. It is generated from `rbac.ts`; keep them in sync.

## 3. Permission-check design rules (enforce all server-side)

- **Fail-closed.** A `null`, unknown, or inactive staff member has **zero**
  permissions.
- **The money bar.** `order.refund` and every `payment.*` mutation are withheld
  from operational roles. A refund is a *request the server settles*, never
  executed from the browser.
- **Staff & flags are super_admin-only** — `staff.manage` and
  `settings.feature_flags` live in exactly one column.
- **Read-only means read-only.** `finance_analyst` has no permission beyond
  `.view`/`.export`.
- **Everyone gets `dashboard.view`.**

## 4. Audit requirements

Every mutating admin action writes an **`AuditEvent`** (doc 40): actor, action,
target, before/after, timestamp, and a **reversibility** tag
(`reversible` | `irreversible` | `compensating`). The audit log is
**append-only** — never updated or deleted. The frontend cannot be trusted to
log; the **backend writes the audit entry as part of the same transaction** as
the mutation, so an action and its audit record cannot diverge.

Irreversible and compensating actions (refunds, data deletions, publishing,
stock write-offs) must be the most heavily logged and, ideally, require a
confirmation step.

## 5. Core admin operations and their backend obligations

### Product publishing
`content.publish` / product publish must **refuse to publish a product with
unresolved regulated placeholders** (ingredients/nutrition — D-05). A PDP with
invented nutrition is precisely what the honesty rules forbid. Enforce in the
API, not only the UI. Audited.

### Inventory adjustments
Every adjustment writes a **`StockMovement`** (reason, delta, actor) **and** an
`AuditEvent`. Stock is never silently overwritten; it is moved, with a reason.
`available` is always derived (`onHand - reserved`), never stored.

### Order updates
Status changes go through the guarded transition table (`canTransition`). An
illegal jump is refused (422). Fulfilment roles can advance/cancel; refunds are
barred (money bar). Order notes are separate from status and available to care.

### Refund controls
`order.refund` is super_admin/store_manager only. For **M-PESA**, the refund is a
**manual B2C reversal** with a state, not a one-click action
(`requiresManualAction: true`, D-36/37). For **card**, it is an API call but
still admin-gated and audited. Always record initiator + reference.

### Content publishing
Content editors draft and publish editorial copy. Brand rules
(`lint:brand`-equivalent) should be enforced on publish server-side too — the
forbidden-vocabulary and no-urgency constraints (P-07) are brand law, not style.

### Reporting
`report.view`/`report.export` per the reporting schema (doc 41). Finance analyst
is read-only. Reports must never expose secrets or full payment credentials —
only the M-PESA reference and masked data.

## 6. Dangerous actions (require extra care)

| Action | Why dangerous | Requirement |
|---|---|---|
| Refund / reversal | Moves money | super_admin/store_manager, audited, reference recorded |
| Data deletion (DPA request) | Irreversible, legal | customer_care/super_admin, audited, honours DPA process (D-43) |
| Product publish with placeholders | Could publish invented facts | Blocked server-side until D-05 resolved |
| Feature-flag change | Enables a decision-blocked feature | super_admin only; changing a flag is a business act |
| Stock write-off | Destroys inventory value | inventory_manager+, reason mandatory, StockMovement + audit |
| Staff management | Grants access | super_admin only, audited |

## 7. Backend enforcement checklist (do all of these)

- [ ] Every admin endpoint independently checks the required permission.
- [ ] Inactive/unknown staff → 403, always.
- [ ] Every mutation writes an audit event in the same transaction.
- [ ] Order-status writes validated against `canTransition`.
- [ ] Product publish blocked while regulated `Pending` fields are unresolved.
- [ ] Refund endpoints gated by the money bar; M-PESA refund is manual-state.
- [ ] Reports/exports never leak secrets; payment data masked.
- [ ] Feature-flag mutation restricted to super_admin.
- [ ] The audit log is append-only at the storage layer (no update/delete grant).

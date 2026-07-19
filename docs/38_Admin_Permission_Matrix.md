# Admin Permission Matrix — Phase 7

**Status:** Reference. The authoritative source is `src/domain/admin/rbac.ts`; this table is generated from it.

## Roles

| Role | Purpose |
|---|---|
| **Super** — super_admin | Full access. The only role that manages staff and feature flags. |
| **Store** — store_manager | Runs the store day to day: products, orders, inventory, promotions, delivery, content, settings. |
| **Order** — order_manager | Fulfilment: view/advance/cancel orders, notes. **No refunds** (money bar). |
| **Invtry** — inventory_manager | Stock adjustments and inventory export. |
| **Content** — content_editor | Content and product copy; publish. No commercial access. |
| **Care** — customer_care | Customer lookup, notes, consent, data requests; order notes. |
| **Mktg** — marketing | Promotions and content; reports. |
| **Finance** — finance_analyst | **Read-only.** Reports, payments, exports. No mutating permission. |

## The matrix

`✓` = granted, `·` = denied.

| Permission | Super | Store | Order | Invtry | Content | Care | Mktg | Finance |
|---|---|---|---|---|---|---|---|---|
| `dashboard.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `product.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `product.create` | ✓ | ✓ | · | · | · | · | · | · |
| `product.edit` | ✓ | ✓ | · | · | · | · | · | · |
| `product.archive` | ✓ | ✓ | · | · | · | · | · | · |
| `product.duplicate` | ✓ | ✓ | · | · | · | · | · | · |
| `inventory.view` | ✓ | ✓ | ✓ | ✓ | · | · | · | ✓ |
| `inventory.adjust` | ✓ | ✓ | · | ✓ | · | · | · | · |
| `inventory.export` | ✓ | ✓ | · | ✓ | · | · | · | · |
| `order.view` | ✓ | ✓ | ✓ | ✓ | · | ✓ | · | ✓ |
| `order.fulfil` | ✓ | ✓ | ✓ | · | · | · | · | · |
| `order.cancel` | ✓ | ✓ | ✓ | · | · | · | · | · |
| `order.refund` | ✓ | ✓ | · | · | · | · | · | · |
| `order.create_manual` | ✓ | ✓ | ✓ | · | · | · | · | · |
| `order.note` | ✓ | ✓ | ✓ | · | · | ✓ | · | · |
| `payment.view` | ✓ | ✓ | ✓ | · | · | ✓ | · | ✓ |
| `payment.reconcile` | ✓ | ✓ | · | · | · | · | · | · |
| `payment.export` | ✓ | ✓ | · | · | · | · | · | ✓ |
| `customer.view` | ✓ | ✓ | ✓ | · | · | ✓ | · | ✓ |
| `customer.note` | ✓ | ✓ | ✓ | · | · | ✓ | · | · |
| `customer.manage_consent` | ✓ | · | · | · | · | ✓ | · | · |
| `customer.handle_data_request` | ✓ | · | · | · | · | ✓ | · | · |
| `subscription.view` | ✓ | ✓ | ✓ | · | · | ✓ | · | ✓ |
| `subscription.manage` | ✓ | ✓ | · | · | · | ✓ | · | · |
| `subscription.retry_payment` | ✓ | ✓ | · | · | · | · | · | · |
| `promotion.view` | ✓ | ✓ | · | · | · | · | ✓ | ✓ |
| `promotion.create` | ✓ | ✓ | · | · | · | · | ✓ | · |
| `promotion.edit` | ✓ | ✓ | · | · | · | · | ✓ | · |
| `promotion.deactivate` | ✓ | ✓ | · | · | · | · | ✓ | · |
| `delivery.view` | ✓ | ✓ | ✓ | ✓ | · | · | · | ✓ |
| `delivery.edit` | ✓ | ✓ | · | · | · | · | · | · |
| `content.view` | ✓ | ✓ | · | · | ✓ | · | ✓ | ✓ |
| `content.edit` | ✓ | ✓ | · | · | ✓ | · | ✓ | · |
| `content.publish` | ✓ | ✓ | · | · | ✓ | · | ✓ | · |
| `settings.view` | ✓ | ✓ | · | · | · | · | · | ✓ |
| `settings.edit` | ✓ | ✓ | · | · | · | · | · | · |
| `settings.feature_flags` | ✓ | · | · | · | · | · | · | · |
| `staff.view` | ✓ | · | · | · | · | · | · | · |
| `staff.manage` | ✓ | · | · | · | · | · | · | · |
| `report.view` | ✓ | ✓ | ✓ | ✓ | · | · | ✓ | ✓ |
| `report.export` | ✓ | ✓ | · | · | · | · | · | ✓ |
| `audit.view` | ✓ | ✓ | · | · | · | · | · | ✓ |


## Design rules encoded here

- **Fail-closed.** A `null` or inactive staff member has zero permissions. Tested.
- **The money bar.** `order.refund` and `payment.*` mutations are withheld from operational roles; a refund is a *request* the server settles, never executed in the browser.
- **Staff & flags are super_admin-only.** `staff.manage` and `settings.feature_flags` appear in exactly one column.
- **Read-only means read-only.** `finance_analyst` has no permission ending in a verb other than `.view`/`.export`. Tested directly.
- **Everyone gets `dashboard.view`.** A staff member with no dashboard is a staff member who can't see they're logged in.

## Enforcement note

This matrix drives **nav visibility and action gating in the UI** — it stops people seeing doors they can't open. It is **not** the security boundary. The backend re-checks every permission independently; a forged request from a client that skipped the UI gate is still refused server-side.

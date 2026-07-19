# Audit Event Catalogue — Phase 7

**Status:** Reference. Source: `src/domain/admin/audit.ts`.

Every consequential admin action appends an append-only `AuditEvent` recording **who** did it, **what**, to **which target**, **when**, and (where relevant) the **before/after** values. The log is never mutated or deleted.

## Reversibility

Each action is classified so the console can warn appropriately:

- **reversible** — can be cleanly undone (e.g. pause a subscription).
- **compensating** — "undo" means an opposite, separately-logged action (e.g. a stock adjustment is corrected by an opposite adjustment, not erased).
- **irreversible** — cannot be taken back (e.g. a sent notification already left; a refund request).

## The catalogue

### Product

| Action | Reversibility |
|---|---|
| `product.created` | reversible |
| `product.updated` | reversible |
| `product.archived` | reversible |
| `product.duplicated` | reversible |
| `product.published` | reversible |

### Inventory

| Action | Reversibility |
|---|---|
| `inventory.adjusted` | compensating |
| `inventory.batch_updated` | reversible |

### Order

| Action | Reversibility |
|---|---|
| `order.created_manual` | compensating |
| `order.status_changed` | compensating |
| `order.cancelled` | irreversible |
| `order.refund_requested` | irreversible |
| `order.note_added` | reversible |
| `order.notification_resent` | irreversible |

### Payment

| Action | Reversibility |
|---|---|
| `payment.reconciled` | reversible |
| `payment.marked_reviewed` | reversible |
| `payment.refund_requested` | irreversible |

### Customer

| Action | Reversibility |
|---|---|
| `customer.note_added` | reversible |
| `customer.consent_changed` | compensating |
| `customer.data_export_requested` | irreversible |
| `customer.deletion_requested` | irreversible |
| `customer.status_changed` | reversible |

### Subscription

| Action | Reversibility |
|---|---|
| `subscription.paused_by_admin` | reversible |
| `subscription.cancelled_by_admin` | compensating |
| `subscription.payment_retried` | irreversible |
| `subscription.changed_by_admin` | reversible |

### Promotion

| Action | Reversibility |
|---|---|
| `promotion.created` | reversible |
| `promotion.updated` | reversible |
| `promotion.deactivated` | reversible |

### Delivery

| Action | Reversibility |
|---|---|
| `delivery.zone_changed` | reversible |
| `delivery.config_updated` | reversible |

### Content

| Action | Reversibility |
|---|---|
| `content.updated` | reversible |
| `content.published` | reversible |
| `content.unpublished` | reversible |

### Settings

| Action | Reversibility |
|---|---|
| `settings.updated` | reversible |
| `settings.feature_flag_toggled` | reversible |

### Staff

| Action | Reversibility |
|---|---|
| `staff.invited` | reversible |
| `staff.role_changed` | reversible |
| `staff.deactivated` | reversible |

## What every event carries

`{ id, action, actorId, actorName, actorRole, target, summary, before, after, at }`

- `actorRole` matters: the same action by a super_admin and by a store_manager are both recorded with the role, so an audit reader can see not just who but in what capacity.
- `before`/`after` are populated for state changes (e.g. a role change records the old and new role).
- `target` is a stable reference like `order:TS-2002` or `staff:staff_1`, so events can be grouped by the thing they touched.

## Requirements for the backend

- **Append-only.** No update, no delete. This is the compliance record.
- **Written inside the same transaction as the action**, so an action can never succeed without its audit event (or vice versa).
- **Readable only with `audit.view`** — tested: a role without it sees an empty log.
- **Money-moving and notification actions are irreversible** and must be presented as such in any UI that offers them.
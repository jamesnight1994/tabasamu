# 58 · Data Dictionary

The canonical entity reference for the backend. **Extracted from the actual
TypeScript domain types** (`src/domain/**`, `src/ports/index.ts`), so it cannot
drift from the code — if a field is here, it exists in the source; the source is
always the final authority on exact shape.

## How to read this

- **Type** — the TypeScript type. Branded IDs (`ProductId`, `OrderId`, …) are
  opaque strings at the wire level; brand them in your own layer if you like.
- **Req** — ✅ required (non-null) · ⬚ nullable · **P** = `Pending<T>` (see below).
- **`Pending<T>`** — a first-class placeholder: either a real `T` **or** an
  `Unavailable` marker carrying the blocking decision ID. **This is how the
  project refuses to invent regulated/commercial facts.** Your backend serves a
  real `T` once the client confirms; until then it serves the `Unavailable`
  marker and the UI renders an "awaiting confirmation" panel. Never fabricate a
  value to replace a `Pending` marker. [NN-05]
- **Money** — always `{ amount: integer minor units, currency: 'KES',
  taxIncluded: boolean | null }`. **Never a float.** `taxIncluded` is `null`
  until D-16 (VAT status) is answered.
- **ISODateTime** — RFC3339 string. **ISODate** — `YYYY-MM-DD`.

---

## 1. Catalogue

### Product  — `src/domain/catalogue`
| Field | Type | Req | Notes |
|---|---|---|---|
| id | ProductId | ✅ | |
| slug | FlavourSlug | ✅ | URL key; one of the confirmed flavour slugs |
| name | string | ✅ | Display name |
| flavour | string | ✅ | Searchable flavour, distinct from `name` (a limited batch shares flavour, differs in name) |
| position | number | ✅ | Curated "Featured" sort order; stable, client-set |
| subscriptionEligible | boolean | ✅ | Catalogue fact only; does **not** imply subscriptions work (D-09) |
| forwardNote | Pending\<string\> | P | ⛔ D-51 for Passion/Beetroot/Gooseberry |
| descriptor | Pending\<string\> | P | ✅ D-13 answered → "Caffeine Free" |
| base | Pending\<string\> | P | ✅ D-50 answered → "Rooibos" |
| strip | FlavourStrip | ✅ | Flavour-strip colour + label (see below) |
| provenance | Pending\<Provenance[]\> | P | ⛔ D-49 named farms not supplied |
| ingredients | Pending\<Ingredient[]\> | P | ⛔ D-05 regulated — never invented |
| nutrition | Pending\<NutritionPanel\> | P | ⛔ D-05 regulated |
| fermentationDays | Pending\<number\> | P | ⛔ D-52 (6 vs 14 conflict) |
| images | ProductImage[] | ✅ | Alt text required per image (a11y) |
| seo | SeoContent | ✅ | Title/description/canonical |
| storage | Pending\<StorageGuidance\> | P | Awaiting client copy |
| status | ProductStatus | ✅ | `draft` \| `active` \| `archived` |

**Relationships:** Product 1—* Variant; Product 1—* ProductImage; Product *—* Collection.

### Variant
| Field | Type | Req | Notes |
|---|---|---|---|
| id | VariantId | ✅ | |
| productId | ProductId | ✅ | FK → Product |
| sku | string | ✅ | Spec register; rendered in mono |
| size | Size | ✅ | `SizeCode` currently `'1L'` (D-02 — 500ml vs 1L unresolved) |
| price | Pending\<Money\> | P | ⛔ D-14 no approved price |
| compareAtPrice | Money \| null | ⬚ | Strike-through price if any |
| active | boolean | ✅ | |

### FlavourStrip
| Field | Type | Req | Notes |
|---|---|---|---|
| color | string (hex) | ✅ | Confirmed strips only; Passion/Beetroot/Gooseberry off-palette → ⛔ D-03 |
| label | string | ✅ | Strip caption |

### Inventory
| Field | Type | Req | Notes |
|---|---|---|---|
| variantId | VariantId | ✅ | FK → Variant |
| onHand | number | ✅ | |
| reserved | number | ✅ | Held by active reservations |
| available | number | ✅ | **Derived** (`onHand - reserved`); never stored |
| lowStockThreshold | Pending\<number\> | P | ⛔ D-27 |
| policy | StockPolicy | ✅ | `deny` \| `backorder` \| `preorder` |
| nextBatch | Batch \| null | ⬚ | ⛔ D-29 batch calendar |

### Batch
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✅ | |
| variantId | VariantId | ✅ | FK → Variant |
| bottlingDate | ISODate | ✅ | |
| quantity | number | ✅ | |
| batchNumber | string | ✅ | Rendered in mono |

### Collection
| Field | Type | Req | Notes |
|---|---|---|---|
| id / slug / title | string | ✅ | Curated product group |
| productIds | ProductId[] | ✅ | Membership |

### Media
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✅ | |
| kind | MediaKind | ✅ | `image` \| `video` |
| url / alt | string | ✅ | Alt required for images |

### Bundle
| Field | Type | Req | Notes |
|---|---|---|---|
| id / slug | string | ✅ | |
| kind | BundleKind | ✅ | `preset` \| `build-your-own` (build-your-own ⛔ D-06) |
| items | BundleItem[] | ✅ | `{ variantId, quantity }` |
| validity | BundleValidity | ✅ | Discriminated: valid / invalid-with-reason |

---

## 2. Pricing & cart

### CartLine  — `src/domain/pricing`
`{ variantId, quantity, unitPrice: Money, productName, sku }` — `unitPrice` is a
snapshot at add-time; re-validated at checkout.

### Totals
`{ subtotal, discount, delivery, total: Money, … }` — all integer minor units.
Computed by `calculateTotals()` in the domain; **the server recomputes
authoritatively** and must use the same rules.

### Discount
| Field | Type | Req | Notes |
|---|---|---|---|
| code | string | ✅ | |
| type | DiscountType | ✅ | `percent` \| `fixed` \| `free_delivery` |
| value | number | ✅ | percent points or minor units |
| (constraints) | — | | Stacking with subscriber discount ⛔ D-18; first-order ⛔ D-19 (no urgency framing, P-07) |

**DiscountError:** `not_found` \| `expired` \| `min_not_met` \| `not_applicable` (discriminated union).

### Cart  — `src/ports`
| Field | Type | Req | Notes |
|---|---|---|---|
| id | CartId | ✅ | |
| customerId | CustomerId \| null | ⬚ | Guest carts allowed |
| lines | CartLine[] | ✅ | |
| discountCode | string \| null | ⬚ | |
| zoneId | ZoneId \| null | ⬚ | Set as early as PDP (P-03), not deferred |
| totals | Totals | ✅ | Display copy; server authoritative at order |
| updatedAt | ISODateTime | ✅ | |

---

## 3. Delivery  — `src/domain/delivery`  ⛔ D-21/22/23 (zones/fees/lead times not supplied)

### DeliveryZone
`{ id: ZoneId, name, fee: Money, leadTime, … }` — **arrives as configuration**;
not one Nairobi zone is hard-coded.

### DeliveryConfig
The whole rule set: zones, free-delivery threshold (⛔ D-25), pickup location(s)
(⛔ D-26), scheduled-delivery switch, out-of-Nairobi policy (⛔ D-24). The UI
must never assume these; the backend owns them.

### DeliveryWindow / PickupLocation
Scheduling windows and collection points (config-driven).

### DeliveryQuote
`{ zoneId, fee: Money, leadTime, … }` — returned by `DeliveryService.quote()`,
callable from the PDP.

**DeliveryError:** `zone_not_found` \| `unserviceable` \| discriminated.

---

## 4. Orders  — `src/domain/order`, `src/ports`

### Order
| Field | Type | Req | Notes |
|---|---|---|---|
| id | OrderId | ✅ | |
| number | string | ✅ | Human-readable; mono |
| customerId | CustomerId \| null | ⬚ | Guest checkout allowed |
| lines | OrderLine[] | ✅ | |
| totals | Totals | ✅ | |
| deliveryAddress / billingAddress | Address | ✅ | |
| status | OrderStatus | ✅ | See state list below |
| payments | Payment[] | ✅ | **1..\*** — a retried STK push adds a Payment, never mutates one |
| isGift | boolean | ✅ | |
| giftNote | string \| null | ⬚ | Gift packing slip carries **no** pricing |
| mpesaReference | string \| null | ⬚ | **Primary support key** — customer quotes this, not the order number |
| createdAt | ISODateTime | ✅ | |

### OrderLine
`{ variantId, quantity, unitPrice: Money, productName, sku }` — **snapshotted**;
does not join live to Variant (a later price change must not rewrite history).

### OrderStatus (transition-guarded — `canTransition()` in domain)
`draft` → `awaiting_payment` → `payment_processing` → `paid` /
`payment_failed` / `payment_expired` / **`manual_reconciliation`** →
`confirmed` → `preparing` → `ready_for_dispatch` → `dispatched` → `delivered`;
plus `cancelled`, `refund_pending`, `partially_refunded`, `refunded`.

> **`manual_reconciliation` is not optional.** M-PESA can produce no callback in
> the window while the customer's money *has* left their account. Collapsing this
> into `payment_failed` would tell a paying customer they haven't paid. [R-10]

### OrderEvent
Append-only status/audit trail entries on an order.

### Address (Nairobi-shaped — deliberately not Western street form)
| Field | Type | Req | Notes |
|---|---|---|---|
| id | string | ✅ | |
| recipientName | string | ✅ | Separate from customer name (gift journey) |
| phone | E164Phone | ✅ | The rider calls this |
| zoneId | ZoneId | ✅ | FK → DeliveryZone |
| estate / building / landmark | string | ✅ | Estate/building/landmark, not street/postcode |
| instructions | string | ✅ | |
| isDefault | boolean | ✅ | |

---

## 5. Payments  — `src/domain/payment`, `src/domain/payment/contracts`

### Payment
| Field | Type | Req | Notes |
|---|---|---|---|
| id | PaymentId | ✅ | |
| provider | PaymentProvider | ✅ | `mpesa` \| `card` (card ⛔ D-35) |
| status | PaymentStatus | ✅ | `initiated` \| `pending` \| `succeeded` \| `failed` \| **`unknown`** |
| amount | Money | ✅ | |
| providerRef | string | ⬚ | M-PESA `CheckoutRequestID` — the status/reconcile key |

> **`status: 'unknown'`** is the honest state for a lost callback; it is resolved
> by `reconcile()`, never by client assumption.

### InitiatePaymentRequest / InitiatePaymentResponse
Response `status` is type-narrowed to `'initiated' | 'pending'` — it **cannot**
report success. An STK push returns 200 the moment Safaricom *accepts* it, long
before a PIN is entered; treating that as payment is the classic Daraja bug, and
the type makes it unrepresentable. [R-10]

### IdempotencyKey
Branded string. Required on order creation and payment initiation; a double-tap
must not create two orders or two charges.

### RefundRequest / RefundResponse
`RefundResponse.requiresManualAction` is **true for M-PESA** — a refund is a
manual B2C reversal, not an API call (⛔ D-36/37). The admin UI must not present
it as one-click.

### WebhookEvent
Append-only log of received provider callbacks, per payment. Read-only to the
frontend; **written only by the backend `WebhookHandler`.**

### WebhookVerification / WebhookProcessResult
The backend verifies signature first (invalid → discarded), then processes
idempotently (M-PESA *will* deliver the same callback twice).

---

## 6. Identity  — `src/domain/identity`

### CustomerProfile
`{ id: CustomerId, fullName, email: Email, phone: E164Phone, … }`.

### SavedAddress / ValidAddress
Persisted customer addresses (same Nairobi shape as Order.Address) and the
validated input type.

### Session
A **descriptor only** — no token reaches the browser (D-55). `{ customerId,
displayName, expiresAt, … }`.

### Email / ResetToken
Branded strings. Auth errors and reset results are discriminated unions;
reset/verification are enumeration-safe.

---

## 7. Subscriptions  — `src/domain/subscription`  ⛔ HARD-BLOCKED on D-09

| Entity | Notes |
|---|---|
| Subscription | `{ id: SubscriptionId, status, frequency: Frequency, lines: SubscriptionLine[], addressId, paymentMethod, nextRunAt, … }` |
| SubscriptionLine | `{ variantId, quantity }` |
| Frequency | `{ unit: 'week' \| 'fortnight' \| 'month', interval }` (frequencies empty until D-07) |
| SubscriptionStatus | `active` \| `paused` \| `payment_failed` \| `cancelled` \| `expired` — last two **terminal** (reactivate creates a new sub) |

**Management state exists and is fully modelled. No method moves money.** The
billing model (re-prompt STK / M-PESA Ratiba / card / pre-paid block) is D-09.

---

## 8. Preferences & consent  — `src/domain/preferences`  (Kenya DPA 2019 — D-43)

| Entity | Notes |
|---|---|
| ChannelPreferences | Email/SMS/WhatsApp opt-ins |
| CookiePreferences | Categories: `necessary` \| `analytics` \| `marketing` \| `preferences`; **deny-by-default** |
| ConsentEvent | **Append-only** — recording consent never overwrites, it adds an event |
| DataRequest | `{ kind: 'export' \| 'deletion', status, … }` — a **request**, not an instant action |

---

## 9. Admin, RBAC & audit  — `src/domain/admin`

### Role (8) — `super_admin`, `store_manager`, `order_manager`, `inventory_manager`, `content_editor`, `customer_care`, `marketing`, `finance_analyst` (read-only).
### Permission — enumerated capability list; role→permission matrix in doc 38 / doc 61.
### StaffMember — `{ id, email, role, active, … }`.
### AuditEvent
| Field | Type | Req | Notes |
|---|---|---|---|
| id / actorId / action | | ✅ | `AuditAction` enumerated (doc 40) |
| reversibility | Reversibility | ✅ | `reversible` \| `irreversible` \| `compensating` |
| target / before / after / at | | | Append-only; dangerous actions must be logged server-side |

### Reporting / StockMovement / Promotion
Reporting schema (doc 41), append-only stock movements, and promotion entities
(promotions gated ⛔ D-19, and **never** presented with urgency — P-07).

---

## 10. Content entries
Editorial copy lives in `src/content/**` (homepage, story, faqs, trust,
image-slots), brand-linted like code. In production these become CMS/content
entries the backend serves; the shapes are the TypeScript types in those files.
Any answer still awaiting the client renders as a visible placeholder, not a
guess.

---

## Placeholder / decision cross-reference
Every `Pending<T>` and every disabled feature traces to a decision ID in the
**Client Decisions Register (doc 08)** and is listed in the **Content &
Placeholder Register (doc 62)**. Serve the real value only once the matching
decision is answered.

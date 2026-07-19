# Initial Data Entity Map

Domain model. Backend-agnostic. This is the shared vocabulary between the frontend, the mocked services, and the eventual backend.

**Rule:** entities live in the **domain layer** as pure TypeScript. They have no knowledge of HTTP, of the database, or of React. Every field marked ⛔ depends on an unanswered client decision and **has not been guessed**.

---

## 1. Entity relationship overview

```
                          ┌──────────────┐
                          │   Customer   │
                          └──────┬───────┘
                                 │ 1
              ┌──────────────────┼──────────────────┬─────────────────┐
              │ *                │ *                │ *               │ *
        ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐
        │  Address  │     │    Order    │    │Subscription │   │    Cart     │
        └───────────┘     └──────┬──────┘    └──────┬──────┘   └──────┬──────┘
                                 │ 1                │                 │ 1
                                 │ *               │ *               │ *
                          ┌──────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐
                          │  OrderLine  │    │ SubLine     │   │  CartLine   │
                          └──────┬──────┘    └──────┬──────┘   └──────┬──────┘
                                 │                  │                 │
                                 └────────┬─────────┴─────────────────┘
                                          │ *
                                   ┌──────▼───────┐
                                   │   Variant    │  (the sellable unit)
                                   └──────┬───────┘
                                          │ *
                                   ┌──────▼───────┐
                                   │   Product    │  (a flavour)
                                   └──────┬───────┘
                                          │ 1
                                   ┌──────▼───────┐
                                   │ FlavourStrip │
                                   └──────────────┘

        ┌──────────────┐         ┌──────────────┐        ┌──────────────┐
        │   Payment    │────────▶│    Order     │◀───────│ DeliveryZone │
        └──────┬───────┘   1..*  └──────────────┘   *..1 └──────────────┘
               │ 1
               │ *
        ┌──────▼───────┐
        │ WebhookEvent │  (append-only, never mutated)
        └──────────────┘

        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │   Discount   │   │  Inventory   │   │    Batch     │
        └──────────────┘   └──────┬───────┘   └──────┬───────┘
                                  │ 1..1            │
                                  └────────┬─────────┘
                                     Variant

        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │ JournalEntry │   │   Stockist   │   │   Enquiry    │
        └──────────────┘   └──────────────┘   └──────────────┘
              (content — isolated from the commerce graph by role)
```

---

## 2. Core entities

### 2.1 `Product` — a flavour

| Field | Type | Notes |
|---|---|---|
| `id` | `ProductId` | Branded string. |
| `slug` | `string` | `pineapple-ginger` |
| `name` | `string` | "Pineapple Ginger" — rendered in **Fraunces**. |
| `forwardNote` | `string` | *"Pineapple, warm ginger"* — ⛔ **D-51** for Passion / Beetroot / Gooseberry. |
| `descriptor` | `string` | ⛔ **D-13 — "Caffeine Free" or "Gluten Free"? These are different regulated claims.** |
| `base` | `string` | "Rooibos kombucha" — ⛔ **D-50, see the rooibos/hibiscus contradiction.** |
| `strip` | `FlavourStrip` | See 2.2. |
| `provenance` | `Provenance[]` | ⛔ **D-49 — named farms/regions not supplied. Will not be invented.** |
| `ingredients` | `Ingredient[]` | ⛔ **D-05 — regulated. Will not be invented (NN-05).** |
| `nutrition` | `NutritionPanel \| null` | ⛔ **D-05 — same.** |
| `fermentationDays` | `number` | ⛔ **D-52 — six or fourteen? The two source documents disagree.** |
| `variants` | `Variant[]` | |
| `images` | `ProductImage[]` | ⚠ **A-08 — the required crops do not exist.** |
| `status` | `'draft' \| 'active' \| 'archived'` | |

> ⚠ **The catalogue cannot be instantiated at all until D-01 (how many flavours) is answered.**

### 2.2 `FlavourStrip`

| Field | Type | Notes |
|---|---|---|
| `hex` | `string` | `#4A2A55` (Grape Ginger) · `#E9C25B` (Pineapple) · `#C05A2C` (Pineapple Ginger). ⛔ **D-03** — Passion, Beetroot, Gooseberry undefined. |
| `label` | `string` | Uppercase, DM Sans 500, 0.22em tracking. |

> **Binding constraint:** a flavour strip is a **packaging** system, not a **web** system. On the site it appears **only** as a small identifying swatch on the product card and PDP. It is **never** a card background, a section fill, or a button colour — doing so would break the five-colour palette (R-15).

### 2.3 `Variant` — the sellable unit

| Field | Type | Notes |
|---|---|---|
| `id` | `VariantId` | |
| `productId` | `ProductId` | |
| `sku` | `string` | `TS-PIN-500`. Rendered in **JetBrains Mono** (the spec register). |
| `size` | `Size` | ⛔ **D-02 — the Brand Book says 500ml PET; every photograph shows 1 Litre.** |
| `price` | `Money` | ⛔ **D-14 — no approved price exists. Mock data uses an obvious placeholder.** |
| `compareAtPrice` | `Money \| null` | ⚠ **Even if populated, it is never rendered as a struck-through "was" price with urgency framing (P-07).** |
| `inventory` | `Inventory` | |
| `active` | `boolean` | |

### 2.4 `Money`

| Field | Type | Notes |
|---|---|---|
| `amount` | `number` | **Stored in minor units (cents) as an integer.** Never a float — floating-point currency arithmetic is a defect waiting to happen. |
| `currency` | `'KES'` | ⛔ **D-15 — display format.** |
| `taxIncluded` | `boolean` | ⛔ **D-16 — VAT status unknown. No tax logic will be written until answered.** |

### 2.5 `Inventory`

| Field | Type | Notes |
|---|---|---|
| `variantId` | `VariantId` | |
| `onHand` | `number` | |
| `reserved` | `number` | Held by in-flight carts / pending payments. |
| `available` | `number` | Derived: `onHand - reserved`. |
| `lowStockThreshold` | `number` | ⛔ **D-27.** |
| `policy` | `'deny' \| 'backorder' \| 'preorder'` | ⛔ **D-28.** |
| `nextBatch` | `Batch \| null` | ⛔ **D-29** — see 2.6. |

> **Display rule:** stock messaging is **factual**. *"Two bottles remaining."* Never *"Almost gone!"* (P-07).

### 2.6 `Batch`

⛔ **D-29.** Small-batch fermentation makes stock-outs **normal**, not exceptional. *"Next batch bottles on {date}"* is both more on-brand and more **true** than a bare "Out of stock" dead end (R-24).

| Field | Type |
|---|---|
| `id` | `BatchId` |
| `variantId` | `VariantId` |
| `bottlingDate` | `ISODate` |
| `quantity` | `number` |
| `batchNumber` | `string` — rendered in **JetBrains Mono** (Brand Book specifies mono for batch numbers) |

---

## 3. Customer & identity

### 3.1 `Customer`

| Field | Type | Notes |
|---|---|---|
| `id` | `CustomerId` | |
| `email` | `string \| null` | Nullable — **guest checkout is never blocked** (A-07). |
| `phone` | `E164Phone` | **Normalised to `2547XXXXXXXX`.** The normalisation from `07…` / `+254…` / `7…` **lives in the domain layer, not in a component** (NN-06, F-54). |
| `name` | `string` | |
| `group` | `CustomerGroup` | `'guest' \| 'registered' \| 'subscriber' \| 'wholesale' \| 'corporate'` — ⛔ **D-20: does wholesale get a login with group pricing, or is it entirely offline? This materially changes the architecture.** |
| `addresses` | `Address[]` | |
| `createdAt` | `ISODateTime` | |

> ⚠ **Phone is the primary human identifier in this market, not email.** Customer-care lookup is by phone **and** by M-PESA reference (F-88, R-21) — the customer will quote the M-PESA code, not an order number.

### 3.2 `Address`

| Field | Type | Notes |
|---|---|---|
| `id` | `AddressId` | |
| `customerId` | `CustomerId` | |
| `recipientName` | `string` | **Separate from the customer's own name — required by the gift journey.** |
| `phone` | `E164Phone` | **The rider will call this number.** |
| `zoneId` | `ZoneId` | ⛔ **D-21.** |
| `estate` | `string` | Nairobi addressing is estate/building/landmark-based, **not** street-number-based. The address form must reflect this. |
| `building` | `string` | |
| `landmark` | `string` | |
| `instructions` | `string` | |
| `isDefault` | `boolean` | |

> **Note:** a Western `line1 / line2 / postcode` address form is the wrong shape for Nairobi delivery. This model is deliberately different.

---

## 4. Delivery

### 4.1 `DeliveryZone`

| Field | Type | Notes |
|---|---|---|
| `id` | `ZoneId` | |
| `name` | `string` | ⛔ **D-21 — the zone list has not been supplied.** |
| `fee` | `Money` | ⛔ **D-22.** |
| `leadTime` | `LeadTime` | ⛔ **D-23.** |
| `active` | `boolean` | |

> **The `DeliveryZone` is load-bearing across three surfaces:**
> 1. **The PDP zone selector** — the fee must be knowable **before the cart** (P-03, F-29). This is the biggest first-time-buyer frustration in this market and the mitigation for R-08.
> 2. **The cart** (F-47).
> 3. **The admin fulfilment view**, which **groups orders by zone, not by time** (F-86, R-20) — because that is how deliveries are actually routed.

### 4.2 `Fulfilment`

| Field | Type |
|---|---|
| `orderId` | `OrderId` |
| `zoneId` | `ZoneId` |
| `status` | `'pending' \| 'preparing' \| 'out_for_delivery' \| 'delivered' \| 'failed'` |
| `failureReason` | `string \| null` |
| `assignedTo` | `string \| null` |

---

## 5. Cart & order

### 5.1 `Cart`

| Field | Type | Notes |
|---|---|---|
| `id` | `CartId` | |
| `customerId` | `CustomerId \| null` | Null for guests. |
| `lines` | `CartLine[]` | |
| `discountCode` | `string \| null` | |
| `zoneId` | `ZoneId \| null` | **Set as early as the PDP**, not deferred to checkout. |
| `totals` | `Totals` | **Derived in the domain layer. Never computed in a component (NN-06).** |
| `updatedAt` | `ISODateTime` | |

Persistence: `localStorage` for guests; server-side when authenticated.

### 5.2 `CartLine` / `OrderLine`

| Field | Type |
|---|---|
| `variantId` | `VariantId` |
| `quantity` | `number` |
| `unitPrice` | `Money` — **snapshotted at the time of adding** |
| `lineTotal` | `Money` |
| `bundleId` | `BundleId \| null` — set when the line came from a Build-a-Box |

> `OrderLine` **snapshots** the product name, SKU, and price at the time of the order. It does **not** join live to `Variant` — otherwise a later price change would retroactively rewrite historical orders. This is a common and serious defect.

### 5.3 `Totals`

| Field | Type | Notes |
|---|---|---|
| `subtotal` | `Money` | |
| `discount` | `Money` | |
| `delivery` | `Money` | ⛔ **D-22, D-25** (free-delivery threshold). |
| `tax` | `Money` | ⛔ **D-16 — no tax logic will be written until VAT status is confirmed.** |
| `total` | `Money` | |

**All of this arithmetic lives in the domain layer as pure functions.** It is unit-tested independently of any UI. This is the single most important boundary in the codebase (R-13).

### 5.4 `Order`

| Field | Type | Notes |
|---|---|---|
| `id` | `OrderId` | |
| `number` | `string` | Human-readable. **JetBrains Mono.** |
| `customerId` | `CustomerId` | |
| `lines` | `OrderLine[]` | |
| `totals` | `Totals` | Snapshotted. |
| `deliveryAddress` | `Address` | Snapshotted. |
| `billingAddress` | `Address` | **Separate — required by the gift journey.** |
| `status` | `OrderStatus` | See 5.5. |
| `payments` | `Payment[]` | **1..\* — a retried M-PESA push creates a second `Payment`, not a mutation of the first.** |
| `isGift` | `boolean` | ⛔ **D-44.** |
| `giftNote` | `string \| null` | ⚠ **The packing slip for a gift order carries no pricing.** |
| `mpesaReference` | `string \| null` | ⛔ **D-33 — strongly recommend surfacing this.** **It is the primary support key in this market.** |
| `createdAt` | `ISODateTime` | |

### 5.5 `OrderStatus`

```
draft → pending_payment → paid → preparing → out_for_delivery → delivered
                │
                ├──▶ payment_failed
                ├──▶ cancelled          (⛔ D-38 — auto-cancel window not decided;
                │                            orders will NOT be auto-cancelled
                │                            without an explicit rule)
                └──▶ refunded
```

---

## 6. Payments

### 6.1 `Payment`

| Field | Type | Notes |
|---|---|---|
| `id` | `PaymentId` | |
| `orderId` | `OrderId` | |
| `provider` | `'mpesa' \| 'card'` | ⚠ **Deliberately not `'stripe'`.** See R-05 — Stripe may not settle KES for a Kenyan entity, and the card rail may have to become Flutterwave/Pesapal/DPO. **The abstraction is designed so that swap is survivable.** |
| `amount` | `Money` | |
| `status` | `PaymentStatus` | See 6.2. |
| `providerRef` | `string \| null` | M-PESA `CheckoutRequestID`, or the card provider's intent ID. |
| `transactionRef` | `string \| null` | The **M-PESA receipt code** the customer sees on their phone. **This is what they will quote to support.** |
| `webhookEvents` | `WebhookEvent[]` | Append-only. |
| `createdAt` | `ISODateTime` | |

### 6.2 `PaymentStatus`

```
initiated → pending → succeeded
                 │
                 ├──▶ failed      (cancelled by user / insufficient funds / wrong PIN)
                 └──▶ unknown     ⚠ NO CALLBACK RECEIVED WITHIN THE WINDOW
```

> ⚠ **`unknown` is a first-class state and must never be collapsed into `failed`.**
>
> An M-PESA payment has three genuinely different terminal outcomes, and the site does not always know which one occurred. **Guessing about whether a customer's money left their account is the fastest way to destroy trust in this market.**
>
> This is why there are **three** outcome routes, not one generic error page (F-60), and why the pending state must be **server-authoritative and survive a page reload** (F-58, R-10). The `CheckoutRequestID` is the key that makes recovery possible after a connection drop.

### 6.3 `WebhookEvent`

**Append-only. Never mutated. Never deleted.**

| Field | Type | Notes |
|---|---|---|
| `id` | `EventId` | |
| `paymentId` | `PaymentId` | |
| `provider` | `string` | |
| `idempotencyKey` | `string` | **A duplicate callback must be a no-op.** M-PESA will retry. |
| `payload` | `json` | **Raw.** Stored verbatim. |
| `signatureValid` | `boolean` | |
| `receivedAt` | `ISODateTime` | |
| `processedAt` | `ISODateTime \| null` | |

> This table is what lets customer care answer *"did my money go through?"* — the most common support question on an M-PESA store (F-89, R-21). **Read-only access for the care role.**

---

## 7. Subscriptions

### 7.1 `Subscription`

| Field | Type | Notes |
|---|---|---|
| `id` | `SubscriptionId` | |
| `customerId` | `CustomerId` | |
| `lines` | `SubLine[]` | |
| `frequency` | `Frequency` | ⛔ **D-07.** |
| `nextDeliveryDate` | `ISODate` | |
| `status` | `'active' \| 'paused' \| 'cancelled'` | |
| `skippedDates` | `ISODate[]` | **Skip is self-serve, one tap, no contact required (F-39).** |
| `deliveryAddress` | `Address` | |
| `paymentMethod` | `PaymentMethodRef` | ⚠ **See 7.2 — this is the hard one.** |
| `discountPercent` | `number` | ⛔ **D-08.** |

### 7.2 ⚠ `PaymentMethodRef` — the unresolved architectural problem

⛔ **D-09. This is the single most consequential unanswered question in the payments architecture (R-06).**

**M-PESA has no card-on-file equivalent.** A subscriber cannot be silently charged each cycle the way a Stripe customer can. The four possible models produce **materially different** data models and UX:

| Model | Data implication | UX implication |
|---|---|---|
| (a) **Re-prompt with an STK push each cycle** | `Subscription` holds only a phone number. Each cycle creates a fresh `Payment` in `initiated`. | The customer must be **present** to enter their PIN. **This will fail often.** Requires a retry schedule and a dunning flow. |
| (b) **M-PESA standing order / Ratiba** | Requires a mandate reference. | Limited availability; involves the bank. |
| (c) **Card-only subscriptions** | Standard card-on-file. | ⚠ **But see R-05 — the card rail itself may not be viable.** And it excludes the customers most likely to subscribe. |
| (d) **Pre-paid block** (buy 3 months up front) | A subscription is really a **fulfilment schedule against a single paid order**. | Simplest. Most robust. **Arguably the most honest and the most on-brand** — no silent recurring charge, no dunning emails. |

**No subscription code will be written until the client chooses.** The entity above is deliberately provisional.

---

## 8. Discounts

### 8.1 `Discount`

| Field | Type | Notes |
|---|---|---|
| `code` | `string` | |
| `type` | `'percent' \| 'fixed' \| 'free_delivery' \| 'bogo'` | |
| `value` | `number` | |
| `expiresAt` | `ISODateTime \| null` | |
| `usageLimit` | `number \| null` | |
| `usedCount` | `number` | |
| `stackable` | `boolean` | ⛔ **D-18 — can a coupon stack with the subscriber discount?** |
| `customerGroups` | `CustomerGroup[]` | |

> **Presentation constraint (binding, P-07):** a discount is **a coupon field and a cart line item**. It is **never** a banner, a countdown, a badge, or a popup. **No urgency architecture, ever.**

---

## 9. Content entities

**Isolated from the commerce graph by role (F-96).** A content editor cannot reach `Order`, `Customer`, or `Payment`. This is a requirement, not a nicety.

### 9.1 `JournalEntry`

| Field | Type |
|---|---|
| `id` `slug` `title` `excerpt` `body` `heroImage` | |
| `status` | `'draft' \| 'published'` |
| `publishedAt` | `ISODateTime \| null` |

> ⚠ **The copy lint runs on `body` at publish time, not only on source code (F-95, R-19).** A draft containing "wellness journey", "detox", "vibes", or an exclamation mark in body copy **cannot be published.** The editor is the highest-risk author on the project and the least likely to have read the Brand Book. **Process alone will fail; this must be a product feature.**

### 9.2 `Stockist`

| Field | Type |
|---|---|
| `id` `name` `area` `address` `mapUrl` | ⛔ **D-10 — list not supplied.** |

### 9.3 `Enquiry`

| Field | Type |
|---|---|
| `id` | |
| `type` | `'wholesale' \| 'corporate'` |
| `businessName` `contactName` `phone` `email` `location` `expectedVolume` `message` | |
| `status` | `'new' \| 'contacted' \| 'qualified' \| 'closed'` |

> **Wholesale and corporate are enquiry flows, not cart flows.** They do not touch `Order`.

---

## 10. Ports — the handover contract

The `ports/` directory **is** the contract with the backend developer. Every port is a typed interface. **No component may import an adapter** — enforced by an import-boundary lint rule (NFR-06, R-13).

```typescript
// ports/ProductRepository.ts
export interface ProductRepository {
  list(filter?: ProductFilter): Promise<Product[]>;
  bySlug(slug: string): Promise<Product | null>;
  byId(id: ProductId): Promise<Product | null>;
}

// ports/CartRepository.ts
export interface CartRepository {
  get(id: CartId): Promise<Cart | null>;
  addLine(id: CartId, line: CartLineInput): Promise<Cart>;
  updateLine(id: CartId, variantId: VariantId, qty: number): Promise<Cart>;
  removeLine(id: CartId, variantId: VariantId): Promise<Cart>;
  applyDiscount(id: CartId, code: string): Promise<Result<Cart, DiscountError>>;
  setZone(id: CartId, zoneId: ZoneId): Promise<Cart>;
}

// ports/OrderRepository.ts
export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  byId(id: OrderId): Promise<Order | null>;
  listForCustomer(id: CustomerId): Promise<Order[]>;
  // ⚠ The support lookup. The customer quotes the M-PESA code, not an order number.
  findByPhoneOrReference(query: string): Promise<Order[]>;
}

// ports/PaymentGateway.ts
// ⚠ Deliberately provider-agnostic. See R-05 — the card rail may not be Stripe.
export interface PaymentGateway {
  initiate(input: InitiatePaymentInput): Promise<Payment>;
  // ⚠ Server-authoritative. Keyed by providerRef (M-PESA CheckoutRequestID).
  // This is what makes the pending state survive a reload and a connection drop.
  status(providerRef: string): Promise<PaymentStatus>;
  retry(paymentId: PaymentId): Promise<Payment>;  // idempotent
}

// ports/InventoryService.ts
export interface InventoryService {
  check(variantId: VariantId): Promise<Inventory>;
  reserve(variantId: VariantId, qty: number): Promise<Result<Reservation, StockError>>;
  release(reservationId: ReservationId): Promise<void>;
}

// ports/DeliveryService.ts
export interface DeliveryService {
  zones(): Promise<DeliveryZone[]>;
  // ⚠ Called from the PDP, not just the cart. P-03: the fee must be
  // knowable BEFORE the cart. This is the mitigation for R-08.
  quote(zoneId: ZoneId, lines: CartLine[]): Promise<DeliveryQuote>;
}

// ports/SubscriptionService.ts
// ⚠ PROVISIONAL. Blocked on D-09 — M-PESA has no card-on-file equivalent,
// and the four candidate billing models produce different interfaces.
export interface SubscriptionService { /* deferred */ }
```

**Acceptance test for the handover:** the full user-flow test suite runs green against **both** `MockAdapters` and `HttpAdapters`, with **zero changes above the adapter layer**. If that test passes, the handover is clean. If it does not, backend logic has leaked upward (R-13).

---

## 11. Entities that cannot yet be modelled

| Entity | Blocked on |
|---|---|
| `Product` — **the catalogue itself** | **D-01** (3 flavours or 6?) |
| `Variant` — the size axis | **D-02** (500ml or 1L?) |
| `Money` — every price | **D-14** (no approved price) |
| `NutritionPanel` | **D-05** (regulated; will not be invented) |
| `Provenance` | **D-49** (farms not supplied) |
| `DeliveryZone` | **D-21/22/23** (no zones, fees, or lead times) |
| `Subscription.paymentMethod` | **D-09** (the M-PESA recurring problem — R-06) |
| `Totals.tax` | **D-16** (VAT status unknown) |

**Eight of the core entities are unmodellable.** Mock adapters will be built against obviously-placeholder data, clearly marked as such, so that no placeholder can ever be mistaken for a real business rule.

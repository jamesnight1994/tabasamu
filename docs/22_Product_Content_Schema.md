# Product Content Schema

**Source of truth:** `src/domain/catalogue/index.ts`.
Every model below is designed to be **edited from the admin portal** (Phase 4 §6): stable IDs, explicit ordering, human-readable labels, and no behaviour baked into the shape.

---

## The honest-absence type

Every model below uses `Pending<T> = T | Unavailable`.

```ts
interface Unavailable {
  _unavailable: true;
  blockedBy: string;   // 'D-05', 'D-14', 'D-06' …
  note: string;
}
```

**A blocked field is not `null`, not `''`, and not a plausible guess.** It carries the ID of the decision that blocks it, and the UI renders it as a visible ⛔ marker. A ⛔ in production means the system is working.

---

## Product

| Field | Type | Status |
|---|---|---|
| `id`, `slug`, `name` | identifiers | ✅ |
| `flavour` | `string` | ✅ Searchable. Separate from `name` so a *"Grape Ginger — Limited Batch"* still matches "grape". |
| `position` | `number` | ✅ Curated order for the Featured sort. **Admin-editable.** |
| `subscriptionEligible` | `boolean` | ✅ A catalogue **fact**. Does *not* mean subscriptions work (⛔ D-09). |
| `descriptor` | `Pending<string>` | ✅ **"Caffeine Free"** (D-13 answered) |
| `base` | `Pending<string>` | ✅ **"Rooibos"** (D-50 answered) |
| `forwardNote` | `Pending<string>` | ⛔ **D-51** for Passion, Beetroot, Gooseberry |
| `strip` | `FlavourStrip` | ✅ Quarantined to the swatch (R-15) |
| `ingredients` | `Pending<Ingredient[]>` | ⛔ **D-05** — regulated |
| `nutrition` | `Pending<NutritionPanel>` | ⛔ **D-05** — regulated |
| `provenance` | `Pending<Provenance[]>` | ⛔ **D-49** — no farms named |
| `fermentationDays` | `Pending<number>` | ⛔ **D-52** — the sources disagree |
| `storage` | `StorageGuidance` | partial — see below |
| `variants` | `Variant[]` | ✅ |
| `images` | `ProductImage[]` | ✅ Drawn from the slot registry |
| `status` | `'draft' \| 'active' \| 'archived'` | ✅ |
| `seo` | `SeoContent?` | ✅ **Admin-editable**, with derived fallbacks |

### ⚠ `status` and `hasPhoto` are different facts

Beetroot and Gooseberry are **`active`** and **purchasable** while their photographs are **missing**.

A missing photograph is an *asset* problem. It is not a merchandising decision. Conflating the two would silently hide a third of the range from the shop — a far bigger lie than an honest "photography pending" panel.

---

## StorageGuidance

| Field | Status |
|---|---|
| `refrigeration` | ✅ **Stated.** *"Keep refrigerated. This is a live product…"* |
| `shelfLife` | ⛔ **D-05** — a guessed shelf life is a food-safety claim |
| `servingSuggestion` | ⛔ **D-53** — no approved copy |

> **⚠ Handling guidance is not a health claim.** *"Keep refrigerated"* is a factual instruction for a live ferment. *"Aids digestion"* would be a regulated medical claim, and appears **nowhere** in this codebase — enforced by `check-brand.mjs` and by test.

---

## Variant

| Field | Status |
|---|---|
| `sku` | ✅ Rendered in JetBrains Mono — the spec register |
| `size` | ✅ `SIZE_1L` (D-02) |
| `price` | ⛔ **D-14** — placeholder, marked *"indicative"* in every UI |
| `compareAtPrice` | ✅ **`null` on every variant.** Inventing a *"was KES 700"* strikethrough is inventing a discount. |

---

## SubscriptionOption

```ts
interface SubscriptionOption {
  interval: 'weekly' | 'fortnightly' | 'monthly';
  discount: Pending<never>;   // ⛔ D-09 — NOT zero, NOT null-with-a-default
  available: boolean;         // false, all of them
}
```

**⛔ D-09 — the billing model is not chosen, and this is not a small gap.**

M-PESA has **no card-on-file equivalent**. A subscriber cannot be silently charged each cycle the way a Stripe subscription works. At least four candidate models exist, and they produce four *different* data models:

1. **STK re-prompt** — push a request each cycle; customer approves on their handset. High friction, high churn.
2. **M-PESA Ratiba** — a standing order. Requires separate onboarding.
3. **Card-on-file** — but see ⛔ **D-35**: *can Stripe even settle KES?*
4. **Pre-paid block** — customer buys N deliveries up front. Simplest, arguably most honest, and a genuinely different product.

So the type carries **cadence only**. No price, no discount, no billing behaviour. `SUBSCRIPTIONS_AVAILABLE === false`.

> **"Save 0%" is a worse lie than saying nothing.** No discount is modelled — not even zero.

---

## Bundle

```ts
interface Bundle {
  kind: 'preset' | 'build-your-own';
  requiredBottles: Pending<number>;   // ⛔ D-06 — NOT 6, NOT 12
  items: BundleItem[];
  price: Pending<Money>;              // ⛔ D-14 — NOT the sum of the parts
  discount: Pending<never>;           // ⛔ D-06
}
```

**⛔ D-06 — the bottle count is unconfirmed, and the builder refuses to validate against a guess.**

`validateBundle()` returns `{ kind: 'unknown-requirement' }` rather than falling back to a default.

> **Why that is the right behaviour and not a cop-out.** Assuming six would produce a builder that *looks* finished: it would count to six, go green, and let a customer configure a box the business never agreed to sell — at a price nobody approved, with a discount that does not exist. That bug is invisible in a screenshot and expensive in production.

Everything else works: quantity controls, inventory ceilings, live progress, running summary, sticky mobile bar. **Set `requiredBottles` to a number and all of it starts working.** That is the whole change.

**The price is not computed as the sum of the parts** — a bundle costing exactly the sum of its parts is not a bundle, and presenting one implies a saving that does not exist.

---

## Collection · Media · SEO

**`Collection`** — curated product groups. Editorial order, admin-editable.

**`Media`** — a first-class asset record, distinct from `ProductImage` (which is a *use* of an asset). Carries `portraitSrc` for the art-directed crop, and a **`defect`** field.

> The `defect` field exists because the supplied Pineapple photograph's label reads **"Gluten Free"** while the site says **"Caffeine Free"**. Recording it on the asset means it cannot be quietly forgotten when someone reuses the image elsewhere.

**`SeoContent`** — every field optional, with a derived fallback. An admin who leaves the meta description blank gets a sensible one, not an empty tag.

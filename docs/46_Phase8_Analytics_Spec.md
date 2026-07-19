# 46 · Phase 8 Analytics Event Specification

**Date:** 2026-07-15
**Status:** specification + consent mechanism only. **No analytics vendor is connected.** [NN-04]

---

## 1. Principles

1. **Deny by default.** No event fires until the customer opts in on the cookie banner. Kenya Data Protection Act 2019 (D-43) treats an analytics vendor as a third-party processor, so non-essential tracking is opt-in, not opt-out.
2. **Two gates on every `track()`:** the environment flag `NEXT_PUBLIC_ANALYTICS_ENABLED` *and* granted consent. Both must be true. The gate lives in one place (`src/lib/analytics/index.ts`), so no call site can forget it.
3. **No PII, ever.** No name, phone, email, address, order ID that resolves to a person, or M-PESA reference enters a payload.
4. **No money.** Amounts are excluded — prices are blocked (D-14) and, more durably, sending revenue to a third party is a data-minimisation decision for the client, not a default.
5. **Vendor-agnostic.** GA4, Plausible, PostHog are each just an `AnalyticsSink`. Swapping one changes one file.

## 2. The events

Typed as a discriminated union in `src/lib/analytics/index.ts` — a misspelled event name is a compile error.

| Brief event | `name` | Payload (no PII) |
|---|---|---|
| Product viewed | `product_viewed` | `slug` |
| Product list viewed | `product_list_viewed` | `count` |
| Search | `search_performed` | `resultCount` |
| Filter | `filter_applied` | `facet` |
| Add to cart | `add_to_cart` | `slug`, `quantity` |
| Remove from cart | `remove_from_cart` | `slug` |
| Cart viewed | `cart_viewed` | `itemCount` |
| Checkout started | `checkout_started` | `itemCount` |
| Delivery selected | `delivery_zone_selected` | `zone` |
| Payment method selected | `payment_method_selected` | `provider` (`mpesa`\|`card`) |
| Payment initiated | `payment_initiated` | `provider` |
| Purchase confirmed | `order_completed` | `itemCount` |
| Payment failed | `payment_outcome` | `outcome` (`succeeded`\|`failed`\|`unknown`) |
| Coupon applied | `discount_applied` | `valid` (bool) |
| Subscription selected | `subscription_selected` | `frequency` |
| Newsletter signup | `newsletter_signup` | — |
| Wholesale enquiry | `enquiry_submitted` | `type` (`wholesale`\|`corporate`) |
| WhatsApp support click | `whatsapp_support_click` | — |
| (implicit) Page view | `page_view` | `path` |

### Note on `payment_outcome`

`unknown` is a first-class outcome, tracked separately from `failed`. On M-PESA an STK push returns an acknowledgement before a PIN is typed; a payment whose result the server has not yet confirmed is `unknown`, not `failed`. It is the number to watch.

## 3. Consent model

`src/lib/analytics/consent.ts`:

- Categories: `essential` (always on — cart/session, disclosed, not tracking) and `analytics` (opt-in).
- `decidedAt: null` means no choice yet → banner shows, nothing non-essential runs.
- A malformed or stale-version stored value degrades to "no decision" (re-prompts), never to a silent yes.
- `ConsentProvider` mirrors the decision into the analytics module (`setAnalyticsConsent`) so the gate is consistent everywhere, and persists it to `localStorage`. Storage failure degrades to deny.

## 4. Where events attach (implementation guide)

The spec is complete; wiring the calls is a small, mechanical follow-up when a vendor is chosen. Attach points, by existing component:

- `ProductDetail` → `product_viewed`; `ShopGrid` → `product_list_viewed`, `filter_applied`
- `CartProvider` → `add_to_cart`, `remove_from_cart`; `Cart`/`/cart` → `cart_viewed`
- `CheckoutForm` → `checkout_started`, `delivery_zone_selected`, `payment_method_selected`, `payment_initiated`, `discount_applied`
- `PaymentStatus` → `payment_outcome`, `order_completed`
- `SubscriptionViews` → `subscription_selected`; `Newsletter` → `newsletter_signup`
- wholesale/corporate forms → `enquiry_submitted`; a WhatsApp link → `whatsapp_support_click` (pending D-42)

## 5. Verification

`tests/unit/phase8.test.ts` asserts: default denies; opt-in allows and opt-out blocks; a malformed stored value re-prompts; `track()` stays silent without consent even when the flag is on, fires once granted, and stops when consent is withdrawn.

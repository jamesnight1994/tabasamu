# Account — State & Error Handling — Phase 6

**Status:** Reference. How the account area behaves in every non-happy state.

The account area is mostly about states that aren't "success". This document is the map of them.

---

## 1. Auth states

```
              ┌─────────────┐
              │  anonymous  │
              └──────┬──────┘
        signIn / register │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                   ▼
  invalid_credentials  unverified         rate_limited / locked
   (retry, generic)   (resend link)       (form DISABLED, wait shown)
        │                 │  verifyEmail        │
        │                 ▼                     │
        │            ┌─────────┐                │
        └──────────▶ │ signed  │ ◀──────────────┘ (after wait)
                     │   in    │
                     └────┬────┘
             expiry / signOut │
                     ▼
                anonymous
```

| State | What the user sees | Recovery |
|---|---|---|
| `invalid_credentials` | "That email and password do not match." | retry |
| `unverified` | correct login, but "verify your email first" + resend | click link |
| `rate_limited` | "Wait N minutes" — **form disabled** | wait |
| `locked` | "Locked for N minutes" — form disabled | wait |
| session expired | route guard sends to sign-in on next protected view | sign in |

---

## 2. Route protection

The account layout **holds render until `useSession().loading` is false** — i.e. until the server answers "who are you?". Only then does it decide: signed-in → content; anonymous → sign-in prompt. Consequences:

- No protected content is ever painted for an anonymous visitor (no flash-of-private-data).
- No logged-out flash for an authenticated one on reload.
- The decision is **server-backed**, not a spoofable client flag.

---

## 3. Empty & loading states (every list has all three)

| Surface | Loading | Empty | Populated |
|---|---|---|---|
| Orders | skeleton rows | "No orders yet" + shop link | list |
| Order detail | skeleton | "Order not found" + back | detail |
| Addresses | skeleton | "No saved addresses" + add | grid |
| Subscriptions | skeleton | "No subscription yet" (being finalised) | list |
| Preferences | skeleton | — (always has defaults) | toggles |

⚠ Skeletons are shown DURING load specifically so an empty state never flashes before data arrives — which would read, for a beat, like "we lost your data".

---

## 4. Blocked-decision states (rendered honestly, never faked)

| Field | Blocked by | Renders as |
|---|---|---|
| Subscription next-delivery date | D-09 | `Unavailable` marker |
| Subscription estimated total | D-09 | `Unavailable` marker |
| Failed-payment recovery mechanism | D-09 | "Mark as resolved" (state only, no charge) |
| Delivery zone on an address | D-21/22/23 | optional field, honest label |
| Invoice download | billing not connected | disabled button + tooltip |
| WhatsApp marketing send | D-42 | toggle captured, "Coming soon" |
| Consent policy version | D-43 | `pending-D-43` placeholder |

None of these is faked. Each shows the customer that a real question is still open. [NN-05]

---

## 5. Subscription operation errors

| Attempt | Result | Message |
|---|---|---|
| pause a `payment_failed` sub | refused | "Pausing is not available." |
| cancel before commitment met | refused | "Can be cancelled after N more deliveries." |
| change to an unoffered frequency | blocked | "This option is being finalised." (D-07) |
| any op on a terminal sub | refused | (buttons not shown) |

The UI computes which buttons appear from `permittedOperations(sub, policy)` — a pure function — so a shown button can never produce a "not permitted" error, and a disallowed action has no button.

---

## 6. Consent & data-request states

- Every marketing toggle writes an **append-only** consent event; the toggle reflects the derived current value.
- Cookie choices count as "decided" whether accept-all or reject-all (reject is exactly as easy as accept).
- A data **export** request → `requested` → (backend) `in_progress` → `completed`.
- A data **deletion** request → `requested` → may resolve `rejected` with a reason (records under legal retention). The UI states this up front so the outcome is never a surprise.

---

## 7. Network failure

Every adapter call is wrapped. A thrown network error becomes a retryable message, never a false terminal state — the same discipline as the payment layer: a failed request tells us nothing about server state, so we never infer one.

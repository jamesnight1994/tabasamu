# Payment & Order State Diagrams — Phase 5

**Status:** Architecture. No integration is live. [NN-04]
**Scope:** the two state machines that decide, at every moment, what a customer sees and whether money can move.

These are not illustrations. Both machines are enforced in code (`src/domain/order/index.ts`, `src/domain/payment/index.ts`), their transition tables throw on an illegal move, and the tests in `tests/unit/checkout.test.ts` assert every dangerous edge below.

---

## 1. Why two machines, not one

A payment and an order are different things with different lifespans, and collapsing them is the root cause of the two worst ecommerce failures in this market:

- An **order** is our promise to deliver. It outlives any single payment attempt — a customer may fail M-PESA twice and succeed on the third try against the *same order*.
- A **payment** is one attempt to move money. It has its own terminal states, and one of them is **not knowable from the client**.

They are linked but never merged.

---

## 2. Payment states

```
                    ┌─────────────┐
   initiate()  ───▶ │  initiated  │   Safaricom ACCEPTED the STK push.
                    └──────┬──────┘   ⚠ This is NOT payment. No PIN yet.
                           │
                           ▼
                    ┌─────────────┐
                    │   pending   │   Customer is holding their phone.
                    └──┬───┬───┬──┘
          callback ────┘   │   └──── callback
          (paid)           │         (rejected)
             │             │              │
             ▼             ▼              ▼
      ┌───────────┐  ┌──────────┐  ┌───────────┐
      │ succeeded │  │ unknown  │  │  failed   │
      └───────────┘  └──────────┘  └───────────┘
        TERMINAL      ⚠ TERMINAL      TERMINAL
                      no callback
                      within 90s
```

### The three outcomes, and the one everybody gets wrong

| State | Meaning | What the customer sees | Retry offered? |
|---|---|---|---|
| `succeeded` | Callback confirmed the money moved | Receipt + **M-PESA reference** (D-33) | — |
| `failed` | Callback confirmed rejection (wrong PIN, insufficient funds, user cancelled) | "Nothing has been charged." Non-judgemental. | **Yes** |
| `unknown` | **No callback arrived inside the 90s window** | "We have not heard back. **Do not pay again.**" | **⚠ NO** |

**`unknown` is the state that protects the customer.** When Safaricom never calls back, the money *may still have left their account*. Showing `failed` — the intuitive default — invites someone who has already paid to pay a second time. So `unknown`:

- is a **first-class terminal state**, never collapsed into `failed`;
- offers **no retry button** — the single most important instruction on that screen is *do not pay again*;
- routes the order to `manual_reconciliation`, where a human checks the M-PESA statement.

`PENDING_WINDOW_MS = 90_000`. `PENDING_POLL_INTERVAL_MS = 3_000`. Both live in `domain/payment`.

---

## 3. Order states

15 states. Terminal states have no outbound transitions — enforced by `ORDER_TRANSITIONS`, which throws `IllegalTransitionError` on any illegal move.

```
 draft
   │  (checkout submitted)
   ▼
 awaiting_payment ◀─────────────┐
   │                            │ (retry after failure)
   │ (STK accepted)             │
   ▼                            │
 payment_processing             │
   │        │         │         │
   │ paid   │ failed  │ no callback
   ▼        ▼         ▼         │
 paid   payment_failed  manual_reconciliation
   │        │    │              │  │  │
   │        └────┘              │  │  └──▶ cancelled
   │      (retryable)  ┌────────┘  └─────▶ paid
   │                   ▼
   │              payment_failed
   ▼
 confirmed ──▶ preparing ──▶ ready_for_dispatch ──▶ dispatched ──▶ delivered
                                                        │              │
                                              ⚠ NOT cancellable        │
                                                                       ▼
                                                                 refund_pending
                                                                       │
                                                            ┌──────────┴─────────┐
                                                            ▼                    ▼
                                                        refunded         partially_refunded
                                                        TERMINAL              TERMINAL
```

### Edges that are deliberately IMPOSSIBLE

| Attempted transition | Result | Why |
|---|---|---|
| `delivered → cancelled` | **throws** | You cannot cancel a box someone is holding. Only `refund_pending`. |
| `dispatched → cancelled` | **throws** | The rider is en route. Refund path only. |
| `cancelled → anything` | **throws** | Terminal. A late callback cannot resurrect it. |
| `refunded → anything` | **throws** | Terminal. |
| `paid → awaiting_payment` | **throws** | Money cannot un-move. |

### `manual_reconciliation` — neither settled nor failed

Reached only from `payment_processing` when a payment goes `unknown`. It resolves in **both** directions:

- `→ paid` — the statement shows the money arrived.
- `→ payment_failed` — it did not; the order is retryable.
- `→ cancelled` — abandoned.

`isSettled()` returns **false** and `isAwaitingMoney()` returns **false** for this state. It is honest about not knowing, and no downstream logic may assume either resolution.

---

## 4. Idempotency — the double-charge guard

Every `initiate()` carries an `IdempotencyKey`, generated **once per checkout attempt** and reused on retry. Two taps of "Place order" with the same key:

- return the **same** payment (`replayed: true`);
- produce **one** STK push;
- create **one** order.

⚠ **This must be enforced by a DATABASE UNIQUE CONSTRAINT on the backend.** An application-level "check the map, then insert" is a race across two processes — the mock reproduced exactly this bug and the fix was to close the window synchronously. The backend cannot close it in application code at all. See `12_Backend_Handover_Requirements.md` §Idempotency.

---

## 5. Where each rule lives

| Rule | File | Test |
|---|---|---|
| Order transition table | `src/domain/order/index.ts` | `checkout.test.ts` › order state machine |
| Payment outcome resolution | `src/domain/payment/index.ts` | `checkout.test.ts` › unknown payment |
| View resolution (3 outcomes) | `src/components/commerce/PaymentStatus.tsx` › `viewFor` | `flows.test.tsx` › payment view |
| Idempotency | `src/adapters/mock/payments.ts` | `checkout.test.ts` › idempotency; `flows.test.tsx` › double submission |

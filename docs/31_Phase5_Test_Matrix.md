# Phase 5 Test Matrix

**275 assertions, 7 suites, all passing.** Phase 5 added 60 (checkout: 48, flows: 12) and rewrote the M-PESA block of the G2 suite.

The matrix below maps each **way of taking money and giving nothing** to the test that prevents it. The ⚠ rows are the ones that matter — the edges naive integrations ship broken.

---

## 1. Payment outcomes

| Scenario | Expected | Test | Suite |
|---|---|---|---|
| STK accepted, PIN entered, callback confirms | `succeeded` + M-PESA ref | ordinary path | checkout |
| ⚠ **No callback within 90s** | **`unknown`, never `failed`** | payment with NO callback → not failed | checkout |
| ⚠ Timed-out pending in the UI | `unknown` view, **no retry button** | timed-out pending resolves to unknown | flows |
| Wrong PIN / insufficient / cancelled | `failed`, retryable | (contract) | checkout |
| ⚠ Success arrives LATE (after timeout) | `unknown` then reconciles up | reconciliation may still fail honestly | checkout |
| Initiate cannot report success | type-narrowed `initiated\|pending` | initiate never reports success | g2 |

## 2. The double-charge guards

| Scenario | Expected | Test | Suite |
|---|---|---|---|
| ⚠ **Double-tap, same key** | **ONE payment, `replayed:true`** | DOUBLE-TAP returns SAME payment | checkout |
| ⚠ Two concurrent initiates (race) | ONE payment | two concurrent initiates → one payment | flows |
| New attempt after real failure | NEW key, NEW push | new attempt gets new key | checkout |
| Duplicate callback | no-op, still `accepted` | duplicate callback is a NO-OP | checkout |

## 3. Order state machine

| Illegal move | Expected | Test | Suite |
|---|---|---|---|
| ⚠ Late callback rewrites a delivered order | **refused** | REFUSES late callback on delivered | checkout |
| ⚠ Late callback resurrects a cancelled order | **refused** | REFUSES resurrection of cancelled | checkout |
| Dispatched → cancelled | refused (refund only) | dispatched cannot be cancelled | checkout |
| Repeat of same transition | idempotent no-op | idempotent no-op | checkout |
| `manual_reconciliation` both directions | paid OR failed | resolves in BOTH directions | checkout |
| `manual_reconciliation` settled? | neither settled nor failed | NEITHER settled NOR failure | checkout |
| Terminal states | no way out | terminal states have no exit | checkout |

## 4. Webhooks

| Scenario | Expected | Test | Suite |
|---|---|---|---|
| ⚠ Unsigned callback | **discarded** | UNSIGNED callback DISCARDED | checkout |
| Malformed body | rejected, no crash | malformed body rejected | checkout |
| Duplicate delivery | no-op, 2xx | duplicate callback no-op | checkout |

## 5. Stale cart (revalidation)

| Scenario | Expected | Test | Suite |
|---|---|---|---|
| ⚠ Price **rose** since add | blocks, must acknowledge | price RISE blocks | checkout |
| Price **dropped** | does NOT block | price DROP does not block | checkout |
| Line sold out | blocks | SOLD-OUT blocks checkout | checkout |

## 6. Cart persistence (hostile storage)

| Input | Expected | Test | Suite |
|---|---|---|---|
| Good cart | round-trips | round-trips a good cart | checkout |
| ⚠ Reload / tab death | cart survives | SURVIVES a page reload | flows |
| Older schema version | discarded whole | DISCARDS older schema | checkout |
| Negative quantity | discarded whole | DISCARDS negative quantity | checkout |
| Float price | discarded whole | DISCARDS a FLOAT price | checkout |
| Expired (>14d) | discarded | discards cart older than max age | checkout |
| Outright garbage | empty, no crash | survives outright garbage | checkout |
| ⚠ Corrupt line at runtime | empty cart, storefront renders | CORRUPT stored cart → empty | flows |
| ⚠ localStorage throws (Safari private) | storefront still loads | survives localStorage throwing | flows |

## 7. Honest absence (NN-05)

| Scenario | Expected | Test | Suite |
|---|---|---|---|
| ⚠ **No delivery zone** | **total is `Unavailable`, not KES 0** | TOTAL is Unavailable while no zone | flows |
| Unknown delivery fee | refused, never zero | refuses unknown fee, never zero | checkout |
| VAT status unknown | tax always `Unavailable` | (D-16, rendered by PendingValue) | — |

## 8. Checkout validation

| Scenario | Expected | Test | Suite |
|---|---|---|---|
| Well-formed Kenyan checkout | accepted | accepts well-formed checkout | checkout |
| Phone normalisation | → `2547…` | phone normalised to 254 form | checkout |
| Foreign (UK) number | rejected | UK number rejected | checkout |
| Landmark | required | landmark required | checkout |
| Terms | must be actively accepted | terms must be accepted | checkout |
| Email | optional | email optional | checkout |
| Double-submit | guarded | submission guard | checkout |
| Session expiry | expires at 30min | session expiry | checkout |

## 9. Refunds

| Scenario | Expected | Test | Suite |
|---|---|---|---|
| ⚠ M-PESA refund | `pending_manual`, needs human | M-PESA refund is NOT one-click | checkout |
| STK cancel | not supported, says so | STK push cannot be cancelled | checkout |

## 10. Brand voice (enforced by lint + test)

| Rule | Test |
|---|---|
| No exclamation marks in status copy | no status copy uses exclamation | 
| No blame on the customer | no copy blames the customer |
| ⚠ No scarcity cues ("only N left") | `lint:brand` — caught and fixed one real violation |

---

## What is NOT covered here, and is recorded honestly

- **Visual layout at 360px** — jsdom does not lay out pixels. Overflow/touch-target checks require a real browser, which could not be installed in the build sandbox (egress-blocked). **Outstanding.** See `24…` note and Phase 5 report §Verification.
- **Live provider round-trips** — no M-PESA/card integration is connected. [NN-04] These are specified (`26`, `27`) and stubbed, not tested against a live rail.

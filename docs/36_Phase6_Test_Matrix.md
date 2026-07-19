# Phase 6 Test Matrix

**327 assertions, 9 suites, all passing.** Phase 6 added 52 (account: 46, account-flows: 6).

The ⚠ rows protect a customer or a legal obligation. This matrix maps each risk to the test that prevents it.

---

## 1. Authentication — enumeration & rate limiting

| Scenario | Expected | Test |
|---|---|---|
| ⚠ wrong password vs unknown email | **identical** `invalid_credentials` | same error, no enumeration |
| ⚠ repeated failures | `rate_limited` + retry-after | rate-limits after repeated failures |
| ⚠ new account signs in before verifying | refused, `unverified` | UNVERIFIED cannot sign in |
| verify then sign in | succeeds | (same test, second half) |
| ⚠ reset request for any email | always `sent` | never reveals whether account exists |
| reset with good token | password changed, lockout cleared | completes a password reset |
| reset with forged token | `invalid_token` | rejects an invalid token |

## 2. Email & password validation

| Scenario | Expected | Test |
|---|---|---|
| plus-tags, new TLDs | accepted | does NOT reject plus-tags |
| garbage emails | rejected | rejects the obvious garbage |
| short password | rejected | length is the primary control |
| ⚠ common weak password (long enough) | rejected | rejects common weak values |
| passphrase, no symbols | accepted | no composition rules |
| registration without terms | refused | refuses when terms not accepted |
| foreign phone | rejected | rejects a foreign number |

## 3. Session

| Scenario | Expected | Test |
|---|---|---|
| expiry detection | correct | detects expiry |
| expiring-soon warning window | correct | warns shortly before expiry |
| ⚠ sign in → name exposed → sign out | clean lifecycle | signs in… and signs out cleanly |
| initial state | anonymous after check resolves | starts unauthenticated |

## 4. Address book — the single-default invariant

| Scenario | Expected | Test |
|---|---|---|
| landmark missing | rejected | requires a landmark |
| ⛔ zone while unconfirmed | not forced | does not force a zone (D-21/22/23) |
| ⚠ first address added | auto-default | first becomes default automatically |
| ⚠ second address | does not steal default | second does not steal default |
| set default | exactly one default | setting a default moves it to one |
| ⚠ remove the default | another promoted | removing default promotes another |
| remove last | empty, no default | leaves an empty book |
| ⚠ through the adapter | invariant holds | single-default invariant via adapter |

## 5. Subscription — state machine, NO billing

| Scenario | Expected | Test |
|---|---|---|
| ⛔ default frequencies | none offered | offers no frequencies (D-07) |
| pause ↔ resume | round trips | active can pause; paused can resume |
| ⚠ cancelled / expired | terminal | terminal — no transitions out |
| ⚠ min-commitment | cancel blocked until met | respects a minimum-cycle commitment |
| commitment met | cancel allowed | permits cancel once met |
| ⚠ payment_failed | not active, not cancelled | neither active nor cancelled |
| ⚠ reactivate | NEW subscription id | reactivation creates a NEW subscription |
| ⚠ full arc | pause→resume→cancel→reactivate | the full manage arc |

## 6. Preferences & consent

| Scenario | Expected | Test |
|---|---|---|
| ⚠ cookie default | undecided, only necessary on | default is undecided |
| accept-all / reject-all | both count as decided | both count as a decision |
| ⚠ transactional email | cannot be off | transactional cannot be switched off |
| ⚠ SMS transactional | ON by default (Kenya) | SMS transactional defaults ON |
| ⛔ WhatsApp | fully off | defaults fully off (D-42) |
| ⚠ latest event wins | derived correctly | latest event per topic wins |
| ⚠ no events | withheld | absence means WITHHELD |
| ⚠ record twice | both kept | appends, never overwrites |
| ⚠ deletion | a request, not an action | status is `requested`, not `completed` |

## 7. Cross-session data isolation

| Scenario | Expected | Test |
|---|---|---|
| signed-in demo | has orders + subscription + M-PESA ref | demo customer has orders |
| ⚠ signed-out | sees nothing | data is per-session |

---

## What is NOT covered, stated honestly

- **Visual layout at 360px** — jsdom does not lay out pixels. Overflow and touch-target checks at mobile width need a real browser, which is egress-blocked in this sandbox. The flow *logic* is covered (6 jsdom flow tests); the *layout* is **outstanding**. [carried from Phase 5]
- **Live auth / email / billing** — no provider connected. [NN-04] Enumeration-resistance, rate-limiting, and the state machines are tested against the mock, which reproduces those behaviours; the real providers are D-53/54/55 and D-09.

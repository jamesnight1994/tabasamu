# Phase 6 Implementation Report — Authentication, Account, Orders & Subscriptions

**Date:** 2026-07-15
**Result:** 327/327 tests · 26/26 routes · all six gates green · production build clean.
**Scope:** the complete customer self-service area — auth, dashboard, order history, address book, subscription management, preferences — built provider-neutral. **No auth, email, or subscription-billing integration is live.** [NN-04]

---

## 1. The one-sentence summary

Phase 6 builds an account area that **manages everything and pretends nothing** — a customer can do all the self-service the brief asks for, while every field that depends on an unanswered decision (subscription billing, delivery zones, consent policy version) renders as an honest "awaiting confirmation" rather than a plausible guess.

---

## 2. What was built

### Domain (pure, tested, framework-free)
- `identity/auth` — email/password validation, session lifecycle, the `AuthError` states people skip (rate-limited, locked, unverified), enumeration-safe reset.
- `identity/customer` — profile validation + the address-book **single-default invariant** as pure functions.
- `subscription` — the lifecycle state machine, configurable policy, permitted-operations calculator; **billing deliberately absent**.
- `preferences` — channel prefs, cookie categories, and the **append-only consent** model with derived current state.

### Adapters
- `mock/accounts` — a realistic in-memory backend: rate-limits, enforces the verification gate, keeps an append-only consent log, drives the subscription machine. Seeds a demo customer so the area is explorable.
- `http` — five new stubs throwing `NotImplemented` (the backend checklist).

### UI (26 routes)
- `(auth)`: sign-in, register, reset (request + complete), verify — with the error states as the product.
- `(account)`: dashboard, orders + order detail (timeline, M-PESA ref, reorder, cancellation-where-permitted), address book (add/edit/delete/default), subscription list + detail (all permitted ops), preferences (channels, cookies, consent, data rights).
- Route guard in the account layout; account link in the storefront header.

---

## 3. The decisions that shaped the build

### 3.1 Provider-neutral auth (D-53/54/55)
There was **no auth decision on record** — a genuine gap, now raised as D-53–56. Rather than pick a vendor, the whole area is built behind an `AuthService` port and a `Session` descriptor. Firebase, Supabase, Auth0, or a bespoke backend all drop in without touching the UI.

### 3.2 The frontend never holds a token
The session in React is a *descriptor* (who you are, when it expires) — never the authorising credential. That lives in an httpOnly cookie the JS can't read. A token in state or localStorage is XSS-exfiltratable; there isn't one. [D-55]

### 3.3 Enumeration resistance as a hard requirement
Sign-in, password reset, and resend-verification all refuse to reveal whether an email has an account. Wrong-password and unknown-email return the **same** error; reset always says "if that email has an account, a link is on its way." Three tests lock this in.

### 3.4 Subscription management is real; billing is blocked (D-09)
Every management action — pause, resume, skip, change flavours/quantity/address/payment, cancel, reactivate — is implemented and tested. But **no method moves money**, because M-PESA has no card-on-file and the billing model (standing order vs per-cycle re-prompt) is undecided. Next-charge date and amount render as `Unavailable`; failed-payment "recovery" is a state transition, not an invented charge. `reactivate` creates a *new* subscription so history stays honest.

### 3.5 Consent is a legal record, not a boolean (D-43)
Every consent change appends a `ConsentEvent`; current state is derived from the latest event per topic. This is what makes consent provable under the Data Protection Act. Transactional messages can't be switched off; deletion is a *request* with a status (some records are retained by law), not an instant purge.

### 3.6 The single-default address invariant
An address book has at most one default, and exactly one if non-empty. Enforced by pure domain functions over the whole list — removing the default promotes another; the first added is default automatically. Two addresses can never both be default because the domain won't produce that state.

---

## 4. Verification

| Gate | Result |
|---|---|
| typecheck | ✅ clean |
| lint + **boundaries** | ✅ 0 errors — no component imports an adapter |
| lint:secrets | ✅ no secret in client bundle |
| lint:brand | ✅ (caught + fixed 11 "pure white ground" violations) |
| lint:contrast | ✅ WCAG 2.2 AA |
| test | ✅ 327/327 |
| build | ✅ 26/26 routes |

### ⚠ What the brand lint caught
I used `bg-white/40` for account card grounds. The Brand Book §03 forbids pure white as a ground (cream is the canvas). The lint failed the build; I replaced all eleven with the on-palette `bg-charcoal/[0.02]` tint used in Phases 4–5. The guardrail working as designed.

### ⚠ What is NOT verified, stated honestly
**Mobile layout was not browser-tested.** Playwright's browser can't be downloaded in this sandbox (egress-blocked). The account *journey logic* is driven through jsdom (6 flow tests + 46 unit tests), but jsdom doesn't lay out pixels — so 360px overflow and touch-target checks **remain outstanding**, carried forward from Phase 5. Not claimed as passed. [NN-04]

---

## 5. Decisions still blocking launch (Phase 6)

| # | Decision | Blocks |
|---|---|---|
| D-07 | Subscription frequencies | frequency picker (empty until set) |
| D-08 | Subscriber discount | sub pricing display |
| D-09 | **Subscription billing model** | all subscription money movement |
| D-40/41/42 | Email/SMS/WhatsApp providers | actual notification sends |
| D-43 | ODPC registration | consent policy versions, privacy copy |
| D-53 | Auth mechanism/provider | auth go-live |
| D-54 | Email verification/reset delivery | verification + reset emails |
| D-55 | Session model | cookie/refresh mechanics |
| D-56 | Social login (if approved) | not built |

None invented; each renders as a visible blocked marker or a stubbed adapter.

---

## 6. Files changed

**Created (domain):** `identity/auth`, `identity/customer`, `subscription/index`, `preferences/index`.
**Created (adapters):** `mock/accounts`.
**Created (UI):** `SessionProvider`, `AuthForms`, `ResetFlow`, `VerifyEmail`, `AccountDashboard`, `OrderViews`, `AddressBook`, `SubscriptionViews`, `Preferences`; the `(auth)` and `(account)` route groups (11 pages + 2 layouts).
**Edited:** `ports/index` (5 new services + Adapters), `adapters/http` (5 stubs), `adapters/mock/index` (wire + demo orders), `shared` (`subscriptionId`), `layout/Header` (account link).
**Docs (5):** `33`–`37` — auth contract, account API contract, state/error handling, test matrix, this report. Register updated with D-53–D-56.

---

## 7. For the backend developer

Start at `34_Account_API_Contract.md` §6 and `33_Authentication_Contract.md` §7 — the checklists. Implement the `src/adapters/http/*` methods, add an **append-only consent table**, enforce the **single-default** invariant and the **idempotent, enumeration-safe** auth behaviours the mock demonstrates, and flip `NEXT_PUBLIC_ADAPTERS=http`. The UI does not change.

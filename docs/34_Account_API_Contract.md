# Account API Contract — Phase 6

**Status:** The handover contract for the customer self-service area. [R-13, NN-06]
**Source of truth:** `src/ports/index.ts` + the `src/domain/identity`, `src/domain/subscription`, `src/domain/preferences` modules. This is the human-readable map.

The frontend calls these through the `Adapters` port; the backend implements them behind `NEXT_PUBLIC_ADAPTERS=http`. The mock is the reference behaviour; the http stub is the checklist.

---

## 1. CustomerService

| Operation | Signature | Notes |
|---|---|---|
| `profile()` | → `CustomerProfile \| null` | null when unauthenticated |
| `updateProfile({ fullName?, phone? })` | → `Result<CustomerProfile, …>` | phone re-normalised to `2547…` |

---

## 2. AddressService — the Nairobi shape, single-default invariant

| Operation | Signature |
|---|---|
| `list()` | → `SavedAddress[]` |
| `add(ValidAddress)` | → `Result<SavedAddress, …>` |
| `update(id, ValidAddress)` | → `Result<SavedAddress, …>` |
| `remove(id)` | → `Result<true, …>` |
| `setDefault(id)` | → `Result<true, …>` |

⚠ **The address book has AT MOST ONE default, and if non-empty, EXACTLY one.** The domain functions (`withAddedAddress`, `withDefaultAddress`, `withRemovedAddress`) preserve this; the backend MUST too. Removing the default promotes another. The first address added is default automatically.

⚠ **Fields are estate / building / landmark**, not line1/line2/postcode. Landmark is **required** — it is what the rider navigates by. ⛔ Zone (D-21/22/23) is present but not required until zones exist.

---

## 3. SubscriptionService — management only, NO billing

| Operation | Signature |
|---|---|
| `policy()` | → `SubscriptionPolicy` (⛔ empty frequencies until D-07) |
| `list()` / `byId(id)` | → subscriptions |
| `pause` / `resume` / `skipNext` / `cancel` / `reactivate` | → `Result<Subscription, …>` |
| `changeFrequency` / `changeFlavours` / `changeAddress` / `changePaymentMethod` | → `Result<Subscription, …>` |
| `resolveFailedPayment(id)` | → `Result<Subscription, …>` |

⚠ **None of these moves money.** ⛔ D-09 (billing model) is unanswered — M-PESA has no card-on-file, so recurring billing is either a standing order or a per-cycle re-prompt, and that is a business decision. Every method mutates STATE only:

- `reactivate` creates a **NEW** subscription; it does not resurrect a terminal one (history stays honest).
- `resolveFailedPayment` performs the confirmed state transition on recovery; it **triggers no charge**, because no charging model is defined.
- `cancel` respects `minCyclesBeforeCancel` if the policy sets one.
- Terminal states (`cancelled`, `expired`) have no transitions out.

Money fields on `Subscription` (`nextDeliveryAt`, `estimatedTotal`) are `Pending<T>` and render as `Unavailable` until D-09. [NN-05]

---

## 4. PreferencesService — channels, cookies, and an append-only consent log

| Operation | Signature |
|---|---|
| `channels()` / `updateChannels(prefs)` | → `ChannelPreferences` |
| `cookies()` / `updateCookies(prefs)` | → `CookiePreferences` |
| `recordConsent(topic, granted, source)` | → `Result<ConsentEvent, …>` — **appends** |
| `consentHistory()` | → `ConsentEvent[]` |
| `requestData(kind)` | → `Result<DataRequest, …>` — a request, not an action |
| `dataRequests()` | → `DataRequest[]` |

⚠ **Consent is a legal record, not a boolean.** `recordConsent` APPENDS a `ConsentEvent`; current state is DERIVED from the latest event per topic. The backend MUST store events append-only (never update/delete) — this is what makes consent provable under the Data Protection Act. ⛔ D-43 supplies the policy versions the events reference.

⚠ **Transactional messages cannot be switched off.** `email.transactional` is the literal `true`. Marketing toggles never gate transactional sends.

⚠ **Deletion is a REQUEST with a status**, not an instant purge. Some records (tax, completed orders) are retained by law; a `deletion` request may resolve `rejected` with a reason. Pretending deletion is instant and total would invent a legal posture we have not been given. [NN-05, D-43]

---

## 5. Consent audit — what the backend must be able to prove

For any customer and topic, the system must answer: *did they consent, when, from where, and to which policy version?* The `ConsentEvent` carries `{ customerId, topic, granted, at, source, policyVersion }`. Storing only "current marketing = true" cannot answer this and is non-compliant. The audit log is the record you show a regulator.

---

## 6. Checklist for the backend developer

Make these real in `src/adapters/http/*` and the account area works unchanged:

- [ ] `auth.*` (see `33_Authentication_Contract.md`) ⛔ D-53/54/55
- [ ] `customer.profile / updateProfile`
- [ ] `addresses.*` — enforce single-default in the DB layer too
- [ ] `subscriptions.*` — state machine; ⛔ billing deferred to D-09
- [ ] `preferences.*` — **append-only** consent table ⛔ D-43
- [ ] data-request queue with a human/process behind it

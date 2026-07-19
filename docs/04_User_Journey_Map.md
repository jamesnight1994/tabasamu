# User Journey Map

11 user groups. Tasks, frustrations, success criteria, and the site surfaces each requires.

---

## A. Customer-facing groups

---

### A1 · First-time shopper
> *Retained from the Strategy personas ("Health-conscious Hannah", "Caffeine-free Chris"), but re-registered against the Brand Book's positioning — the wants are still valid, the tone assumptions are not. This person is not anxious about wellness. They are competent, discerning, and short on time.*

**Context:** On a phone. Arriving from Instagram or a link from a friend. Possibly on a poor connection. Has never heard of rooibos kombucha. Sceptical of both the price and the category.

| Stage | Task | Frustration to eliminate | Success criterion | Surface |
|---|---|---|---|---|
| **Arrive** | Understand in 5 seconds what this is | A hero that is beautiful but says nothing | The category and the claim are legible above the fold, without scrolling, at 360px | Home hero |
| **Assess** | Decide whether it's worth the money | Price appears without any justification for it | Provenance and process are reachable in one tap and are *specific* — named farms, named days (P-05, P-15) | Home → Ingredients & Fermentation |
| **Choose** | Pick a flavour | **Every bottle looks identical.** The label system is deliberately uniform (P-06) | The strip swatch + ingredient cue + forward note make the choice possible at thumbnail size | Shop grid |
| **Cost** | Know the *delivered* total | **⚠ The #1 KE-market frustration: delivery fee revealed only at checkout (AP-10)** | Zone selector on the PDP. Fee and lead time shown **before** the cart (P-03) | PDP delivery module |
| **Trust** | Believe the order will arrive | Vagueness. No address. No returns policy. No phone number | Explicit delivery zones, lead times, returns policy, and a real contact | Footer, Delivery & Returns, Contact |
| **Buy** | Pay with M-PESA | Not knowing whether the STK push worked. Losing signal mid-payment | The site **explains the STK push before it fires**. The pending state is honest, has a real countdown, and **survives a reload** | Checkout → M-PESA pending |
| **Confirm** | Know it worked | An email they won't check | **SMS confirmation** (⛔ D-41). Order success page with the M-PESA reference in JetBrains Mono | Order success |

**Success:** reaches confirmation in ≤5 minutes on a phone, knowing the full delivered cost before entering the cart.

---

### A2 · Returning customer

**Context:** Knows what they want. Wants to be gone in three taps.

| Task | Frustration | Success | Surface |
|---|---|---|---|
| Reorder the last order | Re-entering the address. Re-choosing the flavour | **"Reorder" on the order history — one tap to a pre-filled cart** | Account → Orders |
| Try a new flavour | Not knowing what's new | The Shop grid marks new flavours factually. No "NEW!" badge (P-07) — a quiet label | Shop |
| Check where their order is | Having to email to ask | Order status is visible in the account, and in the SMS | Account → Orders |

**Success:** reorder in ≤3 taps.

---

### A3 · Subscriber
> *The highest-LTV group. Also the group most likely to churn silently if the management surface is bad.*

| Task | Frustration | Success | Surface |
|---|---|---|---|
| Start a subscription | Being pressured into it. Subscribe-first pricing that makes one-time feel punished (AP, E-04) | Sub and one-time are presented **neutrally**, same visual weight | PDP buy box |
| Skip one delivery (travelling) | **Having to email or WhatsApp to skip.** This is the classic small-brand failure and it causes cancellations | **Self-serve skip. No contact required. One tap.** | Account → Subscriptions |
| Pause / resume | Cancelling because pausing isn't offered | Self-serve pause with a resume date | Account → Subscriptions |
| Swap the flavour | Being locked to the flavour they chose in month one | Self-serve flavour swap for the next delivery | Account → Subscriptions |
| Change frequency / date / address / card | Any of these requiring support | All self-serve | Account → Subscriptions |
| **Cancel** | A dark pattern. A retention interstitial. A "are you sure?" gauntlet | **Cancel is one tap, findable, and not obstructed.** This is a brand-voice requirement, not just a UX one — *"we invite, we never instruct"* | Account → Subscriptions |

**Success:** every lifecycle action is self-serve. Support is never required for a subscription change.
⛔ Blocked on: D-07 (frequencies), D-08 (discount), D-09 (billing model).

---

### A4 · Gift purchaser

| Task | Frustration | Success | Surface |
|---|---|---|---|
| Send to someone else | Being forced to use the recipient's address as their billing address | Separate billing and delivery addresses | Checkout |
| Add a note | No gift note field | Gift note, in the brand's register — a plain text field, no emoji picker (Brand Book bans emoji on packaging) | Checkout |
| **Hide the price** | **The invoice arriving in the box with the recipient** | Gift orders ship with a delivery note containing **no pricing** | Fulfilment / packing slip |
| Choose a gift set | Having to assemble it manually | A curated gift bundle, or Build-a-Box framed as a gift | Shop → Bundles |

⛔ Blocked on: D-44 (is gifting offered at launch? Is there gift packaging?).

---

### A5 · Wholesale / corporate buyer
> *A café owner or an office manager. They do not want a shopping cart.*

| Task | Frustration | Success | Surface |
|---|---|---|---|
| Get a price list | **Being funnelled into a consumer checkout** with consumer pricing | A dedicated Wholesale page and an enquiry form. **No cart.** | Wholesale |
| Understand MOQ and terms | Vagueness | Stated plainly, or — if not yet decided — an honest "contact us" rather than an invented number | Wholesale |
| Order a tasting pack for an office | No corporate path at all | Corporate Orders page + enquiry | Corporate Orders |

⛔ Blocked on: D-11, D-12, D-20.

---

## B. Internal groups (Admin Portal)

---

### B1 · Store administrator

| Task | Requirement |
|---|---|
| Add/edit a product and its variants | Full CRUD. No developer needed. |
| Adjust stock | **One field.** Stock adjustment must not require navigating three screens. |
| Set prices | Per variant. With an audit trail. |
| Create a coupon | Type, value, expiry, usage limit, stacking rule (⛔ D-18). |
| Manage delivery zones and fees | CRUD on zones (⛔ D-21, D-22, D-23). |
| Publish content | Delegated to the content editor role — admin can do it, but it is not their job. |

**Frustration to eliminate:** a catalogue that can only be changed by a developer. That is the failure mode of a hand-built store, and it is why this build has a real admin portal in scope.

---

### B2 · Operations staff (fulfilment)

| Task | Requirement |
|---|---|
| See today's orders | **A daily fulfilment view, grouped by delivery zone.** This is how deliveries are actually routed in Nairobi. |
| Print a run sheet | Per zone. With the customer's phone number (the rider will call). |
| Update status in batch | Mark a whole zone `out_for_delivery` in one action. |
| Handle a failed delivery | A status for it, with a reason. |

**Frustration to eliminate:** an order list sorted by time instead of by geography. Useless for routing.

---

### B3 · Customer care staff

| Task | Requirement |
|---|---|
| Find an order | **Lookup by phone number AND by M-PESA reference.** In Kenya, the customer will quote the M-PESA code, not an order number. This is the primary support key. |
| Understand a payment failure | **Read-only access to the payment webhook history** for that order. Raw callback payload viewable. |
| Re-trigger a failed STK push | One action. Idempotent. Logged. |
| Issue a refund | ⚠ **M-PESA refunds are a manual B2C reversal.** The admin UI must **not** present this as a one-click operation. It must present it as a task, with a state, and record who did it. |
| See the customer's history | Orders, subscriptions, addresses. **Not** their password or payment credentials. |

**Frustration to eliminate:** being unable to answer "did my money go through?" — the single most common support question on an M-PESA store.

---

### B4 · Content editor

| Task | Requirement |
|---|---|
| Write a Journal entry | Draft → preview → publish. |
| Edit Our Story / Ingredients | Rich text, with the brand's type styles enforced (they cannot choose a font). |
| Manage stockists | CRUD on the stockist list. |
| **Cannot** | Access orders, customers, payments, or pricing. **Role isolation is a requirement, not a nicety.** |

**Frustration to eliminate:** copy changes requiring a deploy.
**Brand risk:** the editor is the person most likely to write banned vocabulary. The **copy lint runs on published content, not just on source code** (NFR-03). A draft containing "wellness journey" cannot be published.

---

### B5 · Finance / reporting user

| Task | Requirement |
|---|---|
| Reconcile M-PESA | Every order carries its M-PESA transaction reference, exportable. |
| Reconcile Stripe | Same, with the Stripe charge ID. |
| Report revenue | Date range → CSV. Gross, discounts, delivery, tax, net. |
| Report subscriptions | Active, paused, churned, MRR. |
| VAT | ⛔ **D-16 / D-39.** Cannot be built until VAT status is confirmed. |

---

### B6 · Backend developer *(the eventual recipient)*

| Task | Requirement |
|---|---|
| Understand the data model | `10_Data_Entity_Map.md` |
| Understand the contracts | The `ports/` directory is the contract. Typed, documented, versioned. |
| Replace the mocks | Swap `MockXRepository` → `HttpXRepository`. **Zero changes above the adapter layer.** This will be verified by a test that runs the full flow suite against both adapters. |
| Implement webhooks | `12_Backend_Handover_Requirements.md` specifies every webhook, its payload, its idempotency key, and its security requirement. |
| Not be surprised | Every unresolved rule is in the Client Decisions Register, not buried in a component. |

**Frustration to eliminate:** discovering that pricing logic, delivery-fee rules, or M-PESA phone normalisation were hard-coded inside a React component. **NN-06 exists to prevent exactly this.**

---

## C. The three journeys that must be prototyped first

Ranked by risk, not by frequency.

| # | Journey | Why it is the riskiest |
|---|---|---|
| **1** | **First-time shopper → M-PESA → pending → confirmation, on a 360px Android, on a flaky connection** | It is the primary revenue path and it contains the single hardest technical problem in the build (payment resilience across a connection drop). If this fails, nothing else matters. |
| **2** | **Build-a-Box at 360px, keyboard-operable** | The reference implementations of this pattern (E-07) *all* break on small screens and *all* fail keyboard testing. It is the component most likely to be built badly. |
| **3** | **Product discovery when every label is identical** | This is a constraint the brand system *creates* (P-06). It cannot be solved by copying anyone — no reference brand has a deliberately uniform label system. It requires an original solution. |

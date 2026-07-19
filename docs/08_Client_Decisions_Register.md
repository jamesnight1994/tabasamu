# Client Decisions Register

**52 open decisions.** Every unresolved commercial, legal, or brand rule encountered in Phase 1.

**Nothing here has been guessed.** Where a rule was absent from the supplied documents, it was logged rather than invented (NN-05).

**Priority:**
🔴 **BLOCKER** — Phase 2 cannot begin, or a page cannot be honestly written
🟠 **HIGH** — blocks a P0 feature
🟡 **MEDIUM** — blocks a P1 feature
⚪ **LOW** — post-launch

| ID | Pri | Area | Question | Why it matters | Blocks | Owner | Answer |
|---|---|---|---|---|---|---|---|
| **D-01** | 🔴 | Catalogue | **How many flavours are we selling?** The Brand Book says three ("Three flavours, one system": Grape Ginger, Pineapple, Pineapple Ginger). Photography exists for five. A sixth (Gooseberry) has been referenced with no asset at all. | **The catalogue cannot be modelled.** Every downstream decision — grid, filters, build-a-box size, strip colours — depends on this. | F-16, F-33, the entire data model | Client | |
| **D-02** | 🔴 | Catalogue | **What sizes are sold?** The Brand Book packaging spec says **500ml PET**. **Every photograph shows 1 Litre.** Both? Only one? | Variant model. Pricing. Label spec (186×126mm is a 500ml wraparound). | F-27, pricing, packaging | Client | |
| **D-03** | 🔴 | Brand | **What are the flavour strip colours for Passion, Beetroot and Gooseberry?** The photographs show **blue** (Passion) and **deep red** (Beetroot). Neither is in the five-colour Brand Book palette. | Using an off-palette colour is a Brand Book violation. **Requires brand sign-off, not a designer's guess.** | Product cards, PDP, packaging | Client / brand | |
| **D-04** | 🔴 | Brand / a11y | **Primary button: enforce a type-size floor, or change the ground colour?** Terracotta `#C05A2C` with a cream label is **4.0:1 — it fails WCAG AA for normal text.** Options: (a) primary buttons set at ≥19px semibold, (b) charcoal ground with cream label (13:1). | **The primary CTA currently fails accessibility.** This is not negotiable and must be decided by the brand owner, not worked around silently. | F-07, every CTA on the site | Client / brand | |
| **D-05** | 🔴 | Legal / food | **Ingredients list and nutritional information, per flavour.** | **Regulated food information. It will not be invented under any circumstances (NN-05).** A PDP cannot ship without it. | F-25, PDP, FAQs | Client | |
| **D-13** | 🔴 | Legal / food | **Is the product "Caffeine Free Rooibos Kombucha" or "Gluten Free Rooibos Kombucha"?** Four photographs say the first. `Pineapple_flavor.png` says the second. | **These are different regulated claims on a food label.** This is a labelling matter, not a typo. | Every PDP, every product card, the label artwork itself | Client | |
| **D-14** | 🔴 | Pricing | **Approved retail price per flavour, per size.** The Strategy doc suggests KES 300–400 (500ml) / KES 500–650 (1L), but explicitly frames these as *research targets*, not decisions. | **No price will be displayed or hard-coded without approval.** | Everything commercial | Client | |
| **D-50** | 🔴 | Brand / claim | **Rooibos or hibiscus?** The Brand Book's origin story says the brand ferments *"Kenyan-grown hibiscus, ginger, and turmeric"* and cites *"Hibiscus from Kerio Valley"*. But the product **is rooibos kombucha** — the labels, the packaging spec, and the descriptor all say so. **Rooibos is South African, not Kenyan-grown.** The mission claims *"rooted in Kenyan soil"*; the base ingredient is not. | **The binding document contradicts the product it governs, and it undermines the brand's central claim.** Our Story and Ingredients cannot be written honestly until this is answered. | F-64, F-65, Home, the mission itself | Client / brand | |
| **D-35** | 🔴 | Payments | **Can Stripe settle KES for the trading entity?** Stripe does not offer standard KES settlement for Kenyan-registered entities. | **This is a commercial blocker, not a technical detail.** If Stripe cannot settle, an alternative card rail (Flutterwave / Pesapal / DPO) is required — and that changes the integration spec. **Better found now than in Phase 6.** | F-62, the entire card rail | Client / finance | |
| **D-06** | 🟠 | Commerce | **Build-a-Box size — 4, 6, or 12 bottles?** Fixed or a range? | The core constraint of the picker component. | F-33…F-37 | Client | |
| **D-07** | 🟠 | Subscriptions | **What frequencies are offered?** Weekly / fortnightly / monthly? | Subscription model. | F-38 | Client | |
| **D-08** | 🟠 | Subscriptions | **Subscriber discount — what percentage?** Strategy suggests 10–15%; not decided. | Pricing display; the sub/one-time toggle. | F-28, F-44 | Client | |
| **D-09** | 🟠 | Subscriptions | **Billing model — charged per delivery, or per cycle up front?** | ⚠ **This materially changes the M-PESA integration.** M-PESA has no card-on-file equivalent; a recurring charge requires either a standing order or a re-prompt each cycle. **This is the single most consequential unanswered question in the payments architecture.** | F-38, the whole subscription payment flow | Client | |
| **D-10** | 🟠 | Content | **Current stockist list, grouped by area.** | | F-67 | Client | |
| **D-11** | 🟠 | Wholesale | **Wholesale pricing, MOQ, payment terms, lead time.** | | F-—, Wholesale page | Client | |
| **D-12** | 🟠 | Corporate | **What is the corporate offering?** Tasting packs? Office subscription? Minimum? | | Corporate page | Client | |
| **D-16** | 🟠 | Tax | **Is the entity VAT-registered? Is the displayed price VAT-inclusive?** | Order totals, invoices, reporting. **No tax logic will be written until answered.** | F-97, checkout, invoices | Client / finance | |
| **D-21** | 🟠 | Delivery | **What are the Nairobi delivery zones?** | **P-03 — the fee must be knowable before the cart. This is the biggest KE first-time-buyer frustration.** Also drives the fulfilment view (F-86), which groups by zone. | F-29, F-47, F-86, F-93 | Client / ops | |
| **D-22** | 🟠 | Delivery | **Delivery fee per zone.** | As above. | F-29, F-47 | Client / ops | |
| **D-23** | 🟠 | Delivery | **Lead time per zone.** (Same-day? Next-day? Fixed delivery days?) | As above. | F-29, F-52 | Client / ops | |
| **D-24** | 🟠 | Delivery | **Do we deliver outside Nairobi?** Courier? Which? Or not offered? | | Delivery & Returns | Client | |
| **D-27** | 🟠 | Inventory | **Low-stock threshold.** At what count does the site say "two bottles remaining"? | | F-18 | Client | |
| **D-31** | 🟠 | Payments | **M-PESA: Paybill or Till? What is the shortcode?** | | F-56 | Client | |
| **D-32** | 🟠 | Payments | **Daraja production credentials** (consumer key, secret, passkey). **Never in frontend code (NN-03) — env placeholders only.** | | F-56, F-59 | Client / dev | |
| **D-40** | 🟠 | Notifications | **Transactional email provider?** | | F-80 | Client | |
| **D-41** | 🟠 | Notifications | **Is SMS confirmation in scope?** Which provider (Africa's Talking, Twilio)? | ⚠ **In Kenya, SMS is the expected order-confirmation channel — more than email. Strongly recommended.** | F-81 | Client | |
| **D-42** | 🟠 | Channels | **What is WhatsApp's role?** (a) Support link only, (b) an **ordering channel** that bypasses the cart, or (c) the notification channel? | ⚠ **If (b), there are two order-intake paths and inventory will drift.** This must be decided **before the data model is fixed.** Recommendation: (a) + (c). | F-82, the data model | Client | |
| **D-43** | 🟠 | Legal | **Is the entity registered with the ODPC (Kenya Data Protection Act 2019)?** | Privacy policy; cookie consent. | F-71, F-73 | Client / legal | |
| **D-49** | 🟠 | Content | **Named farms and regions for each ingredient.** The Brand Book's own voice template is *"Ginger from Meru. Six days in the jar."* — but the actual supply chain is undocumented. | **Specificity is the brand's stated trust mechanism.** Provenance is required on every PDP (P-05). **Will not be invented.** | F-24, F-65 | Client | |
| **D-51** | 🟠 | Content | **Forward notes for Passion, Beetroot, Gooseberry.** (Three exist: *"Black grape, fresh ginger"* etc.) | In-voice, sensory, specific. **Must be written and approved — not guessed.** | Product cards, PDP | Client / studio | |
| **D-52** | 🟠 | Content / claim | **Fermentation period — six days or fourteen?** Brand Book voice example says *"six days in the jar"*. The Strategy document says *"14 days"*. | **A specific number that is wrong is worse than no number** — and specificity is the brand's trust mechanism. | F-65, Ingredients | Client | |
| **D-53** | 🟠 | Auth / architecture | **Authentication mechanism and provider.** Bespoke backend + session cookie? A managed provider (Firebase Auth, Supabase, Auth0)? Passwordless (magic link / OTP)? | **Raised in Phase 6.** The frontend is built provider-neutral behind an `AuthService` port, so this is a swap, not a rewrite — but the choice determines the session and verification mechanics. | F-75, the whole account area | Client / eng | |
| **D-54** | 🟠 | Auth / delivery | **Email verification and password-reset delivery.** Which transactional provider sends the links? (Ties to D-40.) What are the token lifetimes? | Verification and reset flows are built and enumeration-safe, but no email actually sends until a provider is connected. [NN-04] | F-75 | Client / eng | |
| **D-55** | 🟠 | Auth / security | **Session lifetime and refresh model.** Cookie TTL, sliding vs fixed expiry, refresh-token rotation. | The frontend holds only a session DESCRIPTOR (never a token); the mechanics are the backend's. Default assumed: 30-min httpOnly cookie, server-authoritative. | F-75 | Client / eng | |
| **D-56** | 🟡 | Auth | **Social login — in scope at launch?** (Google/Apple.) Only if separately approved. | Not built. The brief says social login only if separately approved; it has not been. | F-75 | Client | |
| **D-15** | 🟡 | Display | **Currency format:** `KES 500` / `Ksh 500` / `KSh 500.00`? | | All pricing | Client | |
| **D-17** | 🟡 | Commerce | **Is a bundle discounted versus buying singles?** | | F-36 | Client | |
| **D-18** | 🟡 | Promotions | **Can a coupon stack with the subscriber discount?** | | F-46, F-92 | Client | |
| **D-19** | 🟡 | Promotions | **Is there a first-order discount?** Strategy suggests one; no decision made. | ⚠ **Note the brand constraint: a promotion may never be presented with urgency (P-07). It is a coupon field and a cart line item. No banner, no timer, no badge.** | F-46 | Client | |
| **D-20** | 🟡 | Customers | **Does wholesale get a login with group pricing, or is it entirely offline?** | **This materially changes the architecture** (a whole customer-group pricing layer, or none). | Data model, F-— | Client | |
| **D-25** | 🟡 | Delivery | **Free-delivery threshold?** | | F-47 | Client | |
| **D-26** | 🟡 | Delivery | **Is collection / pickup offered?** From where? What hours? | | Delivery & Returns | Client | |
| **D-28** | 🟡 | Inventory | **Are preorders / backorders offered?** | ⚠ Small-batch fermentation makes stock-outs **normal**. *"Next batch bottles on {date}"* is far more on-brand than an out-of-stock dead end. | F-98 | Client | |
| **D-29** | 🟡 | Inventory | **Is there a batch calendar?** When does the next batch bottle? | As above. | F-98 | Client / ops | |
| **D-30** | 🟡 | Marketing | **Is an abandoned-cart email sent?** | ⚠ **An abandoned-cart email is, by nature, a nudge.** It can be written in-voice (*"Your box is still here."*) or it can violate the voice entirely. **Requires copy sign-off.** | F-83 | Client | |
| **D-33** | 🟡 | Payments | **Is the M-PESA transaction reference surfaced to the customer and to customer care?** | ⚠ **Strongly recommend yes.** In Kenya, the customer will quote the M-PESA code, not an order number. **It is the primary support key.** | F-61, F-88 | Client | |
| **D-34** | 🟡 | Payments | **Stripe account + keys** (publishable, secret). Env placeholders only. | See also D-35 — **Stripe may not be viable at all.** | F-62 | Client | |
| **D-36** | 🟡 | Refunds | **What is the refund policy?** | | F-91, Delivery & Returns | Client | |
| **D-37** | 🟡 | Refunds | **M-PESA refunds are a manual B2C reversal. Is that acceptable? What is the SLA?** | ⚠ **The admin UI must not present an M-PESA refund as a one-click operation. It is a task with a state.** | F-91 | Client / ops | |
| **D-38** | 🟡 | Orders | **Auto-cancel window for a `pending_payment` order?** | **Orders will not be auto-cancelled without an explicit rule.** | F-63 | Client | |
| **D-39** | 🟡 | Tax | **Is a tax invoice required on each order?** | | F-97 | Client / finance | |
| **D-44** | 🟡 | Gifting | **Is gifting offered at launch?** Gift packaging? **Is the packing slip price-free?** | ⚠ The classic gifting failure is the invoice arriving in the box. | F-50 | Client | |
| **D-45** | 🟡 | IA | **Collection taxonomy** — singles / bundles / gifts? Something else? | | F-19 | Client | |
| **D-46** | 🟡 | Content | **FAQ content.** | ⚠ **FAQs are where invented claims most often enter a site** — shelf life, pregnancy safety, digestion. **Every answer touching safety or health must come from the client, in writing.** | F-68 | Client | |
| **D-47** | 🟡 | Content | **Contact details** — trading address, phone, email. | | Contact page, footer | Client | |
| **D-48** | ⚪ | IA | **Is site search needed?** | **Recommend omitting at launch** — the range is too small to warrant it. | F-20 | Client | |

---

## Decision dependencies

Answering these six unlocks the most:

```
D-01 (flavour count) ──┬── the entire catalogue model
                       ├── D-03 (strip colours)
                       ├── D-51 (forward notes)
                       ├── D-06 (build-a-box size)
                       └── the photography brief (how many flavours to shoot)

D-02 (sizes) ──────────┬── the variant model
                       ├── D-14 (pricing — priced per size)
                       └── the label spec

D-21/22/23 (zones) ────┬── F-29 PDP delivery module (P-03)
                       ├── F-47 cart
                       ├── F-86 fulfilment view (grouped BY ZONE)
                       └── the Delivery & Returns page

D-09 (sub billing) ────┬── ⚠ the whole M-PESA subscription architecture
                       │   (M-PESA has no card-on-file; recurring requires
                       │    a standing order or a re-prompt each cycle)
                       └── D-08 (discount)

D-50 (rooibos/hibiscus) ┬── Our Story
                        ├── Ingredients & Fermentation
                        ├── the mission claim itself
                        └── the provenance block on every PDP

D-13 (caffeine/gluten) ─┬── every PDP
                        ├── every product card
                        └── the physical label artwork
```

---

## Summary

| Priority | Count |
|---|---|
| 🔴 **BLOCKER** | **9** |
| 🟠 HIGH | 21 |
| 🟡 MEDIUM | 21 |
| ⚪ LOW | 1 |
| **Total** | **52** |

**The nine blockers must be answered before Phase 2 begins.** Three of them (D-13, D-50, D-52) are contradictions **inside the binding brand document itself** — they cannot be resolved by the studio and must go back to the brand owner.

# 69 · Handover Checklist

The end-to-end checklist that takes this repository from "feature-complete
frontend" to "live site". Grouped by owner. Nothing is ticked that has not
actually been done.

---

## A. Delivered in this handover (frontend + docs) — ✅ done

- [x] Feature-complete frontend on hexagonal architecture, boundary-lint enforced
- [x] 449 tests green from clean install; 51-route production build clean
- [x] All 7 gates pass (typecheck, lint, brand, contrast, secrets, test, build)
- [x] Security headers + CSP + prod-only HSTS; `X-Powered-By` off; no secret in bundle
- [x] Typed backend contract (`src/ports`) + reference mock adapters + http skeleton
- [x] START-HERE for backend dev (doc 56)
- [x] System architecture (doc 57)
- [x] Data dictionary (doc 58) + OpenAPI 3.1 spec (doc 59 + `openapi.yaml`, 61 ops)
- [x] M-PESA guide (doc 60) + Stripe/card guide (doc 61)
- [x] Admin guide + permission matrix (doc 62)
- [x] Content & placeholder register (doc 63)
- [x] Operations & deployment runbook (doc 64)
- [x] QA (65), security (66), accessibility (67), known issues (68) reports
- [x] Client Decisions Register maintained (doc 08)
- [x] Changelog updated; Phase 10 implementation report (doc 70)
- [x] Final source ZIP + flat docs bundle packaged

## B. Backend developer — to connect the backend

- [ ] Read doc 56 (START-HERE), then `src/ports` + `src/adapters/mock` side by side
- [ ] Implement `src/adapters/http/` against the OpenAPI contract (doc 59)
- [ ] Port — do not re-derive — the domain rules (pricing, phone, delivery, money, transitions)
- [ ] Stand up read path first (products/inventory), then cart/delivery, checkout/orders, payments, auth/customer, admin
- [ ] Recompute totals + re-validate + re-check permissions server-side (fail-closed)
- [ ] Guard order-status transitions; make webhook processing idempotent
- [ ] Refuse to publish products with unresolved regulated placeholders (D-05)
- [ ] Append-only audit log written in the same transaction as each mutation
- [ ] **Run Gate G2:** set `NEXT_PUBLIC_ADAPTERS=http`; flow suite green with zero changes above the adapter layer

## C. Payments — to enable

M-PESA (doc 60):
- [ ] Client supplies D-31 (shortcode) + D-32 (Daraja credentials + passkey)
- [ ] Callback URL registered/allow-listed; origin verification enforced
- [ ] STK + callback + status tested in sandbox, then production
- [ ] Reconciliation job scheduled + monitored; refund/reversal runbook agreed (D-36/37)

Card (doc 61):
- [ ] **D-35 resolved** — provider can settle KES; `CARD_PROVIDER` set, flag on
- [ ] Webhook signature verification enforced; required events handled
- [ ] Test-mode then live-mode checklist complete

## D. Client / business — decisions to answer

- [ ] Pricing (D-14, D-16, D-17, D-08, D-18/19)
- [ ] Ingredients + nutrition per flavour (D-05)
- [ ] Provenance / named farms (D-49); forward notes (D-51); fermentation days (D-52)
- [ ] Delivery zones/fees/lead times/threshold/pickup (D-21–26)
- [ ] Notification providers + WhatsApp role (D-40/41/42); M-PESA ref to care (D-33)
- [ ] Auth mechanism + session model (D-53/54/55)
- [ ] Legal copy: privacy/DPA (D-43), terms, delivery & returns
- [ ] Ratify off-palette strip colours (D-03); confirm Journal scope
- [ ] Subscriptions billing model if pursued (D-09); build-a-box size (D-06)

## E. Content / studio — assets to supply

- [ ] Reshoot **Beetroot** (illegible label — A-05)
- [ ] Shoot **Gooseberry** (no photo exists — A-07)
- [ ] Correct physical **Pineapple** artwork claim to "Caffeine Free" (D-13)
- [ ] Any additional lifestyle photography to Brand Book §05 rules

## F. Pre-launch verification — needs a deployment + browser

- [ ] Gate G2 green against the real backend
- [ ] End-to-end M-PESA (and card, if enabled) transaction completed + reconciled
- [ ] Automated axe + manual NVDA/VoiceOver a11y passes
- [ ] Rendered responsive pass (320/360/390/430 + tablet/desktop)
- [ ] Cross-browser pass (Chrome/Safari/Firefox/Edge/mobile)
- [ ] Field Core Web Vitals on the Nairobi-served URL
- [ ] CSP `script-src` migrated to nonce; every third-party origin allow-listed
- [ ] Real `NEXT_PUBLIC_APP_URL` + `NEXT_PUBLIC_APP_ENV=production`; secrets in the store

## G. Sign-off

- [ ] Backend dev confirms Gate G2 green
- [ ] Finance confirms payment reconciliation + refund process
- [ ] Brand owner confirms all "awaiting" panels replaced with approved copy
- [ ] Legal confirms privacy/terms/delivery copy
- [ ] Launch owner confirms pre-launch verification (§F) complete

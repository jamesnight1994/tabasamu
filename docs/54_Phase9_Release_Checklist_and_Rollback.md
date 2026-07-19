# 54 · Phase 9 Release Checklist & Rollback Outline

**Date:** 2026-07-15

---

## PART A — Release Checklist

### Ready now (frontend deliverable) — ✅
- [x] All seven gates green from a clean install (typecheck, lint, brand, contrast, secrets, 449 tests, build)
- [x] 54 routes verified live (all 200; unknown → 404)
- [x] Security headers live and correct (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS)
- [x] `X-Powered-By` suppressed
- [x] No secret in the client bundle (scanned)
- [x] JSON-LD breakout-safe on every path
- [x] `noindex` on account/cart/checkout/admin/auth; robots disallows them in prod
- [x] Structured data withheld where inputs are missing; no invented facts
- [x] One H1 per shipping page
- [x] Content passes brand-voice + provenance + health-claim audits

### Blocks launch — ⛔ CLIENT / BACKEND owned (not frontend defects)
- [ ] **Backend connected (Gate G2)** — flip `NEXT_PUBLIC_ADAPTERS=http`; the full flow suite must pass against `http` with zero changes above the adapter layer
- [ ] **M-PESA credentials** (D-31/32) supplied and STK + callback tested end-to-end
- [ ] **Card rail decision** (D-35) — is Stripe viable for KES, or is it Flutterwave/Pesapal/DPO? Card stays disabled until answered
- [ ] **Notification providers** (D-40/41) — SMS is the expected KE order-confirmation channel
- [ ] **Auth mechanism** (D-53/54/55) chosen and connected; server-side session + RBAC enforcement live
- [ ] **~20 legal/pricing/delivery/nutrition decisions** (doc 47) answered → replace each "awaiting confirmation" panel with confirmed copy
- [ ] **Prices approved** (D-14) → `productJsonLd()` begins emitting automatically
- [ ] **Physical Pineapple artwork** corrected (D-13) so pack and site make the same regulated claim

### Pre-launch verification tasks — ⚠ (need a browser / deployment)
- [ ] Automated **axe** run + manual **NVDA/VoiceOver** pass on rendered pages
- [ ] Rendered responsive pass at 320/360/390/430 and tablet/desktop
- [ ] Cross-browser pass (Chrome/Safari/Firefox/Edge/mobile)
- [ ] Field Core Web Vitals (LCP/INP) on the real Nairobi-served URL
- [ ] Confirm image optimiser serves AVIF/WebP at the edge
- [ ] Migrate CSP `script-src` to a **nonce** model and drop `'unsafe-inline'` for scripts

### Deployment config
- [ ] Set real `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_APP_ENV=production` (enables prod robots, HSTS, https-upgrade)
- [ ] Populate server-only secrets in the platform's secret store (never in the repo)
- [ ] Add any third-party origin (analytics/payment SDK) to the CSP before enabling it

## PART B — Rollback Outline

The frontend is a **stateless static/SSG + SSR** deployment: rollback is a redeploy of the previous immutable build. There is no frontend-owned data migration to reverse.

### Trigger conditions
- A gate that was green regresses in the deployed build (5xx on a route, a broken checkout step, a CSP that blocks a needed origin).
- A security header misconfiguration blocks legitimate traffic (e.g. CSP too strict for a newly-added third party).

### Procedure
1. **Redeploy the previous release artifact** (the prior Phase ZIP / prior immutable build). Because the frontend holds no server state, this is a full, clean revert.
2. **Backend decoupling:** the frontend↔backend contract is the adapter boundary. If a backend change breaks the frontend, flipping `NEXT_PUBLIC_ADAPTERS=mock` returns the frontend to a known-good, self-contained state **without a code change** — useful as an emergency isolation switch during an incident.
3. **CSP incident:** if a new third-party origin is blocked, the fix is a one-line CSP directive addition + redeploy; the rollback is reverting that line. Never disable CSP wholesale as a "fix".
4. **Secrets:** rollback never requires touching secrets (they live in the platform store, not the artifact).

### What rollback does NOT cover
- Payment/order data integrity — that is **backend-owned** and needs its own transactional rollback + idempotency guarantees (doc 28). The frontend's idempotency key supports, but does not implement, that guarantee.

### Post-rollback
- Re-run the seven gates against the restored build.
- Record the incident against the relevant decision/bug ID.

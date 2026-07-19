# 66 · Phase 10 Security Report

**Date:** 2026-07-15
**Scope:** Consolidated security posture at handover. Builds on the Phase 9
security review (doc 51); this report confirms the posture is unchanged by
Phase 10 and states the backend's security obligations explicitly.

---

## 1. Frontend security posture (verified)

| Control | State |
|---|---|
| **No secrets in the client bundle** | ✅ `lint:secrets` scans 57 assets, clean. `serverEnv()` throws if a server var is read client-side. [NN-03] |
| **Security headers** | ✅ Full set in `next.config.ts`: CSP (default-deny, first-party scoped), `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. |
| **HSTS + https-upgrade** | ✅ Production-only (robust to `NODE_ENV`/`APP_ENV`); staging opts out. |
| **`X-Powered-By` suppressed** | ✅ `poweredByHeader: false`. |
| **JSON-LD breakout-safe** | ✅ Single central escape path (`<` → `\u003c`); locked by test. |
| **No token in the browser** | ✅ Auth returns a session descriptor only; session is an httpOnly cookie (D-55). An XSS-readable token would be a stealable token. |
| **Private routes noindex** | ✅ account/cart/checkout/admin/auth are `noindex`; robots disallows them in prod. |
| **Enumeration-safe auth** | ✅ Password-reset/verification always report "sent" for a valid-looking email. |
| **Deny-by-default consent** | ✅ Analytics gated on both a flag AND opt-in consent (DPA 2019 — D-43). |

## 2. Known frontend hardening still open

- **CSP `script-src` uses `'unsafe-inline'`** because the site emits inline
  JSON-LD and design-system styles and there is no nonce pipeline in a frontend
  that does not own the request lifecycle. This is honestly scoped, not
  aspirational. **The nonce migration is the standing hardening task** and must
  happen before any third-party script origin is added. (Carried from Phase 9.)
- **Any third-party origin** (analytics/payment SDK) must be added to the CSP
  **before** it is enabled, or it will be blocked.

## 3. The backend's security obligations (explicit at handover)

The frontend cannot enforce these; they are the backend developer's contract:

- **Server-authoritative everything.** Recompute totals, re-validate all input,
  re-check every permission. The UI gate is convenience; the API is the boundary
  (doc 62 §1).
- **RBAC enforced per request.** Fail-closed for inactive/unknown staff. The
  money bar (`order.refund`, `payment.*`) is enforced server-side (doc 62).
- **Webhook signature verification FIRST** — M-PESA callback origin and card
  webhook signatures verified before processing; invalid → discarded (docs 60,
  61).
- **Idempotency** on order creation, payment initiation, and webhook processing —
  M-PESA *will* deliver duplicate callbacks (doc 60 §8).
- **Order-status transitions guarded** by `canTransition`; no illegal jump from a
  replayed callback (doc 59 §3.4).
- **Audit log append-only**, written in the same transaction as the mutation
  (doc 62 §4).
- **Secrets in a secret store**, never the repo; rotate on exposure.
- **Publish gate** — the API must refuse to publish a product with unresolved
  regulated placeholders (D-05), independent of the UI.
- **DPA 2019 compliance** — consent is append-only; data-deletion is a governed
  request, not an instant unconditional action (D-43).

## 4. Dependency note

No known secret material or credential is committed. Third-party dependencies are
standard, patched versions; keep Next.js/React and Radix current and re-run the
gate bundle after bumps (doc 64 §13).

## 5. Statement

Nothing in this deliverable claims a payment integration, auth mechanism, or
backend security control that has actually been connected. The frontend is
hardened to the extent a frontend can be; the remaining controls are the
backend's, and they are enumerated above rather than assumed.

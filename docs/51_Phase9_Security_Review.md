# 51 · Phase 9 Security Review

**Date:** 2026-07-15
**Scope:** the frontend deliverable as it stands (mocks + documented contracts). Backend-owned controls are stated as **requirements for the backend team**, not as things this deliverable implements.

---

## 1. Secret exposure — ✅ strong

- Client/server env are **split into two modules**. `server-env.ts` carries `import 'server-only'`, making it a build error for any client component to import it. The split is structural, not a convention.
- `serverEnv()` throws if called in the browser.
- `scripts/check-secrets.mjs` scans the **built** client bundle (57 assets) and fails the build on a credential-shaped hit. Passed this phase.
- `.env.example` ships only placeholders; every one is traced to an open decision. No real credential is present anywhere in the repo.

## 2. Environment variables — ✅

- Only `NEXT_PUBLIC_*` reach the browser, validated by a Zod schema.
- Payment, session, API and notification secrets are server-only and optional (absent by design until supplied).

## 3. XSS / unsafe HTML — ✅ (hardened this phase)

- `dangerouslySetInnerHTML` appears in exactly three places, **all JSON-LD**, all now routed through `jsonLdString()` which escapes `<` → `\u003c` (S-3). No other raw-HTML injection exists (`innerHTML`, `eval`, `new Function`, `document.write`: none found).
- No user input reaches any JSON-LD builder today; the escape is defence-in-depth for the day it might.
- React's default escaping covers all other rendering.

## 4. Content-Security-Policy & response headers — ✅ (added this phase)

Added in `next.config.ts`, applied to every route, verified live:

| Header | Value | Purpose |
|---|---|---|
| Content-Security-Policy | `default-src 'self'`; scoped script/style/img/font/connect; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; (+`upgrade-insecure-requests` in prod) | Default-deny; only first-party origins allowed |
| X-Frame-Options | DENY | Clickjacking (belt-and-braces with `frame-ancestors`) |
| X-Content-Type-Options | nosniff | MIME-sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer leakage |
| Permissions-Policy | camera/mic/geolocation/FLoC denied | Unused powerful features |
| Strict-Transport-Security | prod: 2yr + includeSubDomains + preload; non-prod: max-age=0 | HTTPS pinning (never on localhost/staging) |

**⛔ Backend/infra hardening step (documented, not faked):** migrate `script-src` to a **nonce** model (Next middleware + per-request nonce) and drop `'unsafe-inline'` from scripts. Requires a request pipeline this frontend does not own. When any third-party origin is introduced (analytics vendor, payment SDK), it **must be added explicitly** to the relevant CSP directive — the default-deny will otherwise (correctly, safely) block it.

## 5. CSRF assumptions — 📋 backend requirement

No mutating requests leave the browser today (mocks are in-memory). At G2, state-changing endpoints must be protected (SameSite cookies + CSRF token, or a token-auth header pattern). Documented in the handover (doc 12).

## 6. Authentication & role enforcement — 📋 backend requirement, frontend-guarded

- Auth is provider-neutral and **not connected** (D-53/54/55). The frontend models UNVERIFIED→verified and refuses sign-in before verification.
- Admin RBAC (`src/domain/admin/rbac.ts`) defines the permission matrix (doc 38). **The frontend gate is a UX affordance only — real enforcement MUST be server-side.** This is stated wherever RBAC appears; a hidden admin button is not a security control.

## 7. Input validation — ✅ frontend layer

- Zod schemas validate forms and env. Phone numbers normalise to E.164 (`identity/phone.ts`).
- **Re-validation on the server is mandatory** at G2 — client validation is a UX convenience, never a trust boundary.

## 8. File upload restrictions — 📋 backend requirement

No file-upload surface exists in the frontend yet (admin image upload is backend-owned). When added: restrict type/size, scan, and store off the app origin. Documented.

## 9. Open redirects — ✅

No user-controlled redirect targets. `next/link` and internal route constants only; no `window.location = userInput` pattern.

## 10. Payment trust boundary — ✅ (the crown-jewel control)

- **The frontend never decides a payment outcome.** An M-PESA STK acknowledgement yields only a `providerRef`; truth arrives by server-confirmed callback. Enforced in types and proven by test (`unknown` never self-settles to `failed`).
- The card rail is **disabled** (`CARD_PROVIDER=none`) until D-35 resolves whether Stripe can even settle KES for a Kenyan entity; the mock **refuses** the card rail.

## 11. Webhook verification — 📋 backend requirement (documented)

Doc 28 specifies: verify signatures, enforce **idempotency** (the `IdempotencyKey` is generated client-side per attempt and must dedupe server-side), and handle duplicate/late callbacks. The frontend already generates and threads the idempotency key.

## 12. Idempotency — ✅ frontend, 📋 backend

- Client generates one key per checkout attempt (`newIdempotencyKey`, feature-detecting `crypto.randomUUID`), stable across retries of the same attempt.
- Backend **must** return the first payment on a repeated key (double-charge guard). Modelled in the mock ("two concurrent initiates with ONE key produce ONE payment", tested).

## 13. PII — ✅

- No PII enters analytics payloads (spec forbids name/phone/email/address/order-ref/M-PESA-ref; doc 46).
- Analytics is **deny-by-default** and double-gated (env flag AND consent).

## 14. Logging redaction — ✅

- All logging routes through `src/lib/logger`, which **redacts** sensitive keys (phone, msisdn, password, pin, token, secret, key, authorization, passkey, mpesa/checkout refs, email) at any nesting depth. Kenya DPA 2019 (D-43) applies.

## 15. Rate limiting — 📋 backend requirement

- The mock models rate-limiting after repeated auth failures (with retry-after). Real rate limits on auth, payment-initiate and enquiry endpoints are a backend requirement (documented).

---

## Summary

| Control | Frontend status |
|---|---|
| Secret isolation | ✅ structural |
| Security headers / CSP | ✅ added this phase |
| XSS surface | ✅ hardened this phase |
| Payment outcome trust | ✅ never client-decided |
| Idempotency / double-charge | ✅ key generated & threaded |
| PII / logging / consent | ✅ redacted & deny-by-default |
| CSRF / server RBAC / rate-limit / webhook verify / file upload | 📋 backend requirements, documented, not faked |

**No security control is claimed as operational that is not.** The frontend's own attack surface is hardened; every backend-owned control is written down as a G2 requirement rather than pretended.

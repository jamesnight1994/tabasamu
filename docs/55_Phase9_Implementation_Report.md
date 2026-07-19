# 55 · Phase 9 Implementation Report — QA, Security, Performance & Release Readiness

**Date:** 2026-07-15
**Result:** 449/449 tests (+6) · 54/54 routes verified live · all seven gates green · production build clean · three security findings fixed and locked with tests.
**Scope:** the release-readiness pass. This phase **added no features** (the brief asked for none unless a critical omission was found). It found and fixed three security hardening gaps, verified every exercisable flow empirically, and produced the full release document set — while claiming nothing that was not actually run.

---

## 1. One-sentence summary

Phase 9 took a feature-complete frontend and made it **release-ready** by hardening the HTTP response (security headers, CSP, powered-by suppression), closing a JSON-LD escaping inconsistency, and verifying the whole thing from a cold checkout — then wrote down, honestly, exactly what still cannot be signed off without a browser, a deployment, and a backend.

## 2. What the inspection found

Running all seven gates from a clean `npm ci` reproduced the Phase 8 baseline exactly (443 tests, 54 routes, all green). Then, probing the **served** production build surfaced what a test suite cannot:

1. **[S-1] The HTTP response had no security headers.** `next.config.ts` was a 7-line stub. No CSP, no clickjacking guard, no MIME-sniff guard, no HSTS. This is the single highest-leverage, backend-independent control a frontend has, and it was absent.
2. **[S-2] `X-Powered-By: Next.js`** was advertised — needless framework fingerprinting.
3. **[S-3] JSON-LD escaping was inconsistent.** The `<JsonLd>` component escaped the `</script>` breakout sequence, but `layout.tsx` serialised Organization/WebSite schema with a bare `JSON.stringify`. Two emission paths, one unescaped — not exploitable today (controlled copy) but a latent hole.

The inspection also **cleared several false alarms** (recorded in doc 50 Part B) so they are not rediscovered: the `/catalogue` double-H1 (a non-shipping specimen that 404s in production), the "missing" editorial images (handled by a designed awaiting panel, never a broken image), and admin's wide tables (inside `overflow-x-auto`, an internal tool).

## 3. What was changed

Four source files, one new test file — minimal and surgical, in the existing house style.

| File | Change |
|---|---|
| `next.config.ts` | From stub → full security-header set + `poweredByHeader: false`. CSP is default-deny and honestly scoped to first-party-only (the site's real surface today). HSTS/https-upgrade are production-only and robust to the `NODE_ENV`/`APP_ENV` distinction (staging opts out). |
| `src/lib/seo/structured-data.ts` | `jsonLdString()` now applies the `<` → `\u003c` breakout escape centrally. |
| `src/components/seo/StructuredData.tsx` | Dropped the now-redundant component-level escape (relies on the central one). |
| `src/app/layout.tsx` | Both JSON-LD blocks now serialise through `jsonLdString` instead of bare `JSON.stringify`. |
| `tests/unit/phase9.test.ts` | **New.** 6 assertions locking S-3 (breakout escaping, 4) and S-1/S-2 (header config shape + default-deny CSP, 2). |

## 4. The decisions that shaped the fixes

### 4.1 An honest CSP, not an aspirational one
The CSP allows `'unsafe-inline'` for scripts and styles because the site genuinely uses inline JSON-LD and inline design-system styles, and there is no nonce pipeline in a frontend that does not own the request lifecycle. Rather than ship a strict-looking CSP that would break the site (and get disabled in a panic), the policy is scoped to what the site actually does, and the **nonce migration is documented as the backend/infra hardening step** — the same "withhold, don't fake" discipline the project uses for content.

### 4.2 Production-only HSTS, robust to environment signals
HSTS and https-upgrade must never fire on localhost or staging (they would pin a dev host to https). `isProd` honours `NODE_ENV === 'production'` **unless** `APP_ENV` explicitly names development/staging — so a real production deploy gets the 2-year preload, staging stays at `max-age=0`, and the two cannot be confused. Verified by evaluating the config directly with `NODE_ENV=production`.

### 4.3 Escape once, centrally
The breakout escape moved to the one function every JSON-LD path already calls. A future developer cannot reintroduce the hole by using the "other" emission path, because there is now only one safe path. This mirrors the Phase 8 "withholding" pattern: make the safe behaviour structural, not a rule to remember.

## 5. Verification

| Gate | Result |
|---|---|
| typecheck | ✅ clean |
| lint + boundaries | ✅ 0 errors |
| lint:brand | ✅ no violations |
| lint:contrast | ✅ WCAG 2.2 AA |
| lint:secrets | ✅ 57 assets, no secret in bundle |
| test | ✅ 449/449 (+6 Phase 9) |
| build | ✅ 54/54 routes |
| **live header probe** | ✅ CSP + all five headers present; `X-Powered-By` absent |
| **live route sweep** | ✅ 54 routes → 200; unknown → 404 |
| **served-HTML checks** | ✅ 1 H1/shipping page, noindex on private, JSON-LD present & escaped, awaiting markers rendering |

## 6. What is NOT verified (stated plainly)

- **No browser-rendered accessibility (axe) or screen-reader (NVDA/VoiceOver) pass** — the Playwright browser download is egress-blocked in this sandbox (carried from Phases 5–8). Structure verified from served HTML only.
- **No rendered responsive/pixel pass** at 320/360/390 — static analysis found no overflow cause; a rendered pass is the honest completion.
- **No cross-browser pass** — code uses guarded, baseline APIs only.
- **No field Core Web Vitals** — needs a deployed URL and real devices. Bundle sizes are measured and good; runtime metrics are not claimed.
- **HSTS in-sandbox** shows `max-age=0` under `next start` because Next resets `NODE_ENV`; direct config evaluation with `NODE_ENV=production` yields the correct 2-year value. Correct in a real deployment.

None of these is marked passed anywhere.

## 7. Release outputs produced this phase

Docs 49 (QA report), 50 (bug register — resolved / not-a-bug / known issues), 51 (security review), 52 (browser/device/a11y matrices), 53 (performance report), 54 (release checklist + rollback outline), and this report (55). The changelog carries the Phase 9 entry. The release-candidate ZIP is the packaged output.

## 8. For the backend developer / launch owner

The frontend is **release-ready as a frontend**. To ship the whole site:
1. Connect the backend (flip `NEXT_PUBLIC_ADAPTERS=http`; the flow suite must pass against `http` unchanged above the adapter).
2. Resolve the payment decisions (M-PESA creds D-31/32; card rail D-35) and the ~20 legal/content decisions (doc 47) — each answered decision replaces one visible "awaiting" panel.
3. Run the pre-launch verification tasks that need a browser and a URL (doc 54 Part A).
4. Add any third-party origin to the CSP **before** enabling it, and migrate `script-src` to a nonce.

Nothing in this deliverable pretends a backend integration, a browser pass, or a business decision that has not actually happened.

# 50 · Phase 9 Bug Register

**Date:** 2026-07-15
Covers bugs found in Phase 9 QA, those resolved this phase, and the residual known issues at release-candidate.

---

## PART A — Bugs found & RESOLVED this phase

| ID | Severity | Area | Finding | Resolution | Verified |
|---|---|---|---|---|---|
| **S-1** | High | Security / HTTP | No security headers on any response — no CSP, no clickjacking guard, no MIME-sniff guard, no HSTS. `next.config.ts` was an empty stub. | Added a full, honestly-scoped header set (CSP default-deny + `frame-ancestors 'none'` + `object-src 'none'`; X-Frame-Options DENY; nosniff; Referrer-Policy; Permissions-Policy; production-only HSTS). | ✅ Live header probe + `phase9.test.ts` |
| **S-2** | Medium | Security / info-disclosure | `X-Powered-By: Next.js` advertised the framework and version surface. | `poweredByHeader: false`. | ✅ Absent on live response |
| **S-3** | Medium (defence-in-depth) | Security / XSS | JSON-LD `</script>` breakout escape was applied only in the `<JsonLd>` component; `layout.tsx` serialised Organization/WebSite schema with a bare `JSON.stringify`. Two emission paths, one unescaped. Not live-exploitable today (schema values are controlled copy) but a latent hole the day user-derived text reaches a builder. | Moved the `<` → `\u003c` escape into `jsonLdString()`, so **every** emission path is uniformly safe by construction. Removed the now-redundant component-level escape. | ✅ `phase9.test.ts` (4 assertions) + confirmed no raw `<` in served JSON-LD |

## PART B — Investigated, found NOT to be bugs (no change made)

Recording these so the reasoning is auditable and they are not "rediscovered" later.

| Observation | Why it is not a bug |
|---|---|
| `/catalogue` renders **two** `<h1>` | It is the internal component showcase and **calls `notFound()` in production** (`NEXT_PUBLIC_APP_ENV=production`). It never ships. It is absent from the sitemap and the public route registry. The second H1 is a deliberate type specimen. The sandbox renders it only because it runs in `development`. |
| `journal-1.jpg`, `origin-kitchen.jpg`, `process-ferment.jpg` missing on disk | These slots are declared `supplied: false`. `SlotImage` renders a **designed "awaiting photography" panel** — never a broken image — and it names the slot + spec for the photographer. Honest gap, handled by design (R-03). |
| Beetroot & Gooseberry have no product photo | Client decision (2026-07-14): Beetroot's supplied image has an **illegible label** (A-05, a generation artefact); it shows a placeholder but stays purchasable. Gooseberry has no reference image yet. The newly-uploaded `Beetroot.jpg` was inspected in Phase 9 and **still shows the same distorted wordmark** — it does not resolve A-05, so it was correctly **not** swapped in. |
| Admin tables use fixed `min-w-[560px]` / `w-[1400px]` | Wrapped in `overflow-x-auto`; admin is an internal desktop tool where a horizontally-scrollable data table is acceptable. No storefront overflow. |
| No `X-Powered-By` needed to be removed elsewhere | Only Next emits it; removed at the framework level. |

## PART C — Known issues REMAINING at release candidate

These are **not defects** — they are the honest, documented boundary of a frontend-only deliverable. Every one traces to an open client decision or to Gate G2.

| ID | Type | Statement | Blocks launch? |
|---|---|---|---|
| **NN-04** | Scope | No backend is connected. Payments, inventory, orders, notifications and auth run against mocks. The HTTP adapter throws `NotImplemented` rather than faking success. | ⛔ Yes — this is the G2 handover, by design |
| **AX-BROWSER** | Verification gap | No automated axe run and no NVDA/VoiceOver pass on rendered pages — the sandbox has no browser (Playwright download egress-blocked, carried from Phases 5–8). Structure verified from built HTML only. | ⚠ Pre-launch task, not a defect |
| **RESP-BROWSER** | Verification gap | No browser-rendered responsive/pixel pass at 320/360/390. Static analysis found no structural overflow cause, but a rendered pass is the honest completion. | ⚠ Pre-launch task |
| **BROWSER-MATRIX** | Verification gap | No live cross-browser pass (Chrome/Safari/Firefox/Edge/mobile). Code uses guarded, baseline APIs only. | ⚠ Pre-launch task |
| **D-05 / D-14 / D-21…** | Client decisions | ~20 legal/pricing/delivery/nutrition facts are unconfirmed. Each renders as a visible "awaiting confirmation" panel and is registered in doc 47. Structured data is withheld where inputs are missing. | ⛔ Content/legal launch blockers owned by the client |
| **D-13** | Artwork | The Pineapple photograph's physical label reads "GLUTEN FREE" while the site (correctly) says "CAFFEINE FREE". The **physical artwork** must be corrected at the next print run so pack and site make the same regulated claim. | ⚠ Print-run task |
| **HSTS-sandbox** | Environment | HSTS shows `max-age=0` under `next start` **in this sandbox** because Next resets `NODE_ENV` internally; direct config evaluation with `NODE_ENV=production` correctly yields the 2-year preload value. Fires correctly in a real production deployment. | No — verified correct via direct config eval |

**Nothing in Part C is a coding defect introduced by this project.** They are the truthful edges of a frontend built ahead of its backend and its final business decisions.

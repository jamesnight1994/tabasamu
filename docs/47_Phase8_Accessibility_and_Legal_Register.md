# 47 · Phase 8 Accessibility Audit, Remediation & Legal-Content Register

**Date:** 2026-07-15
**Target:** WCAG 2.2 Level AA. Extends the Phase 2 baseline (doc 16) and Phase 3 report (doc 19).

---

## PART A — Accessibility audit (brief §5)

The Phase 8 surfaces (12 new pages, the consent banner, the cookie-preferences control) were built to the established baseline. Audited item by item:

| Item | Result |
|---|---|
| Keyboard use | All controls reachable; banner buttons and preference toggles are real `<button>`s |
| Focus order | Logical; banner appended after content, does not trap or steal focus (`aria-modal="false"`) |
| Focus visibility | `:focus-visible` ring present, never removed |
| Colour contrast | New pages use audited pairs only; `check-contrast.mjs` passes |
| Form labels | Cookie controls use text buttons with `aria-pressed`; no placeholder-as-label |
| Error identification | N/A on new pages (no new forms); existing pattern unchanged |
| Dialog focus trapping | Consent banner is intentionally non-modal (must let a user read the linked policy first); it is not a trap by design |
| Mobile touch target size | 44px minimum retained; banner respects `env(safe-area-inset-bottom)` |
| Zoom & text resize | No `maximumScale`; layout reflows at 360px |
| Reduced motion | No new motion introduced |
| Screen-reader semantics | One H1 per page (verified in built HTML), landmarks, `aria-current` breadcrumbs |
| Data table semantics | N/A (no new tables) |
| Cart announcements | Unchanged from prior phases |
| Dynamic checkout status | Unchanged from prior phases |
| Image alternatives | New pages are text-first; OG image is decorative metadata |
| Heading structure | Verified: `/privacy` renders exactly one H1 and ordered H2s |

### Consent banner specifics

- `role="dialog"`, labelled by its heading, described by its body.
- **Reject is as prominent as accept** — a greyed-out reject is a dark pattern and, under the DPA, arguably invalidates consent.
- Links to the full cookie-preferences page so a decision can be informed.

## PART B — Remediation report

| Finding | Severity | Action | Status |
|---|---|---|---|
| Footer linked 12 non-existent pages (404s) | High (trust) | Built the pages; repointed 3 dead links; added a filesystem test | ✅ Fixed |
| Root metadata referenced missing `apple-touch-icon.png` / `og-default.png` | Medium | Generated both from brand marks | ✅ Fixed |
| No `robots`/`sitemap`/`manifest` | Medium (SEO) | Added all three | ✅ Fixed |
| Private routes indexable | Medium (privacy) | `<NoIndex>` + robots disallow | ✅ Fixed |
| Analytics not consent-gated | High (legal) | Consent model + gate | ✅ Fixed |
| Full axe / screen-reader pass on new pages | — | Requires a browser | ⚠ Outstanding — Playwright egress-blocked in sandbox (carried from Phases 5–7) |
| Colour-blind simulation | Low | Labels are name-paired, not colour-only | ⚠ Outstanding (R-12) |

**Not claimed as passed:** an automated axe run and a manual NVDA/VoiceOver pass against the rendered new pages. Rendering was verified via built HTML (headings, landmarks, schema, noindex, awaiting markers), but a real assistive-tech pass is a pre-launch task.

## PART C — Legal-Content Requirements Register

Every fact a trust or legal page needs from the client, with the decision that blocks it and what the page shows meanwhile. Each item renders on-page as a visible "awaiting confirmation" panel.

| # | Page | Required content | Decision | Interim state on page |
|---|---|---|---|---|
| L-01 | Contact, Footer, all | Trading address, phone, email | D-47 | "Being finalised"; no invented details |
| L-02 | Contact | WhatsApp role/number | D-42 | No number shown |
| L-03 | Delivery | Nairobi zones, fees, lead times | D-21/22/23 | "Fee shown before you pay" |
| L-04 | Delivery | Outside-Nairobi shipping | D-24 | "Not yet confirmed" |
| L-05 | Delivery | Collection option | D-26 | "Being decided" |
| L-06 | Delivery, Terms | Returns & refund terms; M-PESA reversal SLA | D-36/37 | "Being finalised" |
| L-07 | Privacy | Data controller identity, ODPC status, DSAR route | D-43/47 | "Being confirmed"; rights named generically |
| L-08 | Privacy | Retention periods | D-43 | "Being set with legal adviser" |
| L-09 | Terms | Registered company name/number/address | D-47 | "Being confirmed"; no placeholder party |
| L-10 | Terms | Price & VAT treatment | D-14/16 | "Indicative until approved" |
| L-11 | Terms | Order acceptance / cancellation window | D-38 | "Being finalised" |
| L-12 | Stockists | Stockist list by area | D-10 | "Being confirmed" |
| L-13 | Wholesale | Trade pricing, MOQ, terms, lead time | D-11 | "Being confirmed" |
| L-14 | Corporate | Corporate offering; gift-note handling | D-12/44 | "Being confirmed" |
| L-15 | FAQ, Ingredients | Ingredients & nutrition; shelf life; alcohol content | D-05 | On label/PDP once confirmed |
| L-16 | FAQ | Pregnancy / children guidance | D-46 | "Will not answer from guesswork" |
| L-17 | Ingredients | Named farms/regions | D-49 | "Named only once confirmed" |
| L-18 | Ingredients, FAQ | Fermentation period (6 vs 14 days) | D-52 | "Confirming before we print it" |
| L-19 | Privacy | "Last updated" date | — | Added when policy is confirmed |
| L-20 | Accessibility | Accessibility feedback contact | D-47 | Ties to L-01 |

**None of these is invented on any page.** Each is a visible, honest gap tied to a decision the client owns.

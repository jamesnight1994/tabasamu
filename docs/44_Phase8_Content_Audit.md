# 44 · Phase 8 Content Audit

**Date:** 2026-07-15
**Scope:** every customer-facing string on the site, audited against the Brand Book §07 voice rules and the Phase 8 brief's forbidden-content list.
**Method:** mechanical scan (`scripts/check-brand.mjs`, runs in CI, fails the build) plus assertion tests over the content modules (`tests/unit/content.test.ts`, `tests/unit/phase8.test.ts`).

---

## 1. What was scanned

`check-brand.mjs` walks every `.ts`/`.tsx`/`.css` file in `src/`. The content tests additionally collect every string in the content single-sources and assert them individually:

- `src/content/homepage.ts` (Phase 3)
- `src/content/trust.ts` (Phase 8 — contact, delivery/returns, privacy, terms, stockists, wholesale, corporate, accessibility)
- `src/content/faqs.ts` (Phase 8)
- `src/content/story.ts` (Phase 8 — our story, ingredients)

Copy is kept in these modules, not scattered through JSX, precisely so it can be linted. A meta description and a privacy heading are both copy, and copy is where an invented claim or a stray exclamation mark gets in.

## 2. The forbidden list (brief §1) — result

| Term | Result |
|---|---|
| Wellness journey | Absent |
| Treat yourself / you deserve it | Absent |
| Detox / cleanse / purify | Absent |
| Ancient wisdom / tribal traditions | Absent |
| Game-changer / next-level / unlock | Absent |
| Vibes | Absent |
| Excessive exclamation marks | Zero exclamation marks anywhere in copy |
| Unsupported health claims | Absent — see §4 |
| Fabricated reviews / testimonials | None exist; none written |
| Fabricated provenance | None — see §3 |

The only textual matches for these terms in the repository are inside the ban-list definitions themselves (in `check-brand.mjs` and in explanatory comments), which is expected.

## 3. Provenance honesty (D-50)

D-50 is answered: the base is **rooibos**, which grows in South Africa, not Kenya. The audit enforces that no copy claims Kenyan-grown rooibos. The permitted, true claims are: Kenyan **fruit**, a Nairobi **kitchen/brewing**, and Kenyan **craft**. The rooibos is always named as rooibos with no provenance claim attached. Asserted in both `content.test.ts` and `phase8.test.ts` against a list of false-provenance phrasings.

## 4. Health / medical claims

Kombucha marketing is the most common place regulated medical claims appear. The audit asserts the absence of "aids digestion", "boosts immunity", "supports gut health", "safe in pregnancy" and similar. The FAQ that would naturally invite a pregnancy answer is present as a question but its answer is **withheld** (D-46) and marked awaiting confirmation.

## 5. Awaiting-confirmation content

Where a fact is not confirmed, the copy does not guess. It renders a visible "awaiting confirmation" panel naming the blocking decision. The audit asserts that every awaiting block carries a `blockedBy` decision ID and a non-empty interim statement that says only what is true now. These are catalogued in the Legal-Content Requirements Register (doc 47).

## 6. Verdict

**Pass.** No forbidden term, no invented claim, no fabricated review or provenance, zero exclamation marks. The scan is wired into CI, so a future edit that violates a rule fails the build rather than shipping.

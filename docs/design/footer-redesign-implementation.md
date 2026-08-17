# Footer Redesign — Two-Tier Dark Footer

**Date:** 2026-08-17  
**Scope:** Replace the current single-band footer in `Footer.tsx` with a standard **two-section** footer: dark primary band + lighter legal bar.  
**Injection point:** Unchanged — `(storefront)/layout.tsx` renders `<Footer />` after `<main>{children}</main>` on every storefront route including `/`.

---

## 1. Executive summary

**Yes — this is achievable and can look aesthetically pleasing on Tabasamu.**

The requested pattern — dark upper footer, lighter lower bar, logo + slogan, two link columns, contact + socials, copyright + legal links — is a well-established e-commerce layout. Tabasamu already has most of the **data** and **tokens** needed; the work is primarily **layout**, **dark-surface styling**, and **honest placeholders** where contact/social URLs are not yet supplied (D-47, NN-05).

| Request | Tabasamu adaptation |
|---------|---------------------|
| Black / dark top section | **`--color-charcoal-deep` (`#1a1a1a`)** primary ground — reads as black without pure `#000` [NN-01] |
| Lighter bottom bar | **`--color-charcoal` (`#2d2d2d`)** or **`--color-charcoal-muted` at 12% on charcoal-deep** — visibly lighter tier, still on-brand |
| Logo + slogan (left) | Full lockup on dark (`Logo` + `tone="dark"`) + approved standfirst / location line — **not** the full Brand Book mantra in the footer if it already appears on the page [Brand Book §04] |
| Two nav columns | Re-group existing `FOOTER_COLUMNS` (4 today) into **Shop + Discover** and **Business + support** |
| Contact + icons (right) | Reuse `NAV_UTILITY.contact` + lucide icons; show **`locationFallback`** until D-47; disable / `aria-disabled` social icons when `href` is null |
| Socials below contact | Reuse `NAV_SOCIALS` from `navigation.ts` |
| Bottom: © left, legal right | Move Privacy / Terms / Delivery / Cookies / Accessibility to **legal bar** only; drop duplicate “Legal” column from main grid |
| Pure black | Avoid `#000000`; charcoal-deep satisfies “black background” while matching existing dark-ground rules |

> **Brand constraint [NN-01]:** No pure white page grounds. On **dark** footer grounds, cream inverse text (`--color-ink-inverse`) and white monogram are correct.  
> **Copy constraint [NN-05, D-47]:** Do not invent street address, phone, email, or social handles. Render structure + icons; use fallbacks and staging notes where data is null.  
> **Mantra constraint [Brand Book §04]:** Mantra appears **once per page maximum**. Keep `showMantra` prop / homepage suppression logic from `layout.tsx`.

---

## 2. Reference layout (target structure)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TOP BAND — bg-charcoal-deep (#1a1a1a)                                       │
│  ┌─────────────────┬──────────────────┬──────────────────┬─────────────────┐ │
│  │ Logo (dark tone)│  Column 1        │  Column 2        │  Contact        │ │
│  │ Slogan / tagline│  Shop links      │  Discover links  │  📍 location    │ │
│  │ (2–3 lines max) │                  │                  │  📞 phone*      │ │
│  │                 │                  │                  │  ✉ email*       │ │
│  │                 │                  │                  │  ─────────────  │ │
│  │                 │                  │                  │  social icons   │ │
│  └─────────────────┴──────────────────┴──────────────────┴─────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│  BOTTOM BAR — bg-charcoal (#2d2d2d) or subtle step lighter                   │
│  © 2026 Tabasamu Sips · Brewed in Nairobi          Privacy · Terms · …       │
└──────────────────────────────────────────────────────────────────────────────┘
  * omitted or soft-disabled until D-47 supplies real values
```

**Desktop grid (inside `--container-max`):**

| Zone | Span | Content |
|------|------|---------|
| Brand | ~4 cols | Logo, slogan, optional one-line descriptor |
| Nav A | ~2 cols | Shop column |
| Nav B | ~2 cols | Discover / story column |
| Contact | ~4 cols | Icon rows + social row |

**Mobile:** stack Brand → Nav A → Nav B → Contact → (legal bar unchanged).

---

## 3. Content mapping

### 3.1 Brand block (left)

| Element | Source | Notes |
|---------|--------|-------|
| Logo | `<Logo variant="full" tone="dark" width={170} />` | White/reversed assets on dark ground per `Logo.tsx` |
| Slogan | New `FOOTER.slogan` in content module | Short standfirst — **not** the full mantra unless `showMantra={true}` and page has no other mantra |
| Optional mantra | `BRAND_MANTRA` | Only when `showMantra` prop is true (existing behaviour) |

**Suggested slogan copy (client-review):**

> Caffeine-free rooibos kombucha, brewed slowly in Nairobi.

Defers to homepage voice; does not duplicate the mantra.

### 3.2 Navigation columns (centre)

Consolidate today's four columns into **two**:

**Column 1 — Shop**

| Label | href |
|-------|------|
| All flavours | `/shop` |
| Build a Box | `/bundles/build-your-own` |
| Catalogue | `/catalogue` |

**Column 2 — Discover**

| Label | href |
|-------|------|
| Our Story | `/our-story` |
| Ingredients | `/ingredients` |
| Stockists | `/stockists` |
| Wholesale | `/wholesale` |
| FAQs | `/faqs` |
| Contact | `/contact` |

Legal links **move to bottom bar only** (see §3.4).

### 3.3 Contact + social (right)

| Row | Icon | Data source | Until D-47 |
|-----|------|-------------|------------|
| Location | `MapPin` | `NAV_UTILITY.contact.locationFallback` | Always show: “Brewed in Nairobi, Kenya” |
| Phone | `Phone` | `NAV_UTILITY.contact.phone` | Hide row or show muted “Phone — coming soon” in staging only |
| Email | `Mail` | New `FOOTER.email` when supplied | Link to `/contact` as interim |
| Socials | Platform icons | `NAV_SOCIALS` | Render icons; `href={null}` → non-link `<span aria-disabled>` with `title="Not yet linked"` |

Social row sits **below** contact rows with `gap-3`, icon buttons `size-10` rounded-full, border `white/15`, hover `white/25`.

### 3.4 Bottom legal bar

| Left | Right |
|------|-------|
| `© {year} Tabasamu Sips` | Inline link group |

**Legal links (right, separated by middot or pipe):**

- Privacy → `/privacy`
- Terms → `/terms`
- Delivery & returns → `/delivery-and-returns`
- Cookie preferences → `/cookie-preferences`
- Accessibility → `/accessibility`

Typography: `text-caption` / `text-micro`, `--color-ink-inverse` at ~70% opacity on dark bar.

---

## 4. Visual design

### 4.1 Colour

| Region | Token | Hex | Text |
|--------|-------|-----|------|
| Top band | `--color-charcoal-deep` | `#1a1a1a` | `--color-ink-inverse` (#fdf6f0) |
| Column headings | — | — | `ink-inverse` at 55% — label-caps |
| Links | — | — | `ink-inverse` 85% → hover forest-light or full inverse |
| Bottom bar | `--color-charcoal` | `#2d2d2d` | `ink-inverse` 70% |
| Link hover | `--color-forest` or cream | — | Must meet 4.5:1 on dark [AX-01] |
| Focus ring | `--color-focus-inverse` | cream | On dark grounds per globals |

Add explicit utilities in `globals.css` (Tailwind v4 safe):

```css
.bg-footer-dark {
  background-color: var(--color-charcoal-deep);
}
.bg-footer-bar {
  background-color: var(--color-charcoal);
}
.text-footer-muted {
  color: rgb(253 246 240 / 0.7);
}
```

### 4.2 Typography

| Element | Treatment |
|---------|-----------|
| Column headings | `label-caps`, muted inverse |
| Nav links | `text-small`, medium weight |
| Slogan | `font-display`, `text-h4` or `text-body-lg`, inverse |
| Contact rows | `text-small`, icon + label flex row |
| Legal bar | `text-micro` / `text-caption` |

### 4.3 Spacing

- Top band: `py-16 md:py-20 lg:py-24`
- Container: match site rhythm — `container mx-auto max-w-[--container-max] px-6 md:px-12 lg:px-16`
- Bottom bar: `py-5 md:py-6`
- Grid gap: `gap-x-8 gap-y-12 lg:gap-x-12`

### 4.4 Dividers

- **No** border between top and bottom — contrast of `#1a1a1a` vs `#2d2d2d` is sufficient
- Optional 1px `white/8` top edge on bottom bar if separation needs reinforcement

---

## 5. Component architecture

### 5.1 Files to touch

| File | Change |
|------|--------|
| `frontend/src/content/footer.ts` | **New** — slogan, contact display config, column definitions |
| `frontend/src/components/layout/Footer.tsx` | Refactor into `FooterTop` + `FooterLegalBar` subcomponents |
| `frontend/src/app/globals.css` | Footer dark utilities |
| `frontend/src/app/(storefront)/layout.tsx` | No change to injection; keep `showMantra` logic |
| `frontend/tests/unit/content.test.ts` | Footer link integrity if columns move |

### 5.2 Props (preserve)

```tsx
export interface FooterProps {
  showMantra?: boolean; // default true; false on `/` when Origin/mantra elsewhere
}
```

### 5.3 Server vs client

Footer remains a **server component** — no `'use client'` required. Icons from `lucide-react` are fine in RSC.

### 5.4 Suggested component tree

```tsx
<footer>
  <div className="bg-footer-dark">
    <div className={SITE_CONTAINER}>
      <div className="grid ...">
        <FooterBrand showMantra={showMantra} />
        <FooterNavColumn column={FOOTER_NAV.shop} />
        <FooterNavColumn column={FOOTER_NAV.discover} />
        <FooterContact socials={NAV_SOCIALS} contact={NAV_UTILITY.contact} />
      </div>
    </div>
  </div>
  <div className="bg-footer-bar">
    <div className={SITE_CONTAINER}>
      <FooterLegalBar />
    </div>
  </div>
</footer>
```

---

## 6. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Landmarks | Single `<footer>`; each nav column `aria-label={heading}` |
| Link contrast | Cream on charcoal-deep ≥ 12:1 for body; muted links ≥ 4.5:1 |
| Focus | Visible cream focus ring (`--color-focus-inverse`) |
| Social placeholders | `aria-disabled="true"` when no href; not focusable |
| Icons | Decorative icons `aria-hidden`; visible text label adjacent |
| Legal bar | `<nav aria-label="Legal">` for right-hand links |

---

## 7. Responsive behaviour

| Breakpoint | Layout |
|------------|--------|
| `< md` | Single column stack; socials left-aligned under contact |
| `md–lg` | 2×2 grid: brand full-width row, then nav + contact |
| `≥ lg` | 4-column grid as §2 |

Legal bar: column stack on mobile (© above links); `md:flex-row justify-between` on desktop.

---

## 8. What we will **not** do

- Invent phone, email, trading address, or social URLs [D-47, NN-05]
- Use pure `#000000` or pure `#FFFFFF` page-style grounds [NN-01]
- Duplicate the Brand Book mantra when `showMantra={false}`
- Add urgency, exclamation marks, or promotional footer strips [P-07]
- Break existing trust-page routes — legal links already exist under `/privacy`, `/terms`, etc.

---

## 9. Implementation phases

### Phase 1 — Structure & tokens (MVP)

1. Add `footer.ts` content module + CSS utilities
2. Refactor `Footer.tsx` to two-tier layout
3. Wire columns from content; reuse `NAV_SOCIALS` / `NAV_UTILITY`
4. Visual QA on `/`, `/shop`, `/contact`

### Phase 2 — Polish

1. Link hover transitions (opacity / underline, ≤180ms)
2. Social icon hover states
3. Optional newsletter one-liner in brand block (only if copy approved)

### Phase 3 — Content unlock (blocked)

1. Replace contact fallbacks when D-47 supplies address / phone / email
2. Set real `href` on `NAV_SOCIALS`
3. Add company registration line when supplied

---

## 10. Acceptance criteria

- [ ] Footer renders on all storefront routes via `layout.tsx` unchanged
- [ ] Top section uses charcoal-deep; bottom bar is visibly lighter
- [ ] Logo + slogan on left; two nav columns; contact + socials on right (desktop)
- [ ] Bottom bar: copyright left, legal links right
- [ ] No invented contact data; null socials render safely
- [ ] `showMantra={false}` on homepage suppresses mantra in footer
- [ ] WCAG AA contrast on all text and focus states
- [ ] Mobile layout readable without horizontal scroll

---

## 11. Open questions for client

1. **Slogan line** — approve standfirst vs mantra in footer brand block
2. **Social platforms** — confirm which of Facebook / Twitter / Instagram / Pinterest are active
3. **Contact email** — single hello@ address when D-47 resolves
4. **Bottom bar links** — confirm full legal set or subset for v1

---

## 12. Related files (today)

| File | Role |
|------|------|
| `frontend/src/components/layout/Footer.tsx` | Current single-band footer |
| `frontend/src/app/(storefront)/layout.tsx` | Injects `<Footer showMantra={!homepageOwnsTheMantra} />` |
| `frontend/src/content/navigation.ts` | `NAV_UTILITY`, `NAV_SOCIALS` |
| `frontend/src/components/primitives/Logo.tsx` | `tone="dark"` for dark footer |
| `frontend/src/lib/seo/index.ts` | `BRAND_MANTRA` |

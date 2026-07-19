# Developer & Backend Handover — Logo System

## Which approved files are used

Production assets live in `public/brand/approved/`:

- `tabasamu-full-logo.png` — the full logo (cap mark + "Tabasamu" + "SIPS").
- `tabasamu-monogram.svg` — coloured (`#C05A2C`) monogram.
- `tabasamu-monogram-white.svg` — fully-reversed white monogram.
- Icon set: `favicon.ico`, `apple-touch-icon.png`, `icon-16/32/48/180/192/512.png`,
  `maskable-512.png`, and the social card `og-default.png`.

Verbatim approved sources are kept in `public/brand/_reference/` for provenance
and re-export. **Do not point the app at `_reference/`** — always use `approved/`.

## Where they're used

- **Header** (`src/components/layout/Header.tsx`): full logo `md`+, monogram below.
- **Footer** (`src/components/layout/Footer.tsx`): full logo.
- **Auth / Account** layouts: full logo home-link.
- **Admin** layout: coloured monogram + "Admin" label.
- **Metadata** (`src/lib/seo/index.ts`): favicon + apple-touch + monogram icon +
  Organization JSON-LD full logo; default OG card.
- **Manifest** (`src/app/manifest.ts`): monogram SVG + PNG set + maskable.

## How light/dark is handled

The `Logo` component takes `tone="light" | "dark"`:

- `light` (cream / warm-cream): `full` logo **or** coloured `monogram`.
- `dark` (forest / terracotta / charcoal): **white `monogram` only**.

There is **no approved reversed full lockup**. On a dark surface, use
`<Logo variant="monogram" tone="dark" />`. The `full` variant ignores tone (it is
light-only); putting a full logo on a dark surface is caught by the brand lint.

## Minimum sizes

Enforced in `Logo.tsx` (`LOGO_MIN_WIDTH`): `full` = 120px, `monogram` = 40px.
Any smaller `width` is clamped **up**. Do not defeat this.

## Clear-space implementation

`Logo` renders the artwork inside an optional wrapper whose `padding` is
`clearSpace × max(renderedWidth, renderedHeight)` (default `0.22`, Brand Book
~20–25%). Clear-space is **separate** from the interactive touch area and from
section margins. When a parent already guarantees separation, pass a smaller
`clearSpace` (e.g. header `0.12`, admin `0`). Never bake padding into the artwork.

## How to add a future logo placement correctly

```tsx
import { Logo } from '@/components/primitives/Logo';

// On a cream/light surface, inside a labelled home link:
<Link href="/" aria-label="Tabasamu Sips — home">
  <Logo variant="full" width={160} decorative clearSpace={0.15} />
</Link>

// Compact / collapsed / dark surface:
<Logo variant="monogram" tone="dark" width={40} />
```

Rules the brand lint (`scripts/check-brand.mjs`) enforces on every build:

- No references to obsolete assets (`lockup-primary`, `monogram-terracotta`, …).
- No unsupported `variant` (only `full`, `monogram`) and no removed `ground` prop
  (use `tone`).
- No CSS `filter`, `object-fit: cover`, rotation or skew on `/brand/approved/*`.
- No `full` logo on `tone="dark"`.
- The three core approved assets must exist on disk.

Do **not** recolour the PNG/SVG with CSS, retype the wordmark as live text, or
trace a new SVG from the PNG. If a new context needs a treatment none of the
approved assets cover, request new artwork rather than fabricating it.

## Backend / SEO note

`organizationJsonLd()` emits `/brand/approved/tabasamu-full-logo.png` as the
Organization `logo`. If the canonical logo URL is referenced anywhere server-side
(emails, invoices, partner feeds), use that same approved path. `address`,
`telephone`, `email`, and `sameAs` remain intentionally unset pending D-47 /
social handles — unchanged by this remediation.

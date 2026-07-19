# Responsive Spacing Specification

Four distinct concepts, never conflated:

1. **Logo artwork dimensions** — the intrinsic mark, scaled width-first with
   automatic height (aspect preserved).
2. **Protected clear-space** — a wrapper `padding` derived from the rendered
   logo's larger dimension (Brand Book ~20–25%). Not baked into the artwork.
3. **Interactive touch area** — the home link, always ≥44×44px, independent of
   clear-space.
4. **Section margins** — the header/footer container padding.

The `Logo` component exposes `clearSpace` (fraction, default `0.22`). Callers dial
it to the surface: where a parent already guarantees separation (flex `gap`,
borders), a smaller value avoids a bulky band without losing protection.

## Header

| Token / prop | Value |
|---|---|
| Header height | 60px (mobile) → 76px (`md`+) |
| Horizontal padding | 16px (`px-4`) mobile → 32px (`md:px-8`) |
| Desktop full-logo width | **150px** (aspect 4.93:1 → ~30px artwork height) |
| Desktop clear-space wrapper | **12%** of larger dim |
| Mobile monogram width | **40px** (Brand Book minimum) |
| Mobile clear-space wrapper | **10%** |
| Home-link touch target | ≥44px (`min-h-[--touch-min]` on controls; link is `shrink-0` with focus ring offset-4) |
| Logo ↔ nav separation | `gap-4` (≥16px) + nav starts after `justify-between` |

Full logo shows from `md`; monogram below `md`. Header is a **solid cream band**,
never transparent over a photograph.

## Footer

| Item | Value |
|---|---|
| Full-logo width | **170px** |
| Clear-space wrapper | **18%** |
| Top separation | `border-t` + `pt-8` (32px) from divider |
| Logo ↔ business info | `gap-6` (24px); `md:justify-between` horizontal on desktop |
| Mobile | column stack, `gap-6` beneath the logo |

## Auth / Account

| Surface | Width | Clear-space |
|---|---|---|
| Auth header full logo | 150px | 12% |
| Account header full logo | 140px | 10% |

Both on cream, home-linked with `aria-label="Tabasamu Sips — home"` and a focus
ring at offset-4.

## Admin

| Surface | Mark | Width | Clear-space |
|---|---|---|---|
| Sidebar / mobile bar | coloured monogram + "Admin" | 28px | 0 (parent `px-4 py-4` + `gap-2` provide separation) |

The monogram sits on the light admin surface; "Admin" is a **functional label**,
not part of the logo.

## Minimum sizes (enforced in `Logo.tsx`)

| Variant | Digital minimum |
|---|---|
| `full` | 120px wide (widths clamp **up**) |
| `monogram` | 40px wide |

## Accessibility

- Logos inside a labelled link render `alt=""` + `aria-hidden` (`decorative`),
  so the brand name is announced once, by the link.
- Where the logo itself is the accessible name, `alt="Tabasamu Sips"`.
- No duplicate screen-reader announcements anywhere.

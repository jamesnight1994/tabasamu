# Logo Asset Mapping & Before/After

## Approved sources → production assets

| Approved source (kept verbatim in `public/brand/_reference/`) | Intrinsic | Production asset (`public/brand/approved/`) | Transform applied |
|---|---|---|---|
| `Tabsamu logo.png` | 1152×320 RGBA, visible artwork 1051×194 (transparent margins L54/T68/R47/B58) | `tabasamu-full-logo.png` — 1075×218 | Trimmed to visible artwork, re-padded to a **uniform 12px** transparent margin, then **lossless** optimise (optipng −o5, 38.6KB→25.6KB). No pixels of artwork altered; aspect of visible mark preserved (5.42:1). |
| `tabasamu logo monogram.svg` | 285.75² viewBox, fill `#C05A2C`, ~18% internal safe-zone | `tabasamu-monogram.svg` — 1.26KB | Scoured (Inkscape metadata/ids/comments stripped). **Colour + viewBox + paths unchanged.** |
| `tabasamu logo monogram - white.svg` | 285.75² viewBox, fill `#FFFFFF` (fully reversed) | `tabasamu-monogram-white.svg` — 1.26KB | Scoured. Colour/paths unchanged. |
| `tabasamu logo monogram.jpg` | 1039² RGB, opaque | *(reference only)* | Not used in production. SVG preferred; JPG has no transparency. |

## Derived assets (from the approved monogram / full logo)

| Asset | Source | Purpose |
|---|---|---|
| `favicon.ico` (16/32/48) | monogram SVG on cream | browser tab icon, recognisable at 16px |
| `apple-touch-icon.png` (180) | monogram SVG on cream | iOS home screen |
| `icon-16/32/48/180/192/512.png` | monogram SVG on cream | metadata / manifest PNGs |
| `maskable-512.png` | monogram SVG on cream (built-in safe zone) | Android maskable icon |
| `og-default.png` (1200×630) | approved **full logo** + Fraunces mantra | social card — design preserved, mark replaced |

The monogram SVG already carries ~18% internal padding, which doubles as the
maskable safe-zone, so masked platforms will not clip the mark.

## Before → after (what each surface renders)

| Surface | Before (reconstructed / typed) | After (approved) |
|---|---|---|
| Header desktop | re-cut Fraunces lockup SVG | `tabasamu-full-logo.png` |
| Header mobile | reconstructed monogram SVG | `tabasamu-monogram.svg` |
| Footer | re-cut Fraunces lockup SVG | `tabasamu-full-logo.png` |
| Auth header | live text "Tabasamu Sips" | `tabasamu-full-logo.png` |
| Account header | live text "Tabasamu Sips" | `tabasamu-full-logo.png` |
| Admin sidebar | live text "Tabasamu Admin" | `tabasamu-monogram.svg` + "Admin" label |
| Catalogue (light) | reconstructed lockup/monogram/wordmark | full logo + coloured monogram |
| Catalogue (dark) | reconstructed reversed lockup | **white monogram** (no reversed full exists) |
| Favicon | reconstructed-derived | monogram-derived |
| Apple touch | reconstructed-derived | monogram-derived |
| Manifest | reconstructed monogram SVG | approved monogram SVG + PNG set + maskable |
| Structured data | `lockup-primary.svg` | `tabasamu-full-logo.png` |
| OG card | reconstructed-derived card | approved full logo, design preserved |

## Tone (light/dark) handling

- **light** ground (cream / warm-cream): full logo **or** coloured monogram.
- **dark** ground (forest / terracotta / charcoal): **white monogram only**.
- The full logo is **never** placed on a dark surface (no approved reversed full
  lockup); the brand lint fails the build if anyone tries.

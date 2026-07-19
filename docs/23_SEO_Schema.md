# SEO Schema & Metadata

---

## ⛔ No `schema.org/Product` structured data is emitted

**This is the most important decision in this document, and it is deliberate.**

A `Product` schema is only useful with an `offers` block, and `offers` requires a `price`.

⛔ **D-14: no approved price exists.**

Publishing a placeholder price as structured data would push a **false commercial claim** into Google Shopping, price-comparison engines, and rich snippets — **at scale, mechanically, to an audience with no way to know it is fictional.**

That is materially worse than showing a placeholder on our own page, where the *"indicative"* marker sits right beside it and a human can see the caveat.

So `productJsonLd()` **returns `null`** until D-14 lands. The function exists, it is tested, and it simply refuses to lie.

**Verified:** the built `/shop/[slug]` HTML contains **zero** `<script type="application/ld+json">` tags.

### What unblocks it

One thing: an approved price. Then `productJsonLd()` emits:

```jsonc
{
  "@type": "Product",
  "name": "…",
  "image": "…",
  "brand": { "@type": "Brand", "name": "Tabasamu Sips" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "KES",
    "price": "…",              // ⛔ D-14
    "availability": "…"        // from real inventory
  }
}
```

---

## What *is* emitted

### Page metadata (every route)

| Tag | Source |
|---|---|
| `<title>` | `seo.title` → falls back to a derived title |
| `<meta name="description">` | `seo.description` → derived from the forward note + descriptor |
| `<link rel="canonical">` | the route path |
| `og:title`, `og:description`, `og:url`, `og:type` | mirrors the above |
| `og:image` | ✅ **the real product photograph**, now that photography exists |
| `twitter:card` | `summary_large_image` |

### Admin-editable, with fallbacks

```ts
interface SeoContent {
  title?: string;
  description?: string;
  ogImage?: string;    // falls back to the product hero
  noindex?: boolean;   // for a draft or discontinued line
}
```

Every field is optional. An admin who leaves the description blank gets a sensible derived one — **not an empty `<meta>` tag**.

---

## Social sharing

✅ **Now real.** Before Phase 4 there was no photograph, so a shared link had no image. Every product page now carries a genuine `og:image` — the 4:5 portrait crop, with the label legible.

⚠ **Two exceptions**, and they are honest ones:

- **Beetroot** (A-05) and **Gooseberry** (A-07) have no photograph. Their `og:image` falls back to the site default rather than pointing at a file that does not exist.

---

## The filter URLs are indexable, and shareable

`/shop?flavour=passion&availability=in-stock` is a **real, server-rendered, shareable URL**.

- Defaults are **omitted** from the query string — `/shop` and `/shop?sort=featured&page=1` are the same view, and only one of them exists. Otherwise search engines index two URLs for one page.
- The filtered grid is in the **initial HTML**, so a crawler (and a customer on a slow connection) sees products, not a spinner.
- Parsing is **totally defensive**: an unknown flavour, a garbage sort, `?page=-5`, or a 5,000-character search term are all dropped or clamped. **A crash on a bad query string is a crash on a shared link** — the worst place to have one.

---

## ⛔ Still blocked

| ID | Blocks |
|---|---|
| **D-14** | `schema.org/Product` — the whole reason it is withheld |
| **D-21/22/23** | `shippingDetails` in the offer |
| **D-05** | `nutrition` schema |
| **D-09** | any subscription offer schema |

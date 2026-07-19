/**
 * DOMAIN — CATALOGUE
 *
 * D-01 ANSWERED (client, 2026-07-14): SIX flavours.
 * D-02 ANSWERED (client, 2026-07-14): 1 LITRE. The Brand Book's 500ml
 *      packaging spec (§06) is superseded by the client's confirmation
 *      and by every photograph.
 * D-03 ANSWERED (client, 2026-07-14): strip colours for Passion, Beetroot,
 *      Gooseberry supplied. They are OFF-PALETTE and therefore quarantined —
 *      see `FlavourStrip` below.
 *
 * STILL BLOCKED — these fields are typed as `Unavailable`, never guessed: [NN-05]
 *   D-05  ingredients + nutrition   (regulated)
 *   D-13  "Caffeine Free" or "Gluten Free"?  (different regulated claims)
 *   D-14  price                     (no approved price exists)
 *   D-49  provenance / named farms
 *   D-50  rooibos or hibiscus?      (the brand's central claim)
 *   D-51  forward notes for Passion, Beetroot, Gooseberry
 *   D-52  fermentation days — six or fourteen?
 */

import type { ProductId, VariantId, Money } from '../shared';

/* ------------------------------------------------------------------ *
 * The honest absence type.
 *
 * A blocked field is NOT `null`, NOT `''`, and NOT a placeholder string.
 * It carries the decision ID that blocks it, so that a missing value is
 * traceable to an open question and can never be silently rendered as
 * though it were real. The UI renders these as an explicit
 * "awaiting client confirmation" state.
 * ------------------------------------------------------------------ */

export interface Unavailable {
  readonly _unavailable: true;
  /** The blocking decision, e.g. 'D-05'. */
  readonly blockedBy: string;
  readonly note: string;
}

export const unavailable = (blockedBy: string, note: string): Unavailable => ({
  _unavailable: true,
  blockedBy,
  note,
});

export const isUnavailable = <T>(v: T | Unavailable): v is Unavailable =>
  typeof v === 'object' && v !== null && '_unavailable' in v;

export type Pending<T> = T | Unavailable;

/* ------------------------------------------------------------------ *
 * Flavour strip — a PACKAGING system, quarantined from web chrome. [R-15]
 * ------------------------------------------------------------------ */

export const FLAVOUR_SLUGS = [
  'grape-ginger',
  'pineapple',
  'pineapple-ginger',
  'beetroot',
  'passion',
  'gooseberry',
] as const;

export type FlavourSlug = (typeof FLAVOUR_SLUGS)[number];

export interface FlavourStrip {
  readonly hex: string;
  /** Uppercase. DM Sans 500, 0.22em tracking. */
  readonly label: string;
  /**
   * `true` when the colour is not one of the five Brand Book palette colours.
   * An off-palette strip may appear ONLY as a small identifying swatch on a
   * product card or PDP. It is NEVER a card background, a section fill, or a
   * button colour — doing so breaks the five-colour palette. [R-15]
   *
   * The `FlavourSwatch` component is the ONLY component permitted to consume
   * this hex. Enforced by lint (`scripts/check-brand.mjs`).
   */
  readonly offPalette: boolean;
}

export const FLAVOUR_STRIPS: Readonly<Record<FlavourSlug, FlavourStrip>> = {
  'grape-ginger': { hex: '#4A2A55', label: 'GRAPE GINGER', offPalette: true },
  pineapple: { hex: '#E9C25B', label: 'PINEAPPLE', offPalette: true },
  'pineapple-ginger': { hex: '#C05A2C', label: 'PINEAPPLE GINGER', offPalette: false }, // == terracotta
  beetroot: { hex: '#8B2635', label: 'BEETROOT', offPalette: true },
  passion: { hex: '#0B8BFF', label: 'PASSION', offPalette: true },
  gooseberry: { hex: '#4A7C59', label: 'GOOSEBERRY', offPalette: true },
};

/* ------------------------------------------------------------------ *
 * Pricing approval status
 *
 * ⚠ THIS LIVES IN THE DOMAIN, NOT IN THE MOCK ADAPTER.
 *
 *   "Has the client approved a retail price?" is a BUSINESS FACT about the
 *   product, not an artefact of which data source we happen to be using. It
 *   remains true after the backend replaces the mock at Gate G2 — the prices
 *   will come from a database and will STILL be unapproved until D-14 is
 *   answered.
 *
 *   Putting it in `adapters/mock/fixtures` would mean a component had to
 *   import from an adapter to render a price honestly — which is precisely the
 *   dependency the port architecture forbids (R-13), and which the boundary
 *   lint rejects.
 *
 * ⛔ D-14 — set to `false` ONLY when real, approved prices exist.
 * ------------------------------------------------------------------ */

export const PLACEHOLDER_PRICES = true as const;

/* ------------------------------------------------------------------ *
 * Size — D-02 answered: 1 Litre.
 * ------------------------------------------------------------------ */

export type SizeCode = '1L';

export interface Size {
  readonly code: SizeCode;
  readonly millilitres: number;
  readonly label: string;
}

export const SIZE_1L: Size = { code: '1L', millilitres: 1000, label: '1 Litre' };

/* ------------------------------------------------------------------ *
 * Product & Variant
 * ------------------------------------------------------------------ */

export interface Provenance {
  readonly ingredient: string;
  readonly region: string;
}

export interface Ingredient {
  readonly name: string;
  readonly allergen: boolean;
}

export interface NutritionPanel {
  readonly per100ml: ReadonlyArray<{ nutrient: string; value: string }>;
}

export interface ProductImage {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly role: 'hero' | 'packshot' | 'lifestyle' | 'label' | 'process';
  readonly blurDataURL?: string;
}

export type ProductStatus = 'draft' | 'active' | 'archived';

/* ------------------------------------------------------------------ *
 * SEO — modelled as CONTENT, so the admin portal can edit it. [Phase 4 §6]
 *
 * ⚠ Every field is optional and falls back to a derived default. An admin who
 *   leaves the meta description blank gets a sensible one; they do not get an
 *   empty <meta> tag.
 * ------------------------------------------------------------------ */

export interface SeoContent {
  readonly title?: string;
  readonly description?: string;
  /** OG image override. Falls back to the product's hero image. */
  readonly ogImage?: string;
  /** Excluded from sitemap + `noindex`. For a draft or discontinued line. */
  readonly noindex?: boolean;
}

/* ------------------------------------------------------------------ *
 * Storage & serving — factual handling guidance.
 *
 * ⚠ This is NOT nutrition and NOT a health claim. "Keep refrigerated" is a
 *   handling instruction for a live product; "aids digestion" would be a
 *   regulated medical claim and appears nowhere. [R-02]
 * ------------------------------------------------------------------ */

export interface StorageGuidance {
  /** e.g. 'Keep refrigerated. This is a live product.' */
  readonly refrigeration: Pending<string>;
  readonly shelfLife: Pending<string>;
  readonly servingSuggestion: Pending<string>;
}

export interface Product {
  readonly id: ProductId;
  readonly slug: FlavourSlug;
  readonly name: string;

  /**
   * The flavour, as a searchable string. Distinct from `name`: today they
   * coincide, but a "Grape Ginger — Limited Batch" product would have the same
   * FLAVOUR and a different NAME, and search must still find it.
   */
  readonly flavour: string;

  /**
   * Curated order for the "Featured" sort. Set by the client in the admin
   * portal. ⚠ Stable and explicit — a grid that reshuffles between renders
   * makes a customer lose the bottle they were looking at.
   */
  readonly position: number;

  /**
   * Can this be bought on a recurring schedule?
   *
   * ⛔ D-09 — the subscription BILLING MODEL is still undecided (M-PESA has no
   *    card-on-file equivalent). This flag marks ELIGIBILITY, which is a
   *    catalogue fact and safe to model. It does NOT imply that subscriptions
   *    work — nothing can be subscribed to yet, and the UI says so. [NN-04]
   */
  readonly subscriptionEligible: boolean;

  /** ⛔ D-51 for Passion, Beetroot, Gooseberry. */
  readonly forwardNote: Pending<string>;

  /** ✅ D-13 ANSWERED (2026-07-14): "Caffeine Free". */
  readonly descriptor: Pending<string>;

  /** ✅ D-50 ANSWERED (2026-07-14): Rooibos. */
  readonly base: Pending<string>;

  readonly strip: FlavourStrip;

  /** ⛔ D-49 — named farms not supplied. */
  readonly provenance: Pending<readonly Provenance[]>;

  /** ⛔ D-05 — regulated. Will not be invented. */
  readonly ingredients: Pending<readonly Ingredient[]>;
  readonly nutrition: Pending<NutritionPanel>;

  /** ⛔ D-52 — the Brand Book says six days; the Strategy doc says fourteen. */
  readonly fermentationDays: Pending<number>;

  readonly storage: StorageGuidance;

  readonly variants: readonly Variant[];
  readonly images: readonly ProductImage[];
  readonly status: ProductStatus;

  /** Admin-editable. Optional — sensible defaults are derived. */
  readonly seo?: SeoContent;
}

export interface Variant {
  readonly id: VariantId;
  readonly productId: ProductId;
  /** Rendered in JetBrains Mono — the spec register. */
  readonly sku: string;
  readonly size: Size;
  /** ⛔ D-14 — no approved price exists. Mock data is obviously-placeholder. */
  readonly price: Pending<Money>;
  readonly compareAtPrice: Money | null;
  readonly active: boolean;
}

/* ------------------------------------------------------------------ *
 * Inventory
 * ------------------------------------------------------------------ */

/** ⛔ D-28 — preorder/backorder policy not decided. */
export type StockPolicy = 'deny' | 'backorder' | 'preorder';

export interface Batch {
  readonly id: string;
  readonly variantId: VariantId;
  readonly bottlingDate: string;
  readonly quantity: number;
  /** Rendered in JetBrains Mono. */
  readonly batchNumber: string;
}

export interface Inventory {
  readonly variantId: VariantId;
  readonly onHand: number;
  readonly reserved: number;
  /** Derived. Never stored. */
  readonly available: number;
  /** ⛔ D-27 — threshold not supplied. */
  readonly lowStockThreshold: Pending<number>;
  readonly policy: StockPolicy;
  /** ⛔ D-29 — batch calendar not supplied. */
  readonly nextBatch: Batch | null;
}

export const availableStock = (inv: Pick<Inventory, 'onHand' | 'reserved'>): number =>
  Math.max(0, inv.onHand - inv.reserved);

/**
 * Stock messaging is FACTUAL. "Two bottles remaining."
 * Never "Almost gone!", never a countdown, never a badge. [P-07]
 *
 * Small-batch fermentation makes a stock-out NORMAL, not exceptional.
 * "Next batch bottles on {date}" is both more on-brand and more TRUE
 * than a bare out-of-stock dead end. [R-24]
 */
export type StockStatus =
  | { kind: 'in_stock' }
  | { kind: 'low_stock'; remaining: number }
  | { kind: 'out_of_stock' }
  | { kind: 'next_batch'; date: string }
  | { kind: 'unknown'; blockedBy: string };

export const stockStatus = (inv: Inventory): StockStatus => {
  const available = availableStock(inv);

  if (available <= 0) {
    if (inv.nextBatch) return { kind: 'next_batch', date: inv.nextBatch.bottlingDate };
    return { kind: 'out_of_stock' };
  }

  // We cannot claim "low stock" without a client-supplied threshold. [D-27]
  if (isUnavailable(inv.lowStockThreshold)) {
    return available > 0 ? { kind: 'in_stock' } : { kind: 'out_of_stock' };
  }

  if (available <= inv.lowStockThreshold) {
    return { kind: 'low_stock', remaining: available };
  }
  return { kind: 'in_stock' };
};

export const isPurchasable = (inv: Inventory): boolean =>
  availableStock(inv) > 0 || inv.policy === 'backorder' || inv.policy === 'preorder';

/* ================================================================== *
 * PHASE 4 MODELS — Collection, Media, Subscription, Bundle
 *
 * All modelled so the ADMIN PORTAL can edit them later. [Phase 4 §6]
 * That means: stable IDs, explicit ordering, human-readable labels, and no
 * behaviour baked into the shape.
 * ================================================================== */

/* ------------------------------------------------------------------ *
 * COLLECTION — a curated group of products.
 * ------------------------------------------------------------------ */

export interface Collection {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: Pending<string>;
  /** Ordered product IDs. Order is EDITORIAL and set by the client. */
  readonly productIds: readonly ProductId[];
  readonly image: Pending<ProductImage>;
  readonly status: ProductStatus;
  readonly position: number;
  readonly seo?: SeoContent;
}

/* ------------------------------------------------------------------ *
 * MEDIA — a first-class asset record.
 *
 * ⚠ Distinct from `ProductImage`, which is a USE of an asset. The same
 *   photograph can be a product hero AND a journal illustration; the asset has
 *   one record, and two usages. This is what an admin media library needs.
 * ------------------------------------------------------------------ */

export type MediaKind = 'image' | 'video';

export interface Media {
  readonly id: string;
  readonly kind: MediaKind;
  readonly src: string;
  /** The art-directed portrait crop, where one exists. */
  readonly portraitSrc?: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly blurDataURL?: string;
  /**
   * A KNOWN DEFECT in the asset, if any.
   * ⚠ e.g. the Pineapple frame's label reads "Gluten Free" (D-13 artwork
   *   error). Recording it here means it cannot be quietly forgotten when
   *   someone reuses the asset elsewhere.
   */
  readonly defect?: string;
}

/* ------------------------------------------------------------------ *
 * SUBSCRIPTION OPTION
 *
 * ⛔ D-09 — THE BILLING MODEL IS NOT CHOSEN, and this is not a small gap.
 *
 *   M-PESA has NO CARD-ON-FILE EQUIVALENT. A subscriber cannot be silently
 *   charged each cycle the way a Stripe subscription works. There are at least
 *   four candidate models, and they produce four DIFFERENT data models:
 *
 *     1. STK re-prompt  — push a payment request each cycle; customer must
 *                         approve on their handset. High friction, high churn.
 *     2. M-PESA Ratiba  — a standing order. Requires separate onboarding.
 *     3. Card-on-file   — but see D-35: can Stripe even settle KES?
 *     4. Pre-paid block — customer buys N deliveries up front. Simplest, and
 *                         arguably the most honest, but it is a different
 *                         product.
 *
 *   So this type describes the CADENCE ONLY. It carries no price, no discount,
 *   and no billing behaviour, because none has been decided. The UI explains
 *   the idea and collects interest — it does not take money. [NN-04, NN-05]
 * ------------------------------------------------------------------ */

export type SubscriptionInterval = 'weekly' | 'fortnightly' | 'monthly';

export interface SubscriptionOption {
  readonly id: string;
  readonly interval: SubscriptionInterval;
  readonly label: string;
  /**
   * ⛔ D-09 — NO DISCOUNT IS MODELLED HERE. Not `0`, not `null` with a default
   *   of zero elsewhere. A savings figure that nobody approved is an invented
   *   commercial claim, and "Save 0%" is a worse lie than saying nothing.
   */
  readonly discount: Pending<never>;
  readonly available: boolean;
}

export const SUBSCRIPTION_OPTIONS: readonly SubscriptionOption[] = [
  {
    id: 'sub-weekly',
    interval: 'weekly',
    label: 'Every week',
    discount: unavailable('D-09', 'No subscription discount has been approved.'),
    available: false,
  },
  {
    id: 'sub-fortnightly',
    interval: 'fortnightly',
    label: 'Every two weeks',
    discount: unavailable('D-09', 'No subscription discount has been approved.'),
    available: false,
  },
  {
    id: 'sub-monthly',
    interval: 'monthly',
    label: 'Every month',
    discount: unavailable('D-09', 'No subscription discount has been approved.'),
    available: false,
  },
] as const;

/**
 * ⛔ Can anything actually be subscribed to today? No.
 *   This is a single, honest flag rather than a scattering of `disabled` props.
 */
export const SUBSCRIPTIONS_AVAILABLE = false as const;

/* ------------------------------------------------------------------ *
 * BUNDLE
 *
 * ⛔ D-06 — BUNDLE SIZE IS NOT CONFIRMED. ⛔ D-14 — no approved price exists.
 *
 *   The client's instruction was explicit: "Do not assume bundle sizes or
 *   discounts. Keep them configuration-driven."
 *
 *   So `BundleConfig` is DATA, not code. The bottle count lives in one place;
 *   change it there and the whole builder — validation, progress, summary,
 *   copy — follows. Nothing hard-codes "6" or "12".
 * ------------------------------------------------------------------ */

export interface BundleItem {
  readonly productId: ProductId;
  readonly variantId: VariantId;
  readonly quantity: number;
}

export type BundleKind = 'preset' | 'build-your-own';

export interface Bundle {
  readonly id: string;
  readonly slug: string;
  readonly kind: BundleKind;
  readonly title: string;
  readonly description: Pending<string>;

  /**
   * ⛔ D-06 — how many bottles must a box contain?
   *   Typed `Pending<number>`. The builder REFUSES TO VALIDATE until this is
   *   known — it does not guess six, or twelve, or any other plausible number.
   */
  readonly requiredBottles: Pending<number>;

  /** Preset only: the fixed contents. Empty for build-your-own. */
  readonly items: readonly BundleItem[];

  /**
   * ⛔ D-14 / D-06 — no approved bundle price.
   *   NOT computed as "sum of parts", because a bundle that costs exactly the
   *   sum of its parts is not a bundle, and presenting one implies a saving
   *   that does not exist.
   */
  readonly price: Pending<Money>;

  /**
   * ⛔ How is the discount expressed — percentage, fixed amount, or free
   *   bottle? Nobody has said. Nothing is invented.
   */
  readonly discount: Pending<never>;

  readonly subscriptionEligible: boolean;
  readonly image: Pending<ProductImage>;
  readonly status: ProductStatus;
  readonly position: number;
  readonly seo?: SeoContent;
}

/* ------------------------------------------------------------------ *
 * BUNDLE VALIDATION — pure, and honest about what it cannot check.
 * ------------------------------------------------------------------ */

export type BundleValidity =
  /** ⛔ The required bottle count is unknown (D-06). We CANNOT validate. */
  | { readonly kind: 'unknown-requirement'; readonly blockedBy: string }
  | { readonly kind: 'incomplete'; readonly selected: number; readonly required: number }
  | { readonly kind: 'over'; readonly selected: number; readonly required: number }
  | { readonly kind: 'exceeds-stock'; readonly productId: ProductId; readonly available: number }
  | { readonly kind: 'valid'; readonly selected: number };

export const bundleSelectionCount = (items: readonly BundleItem[]): number =>
  items.reduce((sum, i) => sum + i.quantity, 0);

/**
 * ⚠ Note the FIRST branch. If the required bottle count is `Unavailable`, this
 *   returns `unknown-requirement` rather than falling back to a default.
 *
 *   The alternative — quietly assuming six — would produce a builder that looks
 *   like it works, validates against a number nobody approved, and lets a
 *   customer check out a box the business never agreed to sell.
 */
export const validateBundle = (
  bundle: Bundle,
  selection: readonly BundleItem[],
  inventory: ReadonlyMap<string, Inventory>
): BundleValidity => {
  if (isUnavailable(bundle.requiredBottles)) {
    return { kind: 'unknown-requirement', blockedBy: bundle.requiredBottles.blockedBy };
  }

  const required = bundle.requiredBottles;

  // Inventory is checked BEFORE the count, so a customer is told "only 3 left"
  // rather than "your box is incomplete" when the real problem is stock.
  for (const item of selection) {
    const inv = inventory.get(item.variantId as string);
    if (!inv) continue; // unknown stock is not a hard failure — see stockStatus
    const free = availableStock(inv);
    if (item.quantity > free) {
      return { kind: 'exceeds-stock', productId: item.productId, available: free };
    }
  }

  const selected = bundleSelectionCount(selection);
  if (selected < required) return { kind: 'incomplete', selected, required };
  if (selected > required) return { kind: 'over', selected, required };

  return { kind: 'valid', selected };
};

export const isBundleValid = (v: BundleValidity): boolean => v.kind === 'valid';

/** Immutable quantity change. Zero removes the line. */
export const setBundleQuantity = (
  items: readonly BundleItem[],
  productId: ProductId,
  variantId: VariantId,
  quantity: number
): readonly BundleItem[] => {
  const q = Math.max(0, Math.floor(quantity));
  const without = items.filter((i) => i.variantId !== variantId);
  return q === 0 ? without : [...without, { productId, variantId, quantity: q }];
};

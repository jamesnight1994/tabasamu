/**
 * MOCK FIXTURES
 *
 * ⚠ READ THIS BEFORE USING ANY NUMBER IN HERE.
 *
 * Every price, threshold, stock count and delivery fee below is a PLACEHOLDER.
 * None has been approved by the client. They are deliberately marked, and
 * `PLACEHOLDER_PRICES` is exported so that the UI can render a visible
 * "awaiting confirmation" state rather than presenting a fake number as though
 * it were a real one.
 *
 * Blocked fields are typed `Unavailable` — NOT filled with plausible-looking
 * invented content. That is the whole point. [NN-05]
 *
 * D-01 ✅ six flavours          (client, 2026-07-14)
 * D-02 ✅ 1 Litre               (client, 2026-07-14)
 * D-03 ✅ strip colours         (client, 2026-07-14)
 * D-14 ⛔ price                 — NOT ANSWERED. Everything below is fake.
 */

import {
  type Product,
  type Variant,
  type Inventory,
  type FlavourSlug,
  FLAVOUR_STRIPS,
  SIZE_1L,
  unavailable,
  type Bundle,
  type Collection,
} from '../../domain/catalogue';
import { PRODUCT_SLOTS } from '../../content/image-slots';
import { type Discount } from '../../domain/pricing';
import { productId, variantId, fromMajor, type ProductId } from '../../domain/shared';

/**
 * Re-exported from the DOMAIN. The flag is a business fact about the product
 * ("has a price been approved?"), not a property of the mock data source — so
 * it lives in `domain/catalogue` and stays true after the backend lands.
 */
export { PLACEHOLDER_PRICES } from '../../domain/catalogue';

/** Obvious, round, clearly-not-real. Sourced from the Strategy doc's RESEARCH
 *  BAND (KES 500–650 for 1L), which that document itself frames as a target,
 *  not a decision. */
const PLACEHOLDER_PRICE_KES = 550;


interface FlavourSeed {
  slug: FlavourSlug;
  name: string;
  /** Brand Book §06 supplies three. The other three are ⛔ D-51. */
  forwardNote: string | null;
  /**
   * Only four flavours have a usable photograph. Beetroot's label is
   * illegible (A-05) and Gooseberry has no asset at all (A-07).
   *
   * ⚠ `hasPhoto` is INDEPENDENT of `status`. A product can be live, in stock
   *   and buyable while its photograph is still pending — that is exactly the
   *   client's decision for Beetroot and Gooseberry. Conflating "no image" with
   *   "not for sale" would silently remove two of six products from the shop.
   */
  hasPhoto: boolean;
  onHand: number;
  /** Curated order for the "Featured" sort. Admin-editable. */
  position: number;
}

const SEEDS: readonly FlavourSeed[] = [
  {
    slug: 'grape-ginger',
    name: 'Grape Ginger',
    forwardNote: 'Black grape, fresh ginger',
    hasPhoto: true,
    onHand: 24,
    position: 1,
  },
  {
    slug: 'pineapple',
    name: 'Pineapple',
    forwardNote: 'Sweet pineapple, citrus tail',
    hasPhoto: true,
    onHand: 31,
    position: 2,
  },
  {
    slug: 'pineapple-ginger',
    name: 'Pineapple Ginger',
    forwardNote: 'Pineapple, warm ginger',
    hasPhoto: true,
    onHand: 18,
    position: 3,
  },
  {
    slug: 'passion',
    name: 'Passion',
    forwardNote: null,
    hasPhoto: true,
    onHand: 12,
    position: 4,
  },
  /*
   * ⚠ A-05 — the supplied Beetroot frame has ILLEGIBLE label typography.
   *
   *   CLIENT DECISION (2026-07-14): show an image PLACEHOLDER, but keep the
   *   product in the catalogue and keep it PURCHASABLE. Only the photograph is
   *   withheld — the product is real, the stock is real, the price (placeholder
   *   though it is) is real.
   *
   *   So `status` is 'active' and `hasPhoto` is false. Those are different
   *   facts and they are modelled separately, which is precisely why an
   *   "awaiting asset" panel can render inside a live, buyable product card.
   */
  {
    slug: 'beetroot',
    name: 'Beetroot',
    forwardNote: null,
    hasPhoto: false,
    onHand: 6,
    position: 5,
  },
  /*
   * ⚠ A-07 — Gooseberry has NEVER had a photograph.
   *   Same client decision: placeholder image, product stays live.
   *   ⚠ Stock is 0 — so it will correctly render as SOLD OUT, which is a stock
   *     fact, not an asset fact. Do not conflate the two.
   */
  {
    slug: 'gooseberry',
    name: 'Gooseberry',
    forwardNote: null,
    hasPhoto: false,
    onHand: 0,
    position: 6,
  },
];

const skuFor = (slug: FlavourSlug): string =>
  `TS-${slug.toUpperCase().replace(/-/g, '').slice(0, 6)}-1L`;

const makeVariant = (pid: ProductId, slug: FlavourSlug): Variant => ({
  id: variantId(`var_${slug}_1l`),
  productId: pid,
  sku: skuFor(slug),
  size: SIZE_1L, // D-02 ✅
  // ⚠ PLACEHOLDER. D-14 unanswered.
  price: fromMajor(PLACEHOLDER_PRICE_KES),
  compareAtPrice: null,
  active: true,
});

export const MOCK_PRODUCTS: readonly Product[] = SEEDS.map((seed) => {
  const pid = productId(`prod_${seed.slug}`);
  return {
    id: pid,
    slug: seed.slug,
    name: seed.name,

    /**
     * Searchable flavour. Today it equals `name`; it is a separate field so a
     * future "Grape Ginger — Limited Batch" still matches a search for "grape".
     */
    flavour: seed.name,

    position: seed.position,

    /**
     * ⛔ D-09 — ELIGIBILITY is a catalogue fact and safe to model. It does NOT
     *    mean subscriptions work: `SUBSCRIPTIONS_AVAILABLE` is `false`, no
     *    billing model exists, and the UI says so plainly. [NN-04]
     */
    subscriptionEligible: true,

    forwardNote:
      seed.forwardNote ??
      unavailable('D-51', `A forward note for ${seed.name} has not been written or approved.`),

    // ✅ D-13 ANSWERED (client, 2026-07-14): "Caffeine Free".
    //    The artwork's stray "Gluten Free" bottle is an artwork error, not a
    //    second claim. "Caffeine Free" is the approved descriptor and may now
    //    appear in titles, meta descriptions and on-page copy.
    //
    // ⚠ NOTE FOR THE CLIENT: the physical label artwork still disagrees with
    //   itself. The LABEL should be corrected at the next print run so the
    //   pack and the site make the same regulated claim.
    descriptor: 'Caffeine Free',

    // ✅ D-50 ANSWERED (client, 2026-07-14): ROOIBOS is the base.
    //
    // ⚠ CONSEQUENCE FOR COPY, AND IT IS NOT COSMETIC:
    //   Rooibos is South African. It is not grown in Kenya. The Brand Book's
    //   origin story ("Kenyan-grown hibiscus") is therefore NOT true of this
    //   product, and the brand's "Kenyan soil" claim cannot be attached to the
    //   TEA — only to the FRUIT, the brewing, and the people.
    //
    //   All homepage copy is written to honour this: the craft is Nairobi's,
    //   the fruit is Kenyan, the rooibos is named as what it is. We do not
    //   claim the rooibos is Kenyan-grown, because it is not. [NN-05]
    base: 'Rooibos',

    strip: FLAVOUR_STRIPS[seed.slug],

    provenance: unavailable(
      'D-49',
      'Named farms and regions have not been supplied. Provenance is the brand’s stated trust mechanism and will not be invented.'
    ),

    ingredients: unavailable(
      'D-05',
      'The ingredients list is regulated food information and has not been supplied.'
    ),
    nutrition: unavailable(
      'D-05',
      'The nutritional panel is regulated food information and has not been supplied.'
    ),

    fermentationDays: unavailable(
      'D-52',
      'The Brand Book says six days; the Marketing Strategy says fourteen. A specific number that is wrong is worse than no number.'
    ),

    /*
     * ⚠ HANDLING GUIDANCE, NOT HEALTH CLAIMS.
     *
     *   "Keep refrigerated" is a factual instruction for a LIVE product and is
     *   safe to state. "Aids digestion" would be a regulated medical claim and
     *   appears nowhere in this codebase. [R-02]
     *
     *   Refrigeration is stated because the product is a live ferment and this
     *   is a safety-relevant handling fact. Shelf life and serving suggestion
     *   are BLOCKED — nobody has supplied them, and a guessed shelf life is a
     *   food-safety claim.
     */
    storage: {
      refrigeration:
        'Keep refrigerated. This is a live product — the culture stays active, and cold is what keeps it in balance.',
      shelfLife: unavailable(
        'D-05',
        'No shelf life or best-before period has been supplied. This is regulated food information and will not be estimated.'
      ),
      servingSuggestion: unavailable(
        'D-53',
        'No approved serving suggestion. Serving copy has not been written or signed off.'
      ),
    },

    variants: [makeVariant(pid, seed.slug)],

    /*
     * ⚠ IMAGES COME FROM THE SLOT REGISTRY, not from strings built here.
     *
     *   `src/content/image-slots.ts` is the single source of truth for what
     *   photography exists, what crop it is, what its alt text says, and
     *   whether it carries a known defect. Duplicating that here is how the two
     *   drift apart and how a product ends up pointing at a file that was never
     *   shot.
     *
     *   An unsupplied slot yields an EMPTY images array — and the UI renders an
     *   honest "photography pending" panel rather than a broken <img>.
     */
    images: PRODUCT_SLOTS[seed.slug].supplied
      ? [
          {
            // The 4:5 portrait crop — the product grid and the PDP gallery both
            // want a tall frame, because a bottle is a tall object.
            src: PRODUCT_SLOTS[seed.slug].portraitSrc ?? PRODUCT_SLOTS[seed.slug].src,
            alt: PRODUCT_SLOTS[seed.slug].alt,
            width: 1200,
            height: 1500,
            role: 'packshot' as const,
          },
          {
            // The 3:2 landscape frame — editorial contexts and the PDP's
            // secondary gallery slide.
            src: PRODUCT_SLOTS[seed.slug].src,
            alt: PRODUCT_SLOTS[seed.slug].alt,
            width: 1800,
            height: 1200,
            role: 'lifestyle' as const,
          },
        ]
      : [],

    // ⚠ Gooseberry cannot be merchandised without an image or a strip
    //   sign-off. It ships as a draft, excluded from the storefront.
    /*
     * ⚠ ALL SIX ARE ACTIVE.
     *
     *   In Phase 3 Gooseberry was 'draft' because it had no photograph. The
     *   client has now decided (2026-07-14) that Beetroot and Gooseberry ship
     *   with an image PLACEHOLDER and remain in the catalogue.
     *
     *   A missing photograph is an ASSET problem, not a merchandising decision.
     *   Keeping them 'draft' would have hidden two of six products from the
     *   shop — a far bigger lie than an honest "photography pending" panel.
     */
    status: 'active' as const,
  };
});

export const MOCK_INVENTORY: readonly Inventory[] = SEEDS.map((seed) => ({
  variantId: variantId(`var_${seed.slug}_1l`),
  onHand: seed.onHand, // ⚠ placeholder
  reserved: 0,
  available: seed.onHand,
  // ⛔ D-27 — no threshold supplied, so we CANNOT say "only 2 left".
  lowStockThreshold: unavailable('D-27', 'The low-stock threshold has not been supplied.'),
  // ⛔ D-28 — 'deny' is the only safe default. Backorder/preorder is a
  //    commercial promise we have not been authorised to make.
  policy: 'deny' as const,
  // ⛔ D-29 — no batch calendar supplied.
  nextBatch: null,
}));

/**
 * ⛔ D-21 / D-22 / D-23 — DELIVERY ZONES ARE NOT SUPPLIED.
 *
 * This array is EMPTY, and that is not an oversight. Inventing a zone list
 * ("Westlands · KES 200") would be inventing a delivery promise the business
 * has not made, in a market where delivery clarity is the single biggest
 * first-time-buyer trust factor (P-03, R-08).
 *
 * The UI must therefore render the zone selector in an honest, explicit
 * "awaiting client confirmation" state — NOT with invented options.
 */
/**
 * ⚠ RETIRED IN PHASE 5. Zones now live in `DeliveryConfig` (`domain/delivery`),
 *   alongside the rule engine that consumes them, so that a zone can carry a
 *   BLOCKED fee (`Pending<Money>`) rather than merely being absent.
 *
 *   The value here was `[]` — Phase 4 invented no zone, and neither does Phase 5.
 *   `EMPTY_DELIVERY_CONFIG` is the replacement. [⛔ D-21/22/23]
 */
export const MOCK_ZONES: readonly [] = [];

/** ⛔ D-18/D-19 — no promotion has been approved. Empty by design. */
export const MOCK_DISCOUNTS: readonly Discount[] = [];

/* ================================================================== *
 * BUNDLES — ⛔ D-06 (bottle count) and D-14 (price) are BOTH unanswered.
 *
 * The client's instruction was explicit:
 *   "Do not assume bundle sizes or discounts. Keep them configuration-driven."
 *
 * So neither is invented. `requiredBottles` is `Unavailable`, and the builder
 * REFUSES TO VALIDATE against a guessed number — it says so, visibly, rather
 * than silently accepting six and letting a customer configure a box the
 * business never agreed to sell.
 *
 * ⚠ WHAT THIS MEANS IN PRACTICE. The bundle builder is fully built: the
 *   quantity controls work, the inventory ceilings are enforced, the progress
 *   indicator tracks the selection, the summary is live. The ONE thing it
 *   cannot do is tell the customer they are finished — because nobody has said
 *   how many bottles finish a box.
 *
 *   Set `requiredBottles` to a number and every one of those pieces starts
 *   working. That is the whole change.
 * ================================================================== */

export const MOCK_BUNDLES: readonly Bundle[] = [
  {
    id: 'bundle-mixed',
    slug: 'build-your-own',
    kind: 'build-your-own',
    title: 'Build your own box',
    description:
      'Choose the flavours you actually drink. Mix them however you like, in whatever proportion.',

    // ⛔ D-06 — NOT GUESSED. Not 6, not 12.
    requiredBottles: unavailable(
      'D-06',
      'The required bottle count for a box has not been confirmed. The builder will not validate against a guessed number.'
    ),

    items: [],

    // ⛔ D-14 / D-06 — NOT computed as "sum of parts". A bundle priced at
    //    exactly the sum of its parts is not a bundle, and presenting one
    //    implies a saving that does not exist.
    price: unavailable(
      'D-14',
      'No approved bundle price. It is not computed from the sum of the parts, because that would imply a discount that has not been agreed.'
    ),

    discount: unavailable(
      'D-06',
      'No bundle discount has been approved, and its form (percentage, fixed amount, free bottle) has not been decided.'
    ),

    subscriptionEligible: true,

    image: unavailable('R-03', 'No bundle photograph exists.'),
    status: 'active',
    position: 1,
  },

  {
    id: 'bundle-taster',
    slug: 'the-full-range',
    kind: 'preset',
    title: 'The full range',
    description: 'One of each. The simplest way to find the one you will keep buying.',

    // ⛔ Even the PRESET's size is unconfirmed. It is "one of each" in intent,
    //    but whether a box holds six bottles — or six is even a valid box size —
    //    has not been established.
    requiredBottles: unavailable(
      'D-06',
      'Whether a box holds six bottles (one of each flavour) has not been confirmed.'
    ),

    // Intent: one of every flavour, in curated order.
    items: MOCK_PRODUCTS.map((p) => ({
      productId: p.id,
      variantId: p.variants[0].id,
      quantity: 1,
    })),

    price: unavailable('D-14', 'No approved bundle price.'),
    discount: unavailable('D-06', 'No bundle discount has been approved.'),

    subscriptionEligible: true,
    image: unavailable('R-03', 'No bundle photograph exists.'),
    status: 'active',
    position: 2,
  },
];

/* ================================================================== *
 * COLLECTIONS
 * ================================================================== */

export const MOCK_COLLECTIONS: readonly Collection[] = [
  {
    id: 'col-all',
    slug: 'all',
    title: 'The range',
    description: 'Six flavours, one system. The label never changes; only the strip does.',
    productIds: MOCK_PRODUCTS.map((p) => p.id),
    image: unavailable('R-03', 'No collection photograph exists.'),
    status: 'active',
    position: 1,
  },
  {
    id: 'col-ginger',
    slug: 'ginger',
    title: 'With ginger',
    description: 'The two that carry heat.',
    productIds: MOCK_PRODUCTS.filter((p) => p.slug.includes('ginger')).map((p) => p.id),
    image: unavailable('R-03', 'No collection photograph exists.'),
    status: 'active',
    position: 2,
  },
];

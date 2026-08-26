/**
 * IMAGE SLOT REGISTRY — THE PHOTOGRAPHY CONTRACT
 *
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 4 UPDATE — PHOTOGRAPHY PARTIALLY LANDED (2026-07-14)
 *
 *   ✅ SUPPLIED (4):  Grape Ginger · Pineapple · Pineapple Ginger · Passion
 *   ⛔ PLACEHOLDER (2): Beetroot · Gooseberry  — by client decision
 *
 *   Each supplied frame ships in TWO crops, derived from the original:
 *     · `{slug}.jpg`          1800×1200  (3:2 landscape) — PDP gallery, editorial
 *     · `{slug}-portrait.jpg` 1200×1500  (4:5 portrait)  — product grid, mobile
 *
 *   ⚠ The portrait is a real crop around the BOTTLE CENTRE, not a squeeze. The
 *     brief forbids stretching or overcropping the product, and the label IS
 *     the product. Every crop was visually verified: full bottle, whole label,
 *     fruit cue still in frame.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ✅ R-12 IS NOW SOLVED — by the photography, exactly as the shot list asked.
 *
 *   The label system is uniform by design: at 160px, in greyscale, all six
 *   bottles would be the same photograph. The supplied frames each carry a
 *   DISTINCT FRUIT CUE in-shot — grapes + ginger root, halved passionfruit,
 *   pineapple slices, pineapple + ginger in a bowl. Together with the flavour
 *   name and the colour swatch, a customer can now tell them apart at
 *   thumbnail size. That was the hard requirement, and it was met.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ⚠ TWO KNOWN DEFECTS IN THE SUPPLIED ASSETS. Both recorded, neither hidden.
 *
 *   A-05 · BEETROOT — the label typography is ILLEGIBLE. The wordmark
 *          letterforms are distorted and the descriptor line is noise. It is a
 *          generation artefact, not a photograph of a real label, and it cannot
 *          go on a page where the label IS the product.
 *          → CLIENT DECISION (2026-07-14): show a placeholder. Beetroot stays
 *            in the catalogue and stays purchasable; only the image is withheld.
 *
 *   D-13 · PINEAPPLE — the label in this photograph reads "GLUTEN FREE Rooibos
 *          Kombucha". Every other bottle reads "CAFFEINE FREE". These are
 *          DIFFERENT REGULATED FOOD CLAIMS.
 *          → CLIENT DECISION (2026-07-14): the site says "Caffeine Free"
 *            (D-13, answered), and the image is used as supplied.
 *          ⚠ THE PHYSICAL ARTWORK MUST BE CORRECTED AT THE NEXT PRINT RUN, so
 *            the pack and the site make the same regulated claim. Until then,
 *            the site and this one photograph disagree.
 * ═══════════════════════════════════════════════════════════════════
 */

export type AspectRatio = '1/1' | '4/5' | '3/2' | '16/9' | '21/9';

export interface ImageSlot {
  readonly id: string;
  /** Landscape / default source. */
  readonly src: string;
  /**
   * The 4:5 portrait crop, where one exists — product grid and mobile hero.
   * A bottle is a TALL object; a landscape crop of a tall object is mostly
   * worktop.
   */
  readonly portraitSrc?: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly aspect: AspectRatio;
  /** A DIFFERENT crop for mobile, not a squeeze. */
  readonly mobileAspect?: AspectRatio;
  readonly sizes: string;
  readonly textOverlay: 'none' | 'safe-zone-left' | 'safe-zone-right' | 'below';
  readonly direction: string;
  readonly supplied: boolean;
  /** A blocker (no image) OR a recorded defect (image used, flaw known). */
  readonly blockedBy?: string;
}

/* ================================================================== *
 * HERO — the Grape Ginger frame. Brand Book ANCHOR · I: "the default".
 * ================================================================== */

export const HERO_SLOT: ImageSlot = {
  id: 'hero-primary',
  src: '/products/grape-ginger.jpg',
  portraitSrc: '/products/grape-ginger-portrait.jpg',
  alt: 'A one-litre bottle of Tabasamu Sips Grape Ginger on a hand-carved wooden stool, black grapes and fresh ginger beside it, in slanted afternoon light.',
  width: 1800,
  height: 1200,
  aspect: '3/2',
  mobileAspect: '4/5',
  sizes: '(max-width: 768px) 100vw, 60vw',
  textOverlay: 'safe-zone-left',
  direction:
    'Brand Book ANCHOR · I — the hero product shot. Hand-carved stool, slanted afternoon shadow through a window frame, bottle plus ingredient cues plus breathing room.',
  supplied: true,
};

/* ================================================================== *
 * PRODUCT SLOTS
 * ================================================================== */

interface ProductSlotInput {
  slug: string;
  name: string;
  /** What is actually in the frame. Drives the alt text and the R-12 cue. */
  scene: string;
  supplied: boolean;
  blockedBy?: string;
}

const productSlot = (i: ProductSlotInput): ImageSlot => ({
  id: `product-${i.slug}`,
  src: `/products/${i.slug}.jpg`,
  portraitSrc: i.supplied ? `/products/${i.slug}-portrait.jpg` : undefined,
  alt: `A one-litre bottle of Tabasamu Sips ${i.name} kombucha, ${i.scene}.`,
  width: 1200,
  height: 1500,
  aspect: '4/5',
  sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  textOverlay: 'below',
  direction: `Bottle centred, label square to camera and FULLY LEGIBLE — the label is the product. ⚠ R-12: ${i.scene} must be in frame so the flavour survives greyscale and a 160px thumbnail; the labels are otherwise identical by design.`,
  supplied: i.supplied,
  blockedBy: i.blockedBy,
});

export const PRODUCT_SLOTS: Readonly<Record<string, ImageSlot>> = {
  'grape-ginger': productSlot({
    slug: 'grape-ginger',
    name: 'Grape Ginger',
    scene: 'black grapes and a knob of fresh ginger beside it on a wooden stool',
    supplied: true,
  }),

  pineapple: productSlot({
    slug: 'pineapple',
    name: 'Pineapple',
    scene: 'pineapple slices beside it on a woven sisal mat in direct afternoon sun',
    supplied: true,
    // ⚠ NOT a blocker — the image IS used, per client decision. This is a
    //   recorded DEFECT so it cannot be quietly forgotten.
    blockedBy:
      'D-13 ARTWORK DEFECT — the label in this photograph reads "Gluten Free"; every other bottle reads "Caffeine Free". The SITE says Caffeine Free (D-13, answered). CORRECT THE ARTWORK AT THE NEXT PRINT RUN.',
  }),

  'pineapple-ginger': productSlot({
    slug: 'pineapple-ginger',
    name: 'Pineapple Ginger',
    scene: 'a hand-glazed bowl of pineapple and raw ginger beside it, linen curtain at an open window',
    supplied: true,
  }),

  passion: productSlot({
    slug: 'passion',
    name: 'Passion',
    scene: 'whole and halved passionfruit beside it on a wooden stool',
    supplied: true,
  }),

  // ⛔ A-05 — supplied frame's label typography is ILLEGIBLE.
  beetroot: productSlot({
    slug: 'beetroot',
    name: 'Beetroot',
    scene: 'a raw beetroot, halved to show the rings, beside it',
    supplied: false,
    blockedBy:
      'A-05 — the supplied frame has ILLEGIBLE label typography. Placeholder shown by client decision. RESHOOT REQUIRED.',
  }),

  // ⛔ A-07 — no photograph has ever been supplied.
  gooseberry: productSlot({
    slug: 'gooseberry',
    name: 'Gooseberry',
    scene: 'a handful of cape gooseberries in their papery husks beside it',
    supplied: false,
    blockedBy: 'A-07 — NO PHOTOGRAPH EXISTS. Placeholder shown by client decision.',
  }),
};

/* ================================================================== *
 * EDITORIAL
 * ================================================================== */

export const PROCESS_SLOT: ImageSlot = {
  id: 'process-ferment',
  src: '/products/process-ferment.jpg',
  alt: 'A fermentation vessel in a Nairobi kitchen, the culture visible at the surface.',
  width: 1600,
  height: 1200,
  aspect: '3/2',
  sizes: '(max-width: 768px) 100vw, 50vw',
  textOverlay: 'none',
  direction:
    'The actual vessel, in the actual kitchen. The culture should look like a living thing, not a laboratory. This shot carries the small-batch claim, so it must not look industrial.',
  supplied: false,
  blockedBy: 'R-03',
};

export const WHY_CHOOSE_US_SLOT: ImageSlot = {
  id: 'why-choose-us',
  src: '/process/process.jpg',
  alt: 'Tabasamu Sips brewing process in the Nairobi kitchen.',
  width: 1248,
  height: 1248,
  aspect: '1/1',
  sizes: '(max-width: 768px) 100vw, 50vw',
  textOverlay: 'none',
  direction:
    'Editorial process shot for the why-choose-us band. Warm light, product visible, no tourism shorthand.',
  supplied: true,
};

export const ORIGIN_SLOT: ImageSlot = {
  id: 'origin-kitchen',
  src: '/products/origin-kitchen.jpg',
  alt: 'The Nairobi kitchen where Tabasamu Sips is brewed.',
  width: 1600,
  height: 2000,
  aspect: '4/5',
  sizes: '(max-width: 768px) 100vw, 45vw',
  textOverlay: 'none',
  direction:
    '⚠ NO TOURISM SHORTHAND. No acacia, no sunset, no market crowd. A working kitchen: surfaces, vessels, hands mid-task. Brand Book §08.',
  supplied: false,
  blockedBy: 'R-03',
};

/** Brand Book ANCHOR · VI — "hand-glazed bowl of raw ingredient". */
export const INGREDIENTS_SLOT: ImageSlot = {
  id: 'ingredients-fruit',
  src: '/products/pineapple-ginger.jpg',
  alt: 'A hand-glazed bowl of pineapple and raw ginger beside a bottle of Tabasamu Sips, linen curtain at an open window.',
  width: 1800,
  height: 1200,
  aspect: '3/2',
  sizes: '(max-width: 768px) 100vw, 50vw',
  textOverlay: 'none',
  direction:
    'Brand Book ANCHOR · VI — the mood anchor. Linen curtain mid-breeze, wood-grain table, hand-glazed bowl of raw ingredient.',
  supplied: true,
};

export const JOURNAL_SLOT: ImageSlot = {
  id: 'journal-preview',
  src: '/products/journal-1.jpg',
  alt: 'Journal entry illustration.',
  width: 1200,
  height: 800,
  aspect: '3/2',
  sizes: '(max-width: 768px) 100vw, 33vw',
  textOverlay: 'below',
  direction: 'Editorial still life. Same light and surface as the rest of the system.',
  supplied: false,
  blockedBy: 'R-03',
};

/* ================================================================== */

export const ALL_SLOTS: readonly ImageSlot[] = [
  HERO_SLOT,
  ...Object.values(PRODUCT_SLOTS),
  PROCESS_SLOT,
  WHY_CHOOSE_US_SLOT,
  ORIGIN_SLOT,
  INGREDIENTS_SLOT,
  JOURNAL_SLOT,
];

export const suppliedCount = (): number => ALL_SLOTS.filter((s) => s.supplied).length;
export const missingSlots = (): readonly ImageSlot[] => ALL_SLOTS.filter((s) => !s.supplied);

/**
 * Slots that DO ship an image but carry a recorded defect.
 * Today: Pineapple (the "Gluten Free" artwork error).
 */
export const defectiveSlots = (): readonly ImageSlot[] =>
  ALL_SLOTS.filter((s) => s.supplied && s.blockedBy !== undefined);

import { describe, it, expect } from 'vitest';
import {
  validateBundle,
  bundleSelectionCount,
  setBundleQuantity,
  isBundleValid,
  isUnavailable,

  SUBSCRIPTION_OPTIONS,
  SUBSCRIPTIONS_AVAILABLE,
  type Bundle,
  type BundleItem,
  type Inventory,
} from '../../src/domain/catalogue';
import { MOCK_BUNDLES, MOCK_PRODUCTS, MOCK_INVENTORY } from '../../src/adapters/mock/fixtures';
import { productId, variantId } from '../../src/domain/shared';

const inventory = new Map<string, Inventory>(
  MOCK_INVENTORY.map((i) => [i.variantId as string, i])
);

const item = (slug: string, quantity: number): BundleItem => ({
  productId: productId(`prod_${slug}`),
  variantId: variantId(`var_${slug}_1l`),
  quantity,
});

/* ================================================================== *
 * ⛔ D-06 — THE CENTRAL BEHAVIOUR OF THIS PHASE.
 * ================================================================== */

describe('⛔ D-06 — the bundle refuses to validate against a guessed size', () => {
  const bundle = MOCK_BUNDLES.find((b) => b.slug === 'build-your-own')!;

  it('the required bottle count is Unavailable — NOT a default of 6 or 12', () => {
    expect(isUnavailable(bundle.requiredBottles)).toBe(true);
  });

  /**
   * ⚠ THE WHOLE POINT.
   *
   *   Assuming six would produce a builder that LOOKS finished: it would count
   *   to six, go green, and let a customer configure a box the business never
   *   agreed to sell — at a price nobody approved, with a discount that does
   *   not exist.
   *
   *   That bug is invisible in a screenshot and expensive in production. So
   *   validation returns `unknown-requirement` and the UI says so.
   */
  it('⚠ returns `unknown-requirement` rather than falling back to a default', () => {
    const v = validateBundle(bundle, [item('passion', 6)], inventory);
    expect(v.kind).toBe('unknown-requirement');
    expect(isBundleValid(v)).toBe(false);
  });

  it('⚠ NO selection is ever "valid" while the requirement is unknown', () => {
    // Not 1 bottle, not 6, not 12. There is no number that completes a box
    // whose size nobody has defined.
    for (const n of [1, 6, 12, 24]) {
      const v = validateBundle(bundle, [item('passion', n)], inventory);
      expect(v.kind, `${n} bottles must not validate`).toBe('unknown-requirement');
    }
  });

  it('the bundle PRICE is Unavailable — and is NOT the sum of the parts', () => {
    // A bundle priced at exactly the sum of its parts is not a bundle.
    // Presenting one implies a saving that does not exist.
    expect(isUnavailable(bundle.price)).toBe(true);
  });

  it('NO discount is modelled — not even zero', () => {
    // "Save 0%" is a worse lie than saying nothing.
    expect(isUnavailable(bundle.discount)).toBe(true);
  });

  it('even the PRESET box has an unconfirmed size', () => {
    const preset = MOCK_BUNDLES.find((b) => b.slug === 'the-full-range')!;
    expect(isUnavailable(preset.requiredBottles)).toBe(true);
    // But its INTENT is seeded — one of each flavour.
    expect(preset.items.length).toBe(MOCK_PRODUCTS.length);
    expect(bundleSelectionCount(preset.items)).toBe(MOCK_PRODUCTS.length);
  });
});

/* ================================================================== *
 * VALIDATION — once D-06 IS answered.
 *
 * These prove the builder is fully working and waiting on one number.
 * ================================================================== */

describe('validation, once a bottle count exists', () => {
  const withSize = (n: number): Bundle => ({
    ...MOCK_BUNDLES[0],
    requiredBottles: n,
  });

  it('is incomplete below the target', () => {
    const v = validateBundle(withSize(6), [item('passion', 4)], inventory);
    expect(v).toEqual({ kind: 'incomplete', selected: 4, required: 6 });
  });

  it('is over above the target', () => {
    const v = validateBundle(withSize(6), [item('passion', 8)], inventory);
    expect(v).toEqual({ kind: 'over', selected: 8, required: 6 });
  });

  it('is valid at the target', () => {
    const v = validateBundle(
      withSize(6),
      [item('passion', 4), item('grape-ginger', 2)],
      inventory
    );
    expect(v).toEqual({ kind: 'valid', selected: 6 });
    expect(isBundleValid(v)).toBe(true);
  });

  /**
   * ⚠ STOCK IS CHECKED BEFORE THE COUNT.
   *
   *   A customer whose box exceeds stock should be told "only 6 left" — not
   *   "your box is incomplete", when the real problem is that the flavour they
   *   want does not exist in that quantity.
   */
  it('⚠ reports EXCEEDS-STOCK before it reports an incomplete count', () => {
    // Passion has 12 in stock. Ask for 40 — still short of a 60-bottle box.
    const v = validateBundle(withSize(60), [item('passion', 40)], inventory);
    expect(v.kind).toBe('exceeds-stock');
    if (v.kind === 'exceeds-stock') {
      expect(v.available).toBe(12);
    }
  });

  it('does not hard-fail on a product with no inventory record', () => {
    // Unknown stock is not the same as zero stock. It is not a validation error.
    const empty = new Map<string, Inventory>();
    const v = validateBundle(withSize(2), [item('passion', 2)], empty);
    expect(v.kind).toBe('valid');
  });
});

/* ================================================================== *
 * SELECTION — immutable
 * ================================================================== */

describe('bundle selection', () => {
  it('counts across flavours', () => {
    expect(bundleSelectionCount([item('passion', 2), item('beetroot', 3)])).toBe(5);
  });

  it('sets a quantity immutably', () => {
    const before: readonly BundleItem[] = [item('passion', 1)];
    const after = setBundleQuantity(before, productId('prod_beetroot'), variantId('var_beetroot_1l'), 3);
    // The original is untouched.
    expect(before.length).toBe(1);
    expect(bundleSelectionCount(after)).toBe(4);
  });

  it('a quantity of ZERO removes the line entirely', () => {
    // Not a line with quantity 0, which would show as an empty row in the
    // summary. It is gone.
    const before: readonly BundleItem[] = [item('passion', 2)];
    const after = setBundleQuantity(before, productId('prod_passion'), variantId('var_passion_1l'), 0);
    expect(after).toEqual([]);
  });

  it('never stores a negative or fractional quantity', () => {
    const out = setBundleQuantity([], productId('prod_passion'), variantId('var_passion_1l'), -5);
    expect(out).toEqual([]);

    const frac = setBundleQuantity([], productId('prod_passion'), variantId('var_passion_1l'), 2.7);
    expect(frac[0].quantity).toBe(2);
  });
});

/* ================================================================== *
 * ⛔ D-09 — SUBSCRIPTIONS
 * ================================================================== */

describe('⛔ D-09 — subscriptions', () => {
  it('nothing can actually be subscribed to yet', () => {
    // M-PESA has no card-on-file equivalent. The billing model is undecided.
    expect(SUBSCRIPTIONS_AVAILABLE).toBe(false);
    expect(SUBSCRIPTION_OPTIONS.every((o) => !o.available)).toBe(true);
  });

  it('⚠ NO subscription option carries a discount — not even zero', () => {
    for (const o of SUBSCRIPTION_OPTIONS) {
      expect(isUnavailable(o.discount), `${o.id} must not invent a discount`).toBe(true);
    }
  });

  it('eligibility is a CATALOGUE FACT and is safe to model', () => {
    // Marking a product eligible does not claim subscriptions work — it is an
    // attribute you can filter on, not a promise you can buy.
    expect(MOCK_PRODUCTS.every((p) => typeof p.subscriptionEligible === 'boolean')).toBe(true);
  });
});

/* ================================================================== *
 * PRODUCT MODEL — Phase 4 additions
 * ================================================================== */

describe('product model', () => {
  it('every product has a curated position, and they are unique', () => {
    const positions = MOCK_PRODUCTS.map((p) => p.position);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('⛔ D-05 — shelf life is NOT invented (it is regulated food information)', () => {
    for (const p of MOCK_PRODUCTS) {
      expect(isUnavailable(p.storage.shelfLife)).toBe(true);
    }
  });

  it('refrigeration guidance IS stated — a handling fact, not a health claim', () => {
    for (const p of MOCK_PRODUCTS) {
      expect(isUnavailable(p.storage.refrigeration)).toBe(false);
    }
  });

  it('⚠ storage copy makes no medical claim', () => {
    const MEDICAL = ['aids digestion', 'boosts immunity', 'gut health', 'probiotic benefit'];
    for (const p of MOCK_PRODUCTS) {
      if (isUnavailable(p.storage.refrigeration)) continue;
      const copy = p.storage.refrigeration.toLowerCase();
      for (const claim of MEDICAL) {
        expect(copy, `medical claim in storage copy: ${claim}`).not.toContain(claim);
      }
    }
  });

  it('⛔ compare-at price is NULL — no fake discount is fabricated', () => {
    // Inventing a "was KES 700" strikethrough is inventing a discount.
    for (const p of MOCK_PRODUCTS) {
      for (const v of p.variants) {
        expect(v.compareAtPrice).toBeNull();
      }
    }
  });
});

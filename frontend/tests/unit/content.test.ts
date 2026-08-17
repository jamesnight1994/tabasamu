import { describe, it, expect } from 'vitest';
import * as copy from '../../src/content/homepage';
import {
  ALL_SLOTS,
  PRODUCT_SLOTS,
  HERO_SLOT,
  suppliedCount,
  missingSlots,
  defectiveSlots,
} from '../../src/content/image-slots';
import { FLAVOUR_SLUGS } from '../../src/domain/catalogue';

/**
 * PHASE 3 — CONTENT & ASSET INTEGRITY
 *
 * The brand lint checks the source files. These tests check the SEMANTICS of
 * the content: that nothing was fabricated, that the voice holds, and that the
 * image contract is internally consistent.
 */

/** Every string a customer will actually read. */
const allCopyStrings = (): string[] => {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(copy);
  return out;
};

/* ================================================================== *
 * VOICE — Brand Book §07
 * ================================================================== */

describe('homepage copy — brand voice', () => {
  it('contains no exclamation marks anywhere', () => {
    // Brand Book §07. The voice is "someone already at ease".
    for (const s of allCopyStrings()) {
      expect(s, `exclamation mark in: "${s.slice(0, 60)}"`).not.toContain('!');
    }
  });

  const BANNED = [
    'wellness journey',
    'self-care ritual',
    'treat yourself',
    'you deserve',
    'detox',
    'cleanse',
    'purify',
    'ancient wisdom',
    'tribal',
    'game-changer',
    'next-level',
    'unlock your',
    'vibes',
    '-inspired',
  ];

  it.each(BANNED)('never uses the banned phrase "%s"', (phrase) => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).not.toContain(phrase.toLowerCase());
  });

  /**
   * ⚠ URGENCY ARCHITECTURE IS FORBIDDEN (P-07).
   *   No countdowns, no scarcity pressure, no "act now".
   */
  const URGENCY = [
    'hurry',
    'last chance',
    'act now',
    'limited time',
    'selling fast',
    'while stocks last',
    "don't miss",
  ];

  it.each(URGENCY)('uses no urgency pressure ("%s")', (phrase) => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).not.toContain(phrase.toLowerCase());
  });

  /**
   * ⚠ MEDICAL CLAIMS ARE FORBIDDEN AND REGULATED (R-02, NN-05).
   *   Kombucha marketing is the single most common place these appear.
   */
  const MEDICAL = [
    'aids digestion',
    'boosts immunity',
    'supports gut health',
    'improves digestion',
    'cures',
    'heals',
    'probiotic benefits',
    'good for your gut',
    'safe in pregnancy',
  ];

  it.each(MEDICAL)('makes no medical claim ("%s")', (phrase) => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).not.toContain(phrase.toLowerCase());
  });
});

/* ================================================================== *
 * ⚠ THE PROVENANCE PROBLEM — the most important test in this file.
 * ================================================================== */

describe('provenance honesty (D-50)', () => {
  /**
   * D-50 is answered: the base is ROOIBOS.
   *
   * Rooibos grows in the Cederberg region of SOUTH AFRICA. It is not grown in
   * Kenya and essentially cannot be.
   *
   * So the copy may claim Kenyan FRUIT, a Kenyan KITCHEN, and Kenyan CRAFT —
   * but it must NEVER claim Kenyan rooibos. That would be a false provenance
   * claim attached to the brand's central promise.
   */
  it('⚠ never claims the rooibos is Kenyan-grown', () => {
    const joined = allCopyStrings().join(' ').toLowerCase();

    const FALSE_PROVENANCE = [
      'kenyan rooibos',
      'kenyan-grown rooibos',
      'rooibos grown here',
      'rooibos from kenya',
      'locally grown rooibos',
      'our rooibos fields',
      'rooibos grown in kenya',
    ];

    for (const claim of FALSE_PROVENANCE) {
      expect(joined, `FALSE PROVENANCE CLAIM: "${claim}"`).not.toContain(claim);
    }
  });

  it('never claims Kenyan-grown hibiscus (the Brand Book story is not this product)', () => {
    // The Brand Book's origin story says "Kenyan-grown hibiscus". The product
    // is rooibos. Repeating the hibiscus story would describe a different drink.
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).not.toContain('hibiscus');
  });

  it('does claim what IS true — Kenyan fruit and a Nairobi kitchen', () => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).toContain('nairobi');
    // The fruit provenance is the honest, and better, story.
    expect(joined).toMatch(/fruit/);
  });

  it('names rooibos without attaching a provenance claim to it', () => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).toContain('rooibos');
  });
});

/* ================================================================== *
 * NOTHING FABRICATED (NN-05, R-02)
 * ================================================================== */

describe('nothing is fabricated', () => {
  it('⚠ invents no testimonial', () => {
    // A fabricated review is not a placeholder — it is a lie a customer reads
    // and believes, and it is unlawful in several jurisdictions.
    const proof = copy.SOCIAL_PROOF;
    const text = `${proof.title} ${proof.body}`.toLowerCase();

    // It must NOT contain a quoted endorsement.
    expect(text).not.toMatch(/"[^"]{20,}"/);
    // It must say, plainly, that there is nothing yet.
    expect(text).toMatch(/nothing|would rather show you nothing/);
  });

  it('invents no delivery promise (D-21)', () => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    // No zone, no fee, no lead time has been supplied. So none is stated.
    expect(joined).not.toMatch(/free delivery|same.day delivery|next.day delivery/);
    expect(joined).not.toMatch(/ksh\s*\d|kes\s*\d/);
  });

  it('invents no subscription discount (D-09)', () => {
    const sub = `${copy.SUBSCRIPTION.title} ${copy.SUBSCRIPTION.body} ${copy.SUBSCRIPTION.benefits.join(' ')}`;
    // No percentage has been approved, so no percentage is shown.
    expect(sub).not.toMatch(/\d+\s*%/);
    expect(sub.toLowerCase()).not.toMatch(/save \d|discount of/);
  });

  it('states no fermentation duration (D-52 — the sources disagree)', () => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    // Brand Book says six days; the Strategy doc says fourteen. A specific
    // number that is wrong is worse than no number.
    expect(joined).not.toMatch(/(six|6|fourteen|14|seven|7|ten|10)[\s-]*days? of ferment/);
    expect(joined).not.toMatch(/ferments? for \w+ days?/);
  });

  it('names no farm (D-49 — none has been supplied)', () => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).not.toMatch(/farm of|estate|cooperative|smallholder [A-Z]/);
  });

  it('the announcement bar is DISABLED — no approved copy exists', () => {
    expect(copy.ANNOUNCEMENT.enabled).toBe(false);
    expect(copy.ANNOUNCEMENT.message).toBe('');
  });
});

/* ================================================================== *
 * NO TOURISM SHORTHAND (Brand Book §08)
 * ================================================================== */

describe('no tourism shorthand', () => {
  const TOURISM = [
    'safari',
    'acacia',
    'savannah',
    'savanna',
    'sunset over',
    'vibrant spirit',
    'heart of africa',
    'exotic',
    'authentic african',
    'tribal',
    'the mother continent',
  ];

  it.each(TOURISM)('never uses "%s"', (phrase) => {
    const joined = allCopyStrings().join(' ').toLowerCase();
    expect(joined).not.toContain(phrase.toLowerCase());
  });
});

/* ================================================================== *
 * IMAGE SLOT CONTRACT (R-03)
 * ================================================================== */

describe('image slot registry', () => {
  it('✅ PHOTOGRAPHY PARTIALLY LANDED — four flavours supplied', () => {
    // Phase 3 asserted ZERO. That test correctly failed when the images
    // arrived, which is exactly what it was for.
    //
    // Supplied: grape-ginger, pineapple, pineapple-ginger, passion — plus the
    // hero, ingredients slot, and why-choose-us band (reuses pineapple-ginger).
    expect(suppliedCount()).toBe(7);

    const stillMissing = missingSlots().map((s) => s.id);
    expect(stillMissing).toContain('product-beetroot');   // A-05, illegible label
    expect(stillMissing).toContain('product-gooseberry'); // A-07, no asset
    expect(stillMissing).toContain('process-ferment');    // R-03
    expect(stillMissing).toContain('origin-kitchen');     // R-03
  });

  /**
   * ⚠ THE PINEAPPLE ARTWORK DEFECT.
   *
   *   The supplied Pineapple photograph's label reads "GLUTEN FREE Rooibos
   *   Kombucha". Every other bottle reads "CAFFEINE FREE". These are DIFFERENT
   *   REGULATED FOOD CLAIMS.
   *
   *   The client decided (2026-07-14) to use the image, because the SITE says
   *   Caffeine Free (D-13, answered). But the defect must remain RECORDED — so
   *   nobody reuses the asset elsewhere without knowing, and so the artwork
   *   actually gets corrected at the next print run.
   */
  it('⚠ the Pineapple artwork defect is RECORDED, not quietly forgotten', () => {
    const pineapple = PRODUCT_SLOTS.pineapple;
    expect(pineapple.supplied).toBe(true); // the image IS used
    expect(pineapple.blockedBy).toBeDefined();
    expect(pineapple.blockedBy).toContain('Gluten Free');
    expect(pineapple.blockedBy).toContain('PRINT RUN');

    // It appears in the defect list — a supplied asset with a known flaw.
    expect(defectiveSlots().map((s) => s.id)).toContain('product-pineapple');
  });

  it('a supplied slot ships BOTH a landscape and a portrait crop', () => {
    // A bottle is a tall object. The product grid needs 4:5, not a squeezed 3:2.
    for (const slug of ['grape-ginger', 'pineapple', 'pineapple-ginger', 'passion']) {
      const slot = PRODUCT_SLOTS[slug];
      expect(slot.supplied).toBe(true);
      expect(slot.portraitSrc, `${slug} has no portrait crop`).toBeDefined();
      expect(slot.portraitSrc).toContain('-portrait');
    }
  });

  it('an UNSUPPLIED slot has no portrait crop — it points at nothing', () => {
    expect(PRODUCT_SLOTS.beetroot.portraitSrc).toBeUndefined();
    expect(PRODUCT_SLOTS.gooseberry.portraitSrc).toBeUndefined();
  });

  it('declares a slot for every one of the six flavours', () => {
    for (const slug of FLAVOUR_SLUGS) {
      expect(PRODUCT_SLOTS[slug], `no image slot for ${slug}`).toBeDefined();
    }
  });

  it('every slot has real alt text — never "image" or "photo"', () => {
    for (const slot of ALL_SLOTS) {
      expect(slot.alt.length, `${slot.id} alt too short`).toBeGreaterThan(20);
      expect(slot.alt.toLowerCase()).not.toMatch(/^(image|photo|picture) of/);
    }
  });

  it('every slot carries shot direction for the photographer', () => {
    for (const slot of ALL_SLOTS) {
      expect(slot.direction.length, `${slot.id} has no direction`).toBeGreaterThan(40);
    }
  });

  it('every slot declares responsive `sizes` — no 2400px file on a 360px phone', () => {
    for (const slot of ALL_SLOTS) {
      expect(slot.sizes, `${slot.id} missing sizes`).toMatch(/vw|px/);
    }
  });

  it('⚠ the hero declares a DIFFERENT mobile crop, not a squeeze', () => {
    // A 3:2 landscape letterboxed onto a 360px phone is a strip of worktop.
    expect(HERO_SLOT.mobileAspect).toBeDefined();
    expect(HERO_SLOT.mobileAspect).not.toBe(HERO_SLOT.aspect);
  });

  it('the hero reserves a text safe zone — type never crosses the label', () => {
    expect(HERO_SLOT.textOverlay).not.toBe('none');
    expect(HERO_SLOT.textOverlay).toMatch(/safe-zone/);
  });

  it('product slots are PORTRAIT — a bottle is a tall object', () => {
    for (const slot of Object.values(PRODUCT_SLOTS)) {
      expect(slot.aspect, `${slot.id} should be portrait`).toBe('4/5');
    }
  });

  it('⚠ each product slot demands a distinct fruit cue (R-12 mitigation)', () => {
    // The labels are identical by design. At 160px in greyscale the six bottles
    // are the same photograph. The fruit cue is the only in-frame differentiator.
    for (const slot of Object.values(PRODUCT_SLOTS)) {
      expect(slot.direction, `${slot.id} has no R-12 cue`).toContain('R-12');
    }
  });

  it('⛔ Beetroot still needs a reshoot (A-05 — the label is illegible)', () => {
    expect(PRODUCT_SLOTS.beetroot.supplied).toBe(false);
    expect(PRODUCT_SLOTS.beetroot.blockedBy).toContain('RESHOOT');
  });

  it('⛔ Gooseberry still has NO photograph at all (A-07)', () => {
    expect(PRODUCT_SLOTS.gooseberry.supplied).toBe(false);
    expect(PRODUCT_SLOTS.gooseberry.blockedBy).toContain('NO PHOTOGRAPH');
  });
});

/* ================================================================== *
 * FOOTER — Phase 3 content unlock (D-47)
 * ================================================================== */

describe('footer contact unlock', () => {
  it('uses location fallback while street address is unset', async () => {
    const { footerContactRows } = await import('../../src/content/footer');
    const rows = footerContactRows();
    expect(rows[0]).toEqual({
      kind: 'text',
      icon: 'location',
      label: 'Brewed in Nairobi, Kenya',
    });
  });

  it('routes email to mailto when a public inbox is supplied', async () => {
    const { footerContactEmail } = await import('../../src/content/footer');
    expect(footerContactEmail()).toEqual({
      label: 'owagaantony@gmail.com',
      href: 'mailto:owagaantony@gmail.com',
      external: true,
    });
  });

  it('includes phone row when NAV_UTILITY.contact.phone is set', async () => {
    const { footerContactRows } = await import('../../src/content/footer');
    const phoneRow = footerContactRows().find((row) => row.icon === 'phone');
    expect(phoneRow).toEqual({
      kind: 'link',
      icon: 'phone',
      label: '+254 717 207 112',
      href: 'tel:+254717207112',
      external: false,
    });
  });

  it('does not emit sameAs until social hrefs are set', async () => {
    const { footerSocialUrls } = await import('../../src/content/footer');
    expect(footerSocialUrls()).toEqual([]);
  });

  it('hides company registration until D-47 confirms entity details', async () => {
    const { FOOTER } = await import('../../src/content/footer');
    expect(FOOTER.companyRegistration).toBeNull();
    expect(FOOTER.email).toBe('owagaantony@gmail.com');
  });
});

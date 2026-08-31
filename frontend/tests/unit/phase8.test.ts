import { describe, it, expect, beforeEach, afterAll } from 'vitest';

/**
 * PHASE 8 — CONTENT, SEO, ANALYTICS, ACCESSIBILITY & TRUST
 *
 * These tests enforce the Phase 8 guarantees as executable rules:
 *   §1  every new page's copy obeys the brand voice and invents nothing
 *   §2  structured data is WITHHELD, not faked, when its inputs are incomplete
 *   §4  analytics does not fire without environment AND consent
 *   §6  the sitemap, footer and route registry cannot silently disagree
 */

import * as trust from '../../src/content/trust';
import { FAQS } from '../../src/content/faqs';
import { ABOUT_PAGE } from '../../src/content/about';
import { OUR_STORY, INGREDIENTS_PAGE } from '../../src/content/story';
import {
  faqJsonLd,
  breadcrumbJsonLd,
  articleJsonLd,
} from '../../src/lib/seo/structured-data';
import { productJsonLd } from '../../src/lib/seo';
import { PUBLIC_ROUTES } from '../../src/lib/seo/routes';
import {
  DEFAULT_CONSENT,
  decide,
  allowsAnalytics,
  parseConsent,
  hasDecided,
} from '../../src/lib/analytics/consent';
import { setAnalyticsSink, setAnalyticsConsent, track } from '../../src/lib/analytics';
import { resetClientEnv } from '../../src/lib/config/env';
import { footerAllLinks } from '../../src/content/footer';
import { NAV_MENU } from '../../src/content/navigation';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/* ------------------------------------------------------------------ *
 * Collect every customer-facing string in the new content modules.
 * ------------------------------------------------------------------ */

const collectStrings = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectStrings(x, out));
  return out;
};

const newContentStrings = (): string[] => [
  ...collectStrings(trust.TRUST_PAGES),
  ...collectStrings(FAQS),
  ...collectStrings(ABOUT_PAGE),
  ...collectStrings(OUR_STORY),
  ...collectStrings(INGREDIENTS_PAGE),
];

/* ================================================================== *
 * §1 — CONTENT AUDIT: voice holds across the NEW pages too.
 * ================================================================== */

describe('Phase 8 content audit — brand voice on trust/legal/info copy', () => {
  it('contains no exclamation marks', () => {
    for (const s of newContentStrings()) {
      expect(s, `exclamation in: "${s.slice(0, 60)}"`).not.toContain('!');
    }
  });

  const BANNED = [
    'wellness journey',
    'treat yourself',
    'you deserve',
    'detox',
    'cleanse',
    'purify',
    'ancient wisdom',
    'tribal',
    'game-changer',
    'game changer',
    'next-level',
    'next level',
    'unlock',
    'vibes',
    '-inspired',
  ];

  it.each(BANNED)('never uses banned phrase "%s"', (phrase) => {
    const joined = newContentStrings().join(' ').toLowerCase();
    expect(joined).not.toContain(phrase.toLowerCase());
  });

  const MEDICAL = [
    'aids digestion',
    'boosts immunity',
    'supports gut health',
    'improves digestion',
    'cures',
    'heals',
    'good for your gut',
    'safe in pregnancy',
  ];

  it.each(MEDICAL)('makes no medical claim ("%s")', (phrase) => {
    const joined = newContentStrings().join(' ').toLowerCase();
    expect(joined).not.toContain(phrase.toLowerCase());
  });

  const URGENCY = ['hurry', 'last chance', 'act now', 'limited time', 'selling fast', 'while stocks last'];
  it.each(URGENCY)('uses no urgency ("%s")', (phrase) => {
    const joined = newContentStrings().join(' ').toLowerCase();
    expect(joined).not.toContain(phrase.toLowerCase());
  });
});

describe('Phase 8 content audit — provenance honesty (D-50)', () => {
  it('never claims the rooibos is Kenyan-grown', () => {
    const joined = newContentStrings().join(' ').toLowerCase();
    for (const claim of [
      'kenyan rooibos',
      'kenyan-grown rooibos',
      'rooibos grown here',
      'rooibos from kenya',
      'rooibos grown in kenya',
      'locally grown rooibos',
    ]) {
      expect(joined, `FALSE PROVENANCE: "${claim}"`).not.toContain(claim);
    }
  });
});

describe('Phase 8 content audit — no invented facts in awaiting blocks', () => {
  it('every awaiting trust block names a decision ID', () => {
    for (const page of trust.TRUST_PAGES) {
      for (const block of page.blocks) {
        if (block.kind === 'awaiting') {
          expect(block.blockedBy, `${page.slug}: awaiting block missing blockedBy`).toMatch(/D-\d+/);
          expect(block.interim.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('the privacy page does not assert an ODPC registration (D-43)', () => {
    const privacy = collectStrings(trust.PRIVACY).join(' ').toLowerCase();
    // It may MENTION the act and that status is being confirmed, but must not
    // assert "we are registered".
    expect(privacy).not.toContain('we are registered with the odpc');
    expect(privacy).not.toContain('odpc registration number');
  });
});

/* ================================================================== *
 * §2 — STRUCTURED DATA: withheld, not faked.
 * ================================================================== */

describe('Phase 8 SEO — structured data withholding', () => {
  it('productJsonLd stays null until a price exists (D-14)', () => {
    expect(productJsonLd()).toBeNull();
  });

  it('FAQ schema excludes every awaiting-confirmation answer (D-46)', () => {
    const schema = faqJsonLd(FAQS);
    const confirmedCount = FAQS.filter((f) => !f.awaitingConfirmation).length;
    // At least one confirmed answer exists, so schema is non-null.
    expect(schema).not.toBeNull();
    expect(schema!.mainEntity).toHaveLength(confirmedCount);
    // None of the emitted questions is a blocked one.
    const emitted = new Set(schema!.mainEntity.map((q) => q.name));
    for (const f of FAQS) {
      if (f.awaitingConfirmation) {
        expect(emitted.has(f.question), `blocked FAQ leaked into schema: ${f.question}`).toBe(false);
      }
    }
  });

  it('FAQ schema returns null when NOTHING is confirmed', () => {
    const allBlocked = FAQS.map((f) => ({ ...f, awaitingConfirmation: true }));
    expect(faqJsonLd(allBlocked)).toBeNull();
  });

  it('breadcrumb schema needs at least two crumbs', () => {
    expect(breadcrumbJsonLd([{ name: 'Home', path: '/' }])).toBeNull();
    const two = breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Privacy', path: '/privacy' },
    ]);
    expect(two).not.toBeNull();
    expect(two!.itemListElement).toHaveLength(2);
    expect(two!.itemListElement[0].position).toBe(1);
  });

  it('article schema returns null without a publication date', () => {
    expect(articleJsonLd({ headline: 'A post', path: '/journal/a-post' })).toBeNull();
    const withDate = articleJsonLd({
      headline: 'A post',
      path: '/journal/a-post',
      datePublished: '2026-07-15',
    });
    expect(withDate).not.toBeNull();
    // No author invented when none supplied.
    expect(withDate!.author).toBeUndefined();
  });
});

/* ================================================================== *
 * §4 — ANALYTICS: environment AND consent, PII-free.
 * ================================================================== */

describe('Phase 8 analytics — consent model', () => {
  it('defaults to no decision and denies analytics', () => {
    expect(hasDecided(DEFAULT_CONSENT)).toBe(false);
    expect(allowsAnalytics(DEFAULT_CONSENT)).toBe(false);
  });

  it('an opt-in decision allows analytics; opt-out does not', () => {
    expect(allowsAnalytics(decide(true))).toBe(true);
    expect(allowsAnalytics(decide(false))).toBe(false);
  });

  it('a malformed or stale stored value degrades to no-decision', () => {
    expect(hasDecided(parseConsent('not json'))).toBe(false);
    expect(hasDecided(parseConsent(JSON.stringify({ version: 999, analytics: true })))).toBe(false);
    expect(hasDecided(parseConsent(null))).toBe(false);
  });
});

describe('Phase 8 analytics — track() is gated', () => {
  const events: string[] = [];

  beforeEach(() => {
    events.length = 0;
    setAnalyticsSink({ track: (e) => events.push(e.name) });
    // Simulate analytics ENABLED for the environment, then clear the memoised
    // client env so track() reads the new value.
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'true';
    resetClientEnv();
  });

  it('does not fire without consent even when enabled', () => {
    setAnalyticsConsent(DEFAULT_CONSENT);
    track({ name: 'product_viewed', slug: 'passion' });
    expect(events).toHaveLength(0);
  });

  it('fires once consent is granted', () => {
    setAnalyticsConsent(decide(true));
    track({ name: 'product_viewed', slug: 'passion' });
    expect(events).toEqual(['product_viewed']);
  });

  it('stops firing when consent is withdrawn', () => {
    setAnalyticsConsent(decide(true));
    track({ name: 'cart_viewed', itemCount: 2 });
    setAnalyticsConsent(decide(false));
    track({ name: 'cart_viewed', itemCount: 2 });
    expect(events).toEqual(['cart_viewed']); // only the first
  });

  afterAll(() => {
    // Don't leak the enabled flag into other test files.
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'false';
    resetClientEnv();
    setAnalyticsConsent(DEFAULT_CONSENT);
  });
});

/* ================================================================== *
 * §6 — ROUTE INTEGRITY: sitemap / footer / registry agree.
 * ================================================================== */

describe('Phase 8 trust — route integrity', () => {
  it('about us is the canonical brand story route', () => {
    expect(PUBLIC_ROUTES.some((r) => r.path === '/about')).toBe(true);
    expect(PUBLIC_ROUTES.some((r) => r.path === '/our-story')).toBe(false);
    expect(PUBLIC_ROUTES.some((r) => r.path === '/ingredients')).toBe(false);
  });

  it('primary nav links to about us once', () => {
    const aboutLinks = NAV_MENU.filter((entry) => entry.href === '/about');
    expect(aboutLinks).toHaveLength(1);
    expect(aboutLinks[0]?.label).toBe('About us');
    expect(NAV_MENU.some((entry) => entry.href === '/our-story')).toBe(false);
    expect(NAV_MENU.some((entry) => entry.href === '/ingredients')).toBe(false);
  });

  it('legacy story routes still resolve to redirect pages', () => {
    const storefront = resolve(__dirname, '../../src/app/(storefront)');
    expect(existsSync(resolve(storefront, 'our-story/page.tsx'))).toBe(true);
    expect(existsSync(resolve(storefront, 'ingredients/page.tsx'))).toBe(true);
  });

  it('every trust content page has a matching public route', () => {
    for (const page of trust.TRUST_PAGES) {
      const match = PUBLIC_ROUTES.find((r) => r.path === `/${page.slug}`);
      expect(match, `no public route for /${page.slug}`).toBeDefined();
    }
  });

  it('no public route uses a trailing slash (canonical hygiene)', () => {
    for (const r of PUBLIC_ROUTES) {
      if (r.path !== '/') {
        expect(r.path.endsWith('/'), `trailing slash on ${r.path}`).toBe(false);
      }
    }
  });

  it('priorities are within [0,1]', () => {
    for (const r of PUBLIC_ROUTES) {
      expect(r.priority).toBeGreaterThanOrEqual(0);
      expect(r.priority).toBeLessThanOrEqual(1);
    }
  });

  /**
   * ⚠ THE REGRESSION THIS PHASE CLOSED. The footer linked to 12 pages that did
   *   not exist — every legal/trust link was a 404. This asserts every footer
   *   href now resolves to a real page file (or a known dynamic/section route).
   */
  it('every footer link resolves to a real page (no 404 in the footer)', () => {
    const storefront = resolve(__dirname, '../../src/app/(storefront)');
    // Dynamic routes resolve to a [slug] folder, not a literal segment folder.
    const DYNAMIC_PREFIXES = ['/bundles/'];

    for (const link of footerAllLinks()) {
      if (DYNAMIC_PREFIXES.some((p) => link.href.startsWith(p))) {
        // The bundle route is /bundles/[slug] — assert the dynamic page exists.
        const dyn = resolve(storefront, 'bundles/[slug]/page.tsx');
        expect(existsSync(dyn), `dynamic route for ${link.href} missing`).toBe(true);
        continue;
      }
      const seg = link.href.replace(/^\//, '');
      const pageFile = resolve(storefront, seg, 'page.tsx');
      expect(existsSync(pageFile), `footer link ${link.href} has no page.tsx`).toBe(true);
    }
  });
});

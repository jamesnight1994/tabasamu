import type { Metadata } from 'next';
import { pageMeta } from '../../lib/seo';
import { getAdapters } from '../../adapters';
import { META } from '../../content/homepage';
import type { Inventory } from '../../domain/catalogue';

import { AnnouncementBar } from '../../components/storefront/AnnouncementBar';
import { Hero } from '../../components/storefront/Hero';
import { FlavoursSection } from '../../components/storefront/FlavoursSection';
import { CollectionPreview } from '../../components/storefront/CollectionPreview';
import { Process } from '../../components/storefront/Sections';
import { SubscribeSection } from '../../components/storefront/SubscribeSection';

/**
 * HOMEPAGE — a SERVER COMPONENT.
 *
 * ⚠ ARCHITECTURE. Only four things on this page ship JavaScript:
 *
 *     AnnouncementBar   dismissal state
 *     CollectionPreview quick-add feedback
 *     Process           the Radix accordion (progressive disclosure)
 *     SubscribeSection  newsletter form state (client leaf)
 *
 *   Everything else — the hero, the flavour promo, the proposition, the
 *   ingredients, the origin story, the subscription explainer, the social-proof
 *   frame, wholesale, the journal — is a server component and arrives as plain HTML.
 *
 *   On a mid-range Android over Nairobi 3G, shipping twelve sections of static
 *   prose as React would be bytes the customer pays for and CPU they wait on,
 *   for no interactivity at all. [P-10]
 *
 * ⚠ DATA comes through the PORT. This page does not know a mock adapter is
 *   behind `getAdapters()`. At Gate G2 the adapter is swapped for HTTP and this
 *   file does not change. [R-13]
 *
 *   Fetching on the server also puts the product grid in the initial HTML —
 *   not behind a spinner that resolves after a round trip.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SECTION ORDER — an argument, not a list.
 *
 *   1. Hero .......... what is this, can I buy it
 *   2. Flavours ...... three featured flavours (editorial bento)
 *   3. Collection .... what are my options, what do they cost (full range)
 *   4. Proposition ... why should I care          (three facts)
 *   5. Ingredients ... what is actually in it
 *   6. Process ....... why Tabasamu (proposition accordion)
 *   7. Origin ........ who makes it
 *   8. Subscription .. can I make this a habit
 *   9. Social proof .. does anyone else drink it
 *  10. Wholesale ..... I am a business
 *  11. Journal ....... is this brand alive
 *  12. Newsletter .... keep me posted
 *
 * ⚠ COMMERCE COMES SECOND, NOT LAST. An editorial homepage that buries its
 *   products under a thousand words of origin story is a magazine, not a shop.
 *   The customer who arrived ready to buy can buy in two scrolls; the one who
 *   wants the story finds it immediately after. Neither is made to serve the
 *   other. [P-02]
 *
 * ⚠ THE MANTRA APPEARS ONCE — in Origin. The Footer suppresses its own copy on
 *   this route (see `layout.tsx`). Brand Book: "once per page, maximum".
 * ─────────────────────────────────────────────────────────────────────
 */

export const metadata: Metadata = pageMeta({
  // ✅ D-13 answered — the descriptor may now appear in the title.
  title: META.title,
  description: META.description,
  path: '/',
});

export default async function HomePage() {
  const adapters = getAdapters();

  // ACTIVE only. Gooseberry is `draft` (no photograph exists — A-07) and is
  // therefore correctly absent from the storefront.
  const products = await adapters.products.list();

  const entries = await Promise.all(
    products.map(async (p) => {
      const inv = await adapters.inventory.check(p.variants[0].id);
      return [p.variants[0].id as string, inv] as const;
    })
  );

  const inventory = new Map<string, Inventory>(
    entries.filter((e): e is readonly [string, Inventory] => e[1] !== null)
  );

  return (
    <>
      {/* ⛔ Disabled by default — no approved announcement copy exists (D-21). */}
      <AnnouncementBar />

      <Hero />
      <FlavoursSection />
      <CollectionPreview products={products} inventory={inventory} />
      {/* <Proposition /> */}
      <Process />
      <SubscribeSection />
      {/* <Origin /> */}
      {/* <Subscription /> */}
      {/* <SocialProof /> */}
      {/* <Wholesale /> */}
      {/* <JournalPreview /> */}
      
    </>
  );
}

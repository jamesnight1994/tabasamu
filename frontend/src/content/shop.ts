/**
 * SHOP — catalogue listing copy (hero + toolbar chrome).
 *
 * VOICE (Brand Book §07). No exclamation marks, no urgency, no invented scarcity.
 * Filter/sort semantics stay in `domain/catalogue/query.ts` — this file is copy only.
 */

export const SHOP_PAGE = {
  meta: {
    title: 'Shop — caffeine-free rooibos kombucha',
    description:
      'Six flavours of small-batch rooibos kombucha, brewed in Nairobi and finished with Kenyan fruit. One litre, no caffeine.',
  },
  hero: {
    eyebrow: 'The range',
    title: 'Shop',
  },
  catalogue: {
    orderByLabel: 'Order by',
    sortPlaceholder: 'Sort by',
    sortClearLabel: 'Clear sort',
    emptyTitle: 'Nothing matches these filters.',
    emptyBody: 'Clear a flavour or change the sort and try again.',
    viewGridLabel: 'Grid view',
    viewListLabel: 'List view',
    flavourFilterHeading: 'Flavour',
  },
} as const;

export function shopResultsLabel(matched: number): string {
  return matched === 1 ? '1 product' : `${matched} products`;
}

export function shopResultsOfCatalogue(matched: number, total: number): string {
  return `${matched} of ${total} products`;
}

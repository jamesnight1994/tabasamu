import { FLAVOUR_PROMO, FLAVOUR_PROMO_COMPACT, FLAVOUR_PROMO_FEATURE } from '../../content/flavour-promo';
import { FlavourPromoCard } from './FlavourPromoCard';

/** Same horizontal rhythm as hero and navbar. */
const SITE_CONTAINER = 'container mx-auto w-full max-w-[--container-max] px-6 md:px-12';

/**
 * FLAVOURS SECTION — 3-card bento grid (post-hero).
 * Feature card left; two compact cards stacked right on lg+.
 */
export function FlavoursSection() {
  return (
    <section
      id={FLAVOUR_PROMO.sectionId}
      aria-labelledby="flavours-promo-heading"
      className={`${SITE_CONTAINER} py-12 md:py-12 lg:py-20`}
    >
      <h2 id="flavours-promo-heading" className="sr-only">
        Featured flavours
      </h2>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-2 lg:gap-6 px-5">
        <div className="h-full lg:row-span-2 [&>article]:h-full">
          <FlavourPromoCard card={FLAVOUR_PROMO_FEATURE} />
        </div>

        {FLAVOUR_PROMO_COMPACT.map((card) => (
          <div key={card.id} className="h-full [&>*]:h-full [&_article]:h-full">
            <FlavourPromoCard card={card} />
          </div>
        ))}
      </div>
    </section>
  );
}

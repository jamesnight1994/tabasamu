import { CONTACT_PAGE } from '../../content/contact';
import { CONTACT_HERO_SLOT } from '../../content/image-slots';
import { SlotImage } from '../editorial/SlotImage';
import { SeoBreadcrumbs } from '../seo/StructuredData';
import { cn } from '../../lib/utils/cn';

const SITE_CONTAINER =
  'container mx-auto w-full max-w-[--container-max] px-6 md:px-12 lg:px-16';

const BREADCRUMB_TRAIL = [
  { name: 'Home', path: '/' },
  { name: CONTACT_PAGE.hero.title, path: '/contact' },
] as const;

export function ContactHero() {
  const { eyebrow, title } = CONTACT_PAGE.hero;

  return (
    <section
      aria-labelledby="contact-hero-heading"
      data-ground="dark"
      className="contact-hero relative min-h-[clamp(12rem,32vh,22rem)] overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <SlotImage slot={CONTACT_HERO_SLOT} fill rounded={false} priority className="size-full" />
        <div className="contact-hero-overlay absolute inset-0 z-[1]" />
      </div>

      <div
        className={cn(
          SITE_CONTAINER,
          'relative z-[2] flex min-h-[clamp(12rem,32vh,22rem)] flex-col justify-end py-8 md:py-10'
        )}
      >
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="flex flex-col gap-1.5 md:relative md:min-h-[1.75rem] md:flex-row md:items-start md:justify-between">
            <p className="contact-hero-eyebrow label-caps !pb-1">{eyebrow}</p>
            <SeoBreadcrumbs
              trail={BREADCRUMB_TRAIL}
              className={cn(
                'contact-hero-breadcrumbs md:absolute md:right-0 md:top-0',
                '[&_a]:font-semibold [&_a]:text-[color-mix(in_oklab,var(--color-ink-inverse)_70%,transparent)]',
                '[&_a]:underline [&_a]:decoration-[color-mix(in_oklab,var(--color-ink-inverse)_42%,transparent)]',
                '[&_a]:underline-offset-[0.22em]',
                'hover:[&_a]:text-[color-mix(in_oklab,var(--color-ink-inverse)_88%,transparent)]',
                'hover:[&_a]:decoration-[color-mix(in_oklab,var(--color-ink-inverse)_72%,transparent)]',
                '[&_[aria-current=page]]:text-[color-mix(in_oklab,var(--color-ink-inverse)_54%,transparent)]',
                '[&_[aria-current=page]]:font-semibold [&_[aria-current=page]]:no-underline',
                '[&_span[aria-hidden=true]]:text-[color-mix(in_oklab,var(--color-ink-inverse)_48%,transparent)]'
              )}
            />
          </div>

          <h1
            id="contact-hero-heading"
            className="-mt-3 pb-5 contact-hero-heading max-w-[14ch] font-display text-[length:--text-h2] leading-[--leading-tight] tracking-[--tracking-hero] md:text-[length:--text-hero]"
          >
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}

import { CONTACT_PAGE } from '../../content/contact';
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollRevealStagger,
} from '@/components/motion/ScrollReveal';
import { ContactValuePropCard } from './ContactValuePropCard';
import { ContactValuePropsGrid } from './ContactValuePropsGrid';
import { cn } from '../../lib/utils/cn';

const SITE_CONTAINER =
  'container mx-auto w-full max-w-[--container-max] px-6 md:px-12 lg:px-16';

export function ContactValueProps() {
  const { eyebrow, title, intro, points } = CONTACT_PAGE.valueProps;

  return (
    <section
      aria-labelledby="contact-value-props-heading"
      className="contact-value-props bg-[--color-link] text-[--color-ink-inverse]"
      data-ground="dark"
    >
      <div className={cn(SITE_CONTAINER, 'py-12 md:py-16')}>
        <div className="!px-4 pb-8 contact-section-inset flex flex-col gap-8 md:gap-10">
          <ScrollReveal delay={0} y={18}>
            <header className="flex max-w-2xl flex-col gap-3 md:max-w-3xl md:gap-4">
              <div className="flex items-center gap-2.5">
                {/* <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-[--color-accent]"
                /> */}
                <p className="label-caps text-[--color-ink-inverse]/65">{eyebrow}</p>
              </div>
              <h2
                id="contact-value-props-heading"
                className="font-display text-[length:--text-h2] font-normal leading-[--leading-snug] text-[--color-ink-inverse] md:text-[clamp(1.75rem,3vw,2.5rem)]"
              >
                {title}
              </h2>
              <p className="max-w-xl text-[length:--text-body] leading-[--leading-body] text-[--color-ink-inverse]/75 md:text-[length:--text-small]">
                {intro}
              </p>
            </header>
          </ScrollReveal>

          <ContactValuePropsGrid>
            <ScrollRevealStagger
              as="div"
              staggerChildren={0.16}
              delayChildren={0.05}
              className="contact-value-props-grid grid gap-4 md:grid-cols-3 md:gap-5"
            >
              {points.map((point, i) => (
                <ScrollRevealItem as="div" key={point.title} className="h-full min-h-0">
                  <ContactValuePropCard index={i} title={point.title} body={point.body} />
                </ScrollRevealItem>
              ))}
            </ScrollRevealStagger>
          </ContactValuePropsGrid>
        </div>
      </div>
    </section>
  );
}

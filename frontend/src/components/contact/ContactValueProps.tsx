import { CONTACT_PAGE } from '../../content/contact';
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
      <div className={cn(SITE_CONTAINER, 'py-16 md:py-20')}>
        <div className="contact-section-inset !px-4">
          <header className="mb-10 flex max-w-2xl flex-col gap-3 md:mb-14 md:gap-4">
            <p className="label-caps text-[--color-ink-inverse]/65">{eyebrow}</p>
            <h2
              id="contact-value-props-heading"
              className="font-display text-[length:--text-h2] font-normal leading-[--leading-snug] text-[--color-ink-inverse] md:text-[clamp(1.75rem,3vw,2.5rem)]"
            >
              {title}
            </h2>
            <p className="text-[length:--text-body] leading-[--leading-body] text-[--color-ink-inverse]/75">
              {intro}
            </p>
          </header>

          <ul className="grid gap-5 md:grid-cols-3 md:gap-6">
            {points.map((point, i) => (
              <li
                key={point.title}
                className="contact-value-prop-card flex flex-col gap-4 rounded-[20px] border border-[--color-ink-inverse]/12 bg-[--color-ink-inverse]/[0.07] p-6 backdrop-blur-[2px] md:p-7"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    aria-hidden="true"
                    className="font-display text-[length:--text-h3] leading-none text-[--color-ink-inverse]/35"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-[--color-ink-inverse]/15"
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-display text-[length:--text-h4] leading-[--leading-snug] text-[--color-ink-inverse]">
                    {point.title}
                  </h3>
                  <p className="max-w-[28ch] text-[length:--text-body] leading-[--leading-body] text-[--color-ink-inverse]/78">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

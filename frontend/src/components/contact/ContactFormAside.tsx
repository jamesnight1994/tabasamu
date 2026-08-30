import { Mail, MapPin, Phone } from 'lucide-react';
import { CONTACT_PAGE } from '../../content/contact';
import { footerContactEmail } from '../../content/footer';
import { NAV_UTILITY } from '../../content/navigation';
import { cn } from '../../lib/utils/cn';

const ICON_TILE = cn(
  'inline-flex size-11 shrink-0 items-center justify-center rounded-[10px]',
  'bg-[--color-link] text-[--color-ink-inverse]'
);

export function ContactFormAside() {
  const { aside } = CONTACT_PAGE.form;
  const email = footerContactEmail();
  const phone = NAV_UTILITY.contact.phone;
  const phoneHref = NAV_UTILITY.contact.phoneHref;

  return (
    <div className="flex flex-col justify-center gap-8 md:gap-10 md:py-4 md:pr-4 lg:pr-8">
      <header className="flex flex-col gap-4">
        <p className="label-caps text-[--color-ink-subtle]">{aside.eyebrow}</p>
        <h2
          id="contact-form-heading"
          className="font-display text-[length:--text-h2] font-normal leading-[1.08] tracking-[--tracking-tight] text-[--color-ink] md:text-[clamp(2rem,3.5vw,2.75rem)]"
        >
          {aside.titleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        <p className="max-w-md text-[length:--text-body] leading-[--leading-body] text-[--color-ink-muted]">
          {aside.body}
        </p>
      </header>

      <ul className="flex flex-col gap-6">
        <li className="flex items-start gap-4">
          <span className={ICON_TILE} aria-hidden>
            <Mail className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <span className="text-[length:--text-caption] text-[--color-ink-subtle]">
              {aside.contactLabels.email}
            </span>
            <a
              href={email.href}
              className="font-body text-[length:--text-body] font-medium text-[--color-ink] no-underline hover:text-[--color-link] hover:underline"
            >
              {email.label}
            </a>
          </div>
        </li>

        {phone && phoneHref ? (
          <li className="flex items-start gap-4">
            <span className={ICON_TILE} aria-hidden>
              <Phone className="size-5" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
              <span className="text-[length:--text-caption] text-[--color-ink-subtle]">
                {aside.contactLabels.phone}
              </span>
              <a
                href={phoneHref}
                className="font-body text-[length:--text-body] font-medium text-[--color-ink] no-underline hover:text-[--color-link] hover:underline"
              >
                {phone}
              </a>
            </div>
          </li>
        ) : null}

        <li className="flex items-start gap-4">
          <span className={ICON_TILE} aria-hidden>
            <MapPin className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <span className="text-[length:--text-caption] text-[--color-ink-subtle]">
              {aside.contactLabels.location}
            </span>
            <span className="font-body text-[length:--text-body] font-medium text-[--color-ink]">
              {NAV_UTILITY.contact.locationFallback}
            </span>
          </div>
        </li>
      </ul>
    </div>
  );
}
